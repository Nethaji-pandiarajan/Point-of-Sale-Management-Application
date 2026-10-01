import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeftRight } from 'lucide-react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { layout } from '../constants/layout';
import AppHeader from '../components/AppHeader';
import SearchBar from '../components/SearchBar';
import TableCard from '../components/TableCard';
import TableActionSheet from '../components/TableActionSheet';
import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';
import { useToast } from '../context/ToastContext';
import { tableApi } from '../api/tableApi';
import { orderApi } from '../api/orderApi';

export default function TablesScreen({ navigation }) {
  const { selectTable, guestCount, setGuests, setActiveOrder, refreshTrigger, triggerRefresh } = useOrder();
  const { showToast } = useToast();

  const { user, isAuthenticated } = useAuth();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [scopeTab, setScopeTab] = useState('my'); // 'my' or 'all'

  // Modal sheet state
  const [selectedSheetTable, setSelectedSheetTable] = useState(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const fetchTables = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await tableApi.getTables({ limit: 50 });
      if (res && res.data) {
        setTables(res.data);
        setError(null);
      }
    } catch (err) {
      if (err.status !== 401) {
        console.warn('Failed to fetch tables:', err.message);
        setError(err.message || 'Could not load tables');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchTables();
    // Only poll if authenticated
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      fetchTables();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchTables, refreshTrigger, isAuthenticated]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTables();
  };

  // Counts
  const myTablesCount = useMemo(() => {
    return tables.filter(t => t.assignedWaiterId === user?.id && t.status !== 'available').length;
  }, [tables, user?.id]);

  const availableCount = tables.filter(t => t.status === 'available').length;
  const occupiedCount = tables.filter(t => t.status === 'occupied').length;
  const reservedCount = tables.filter(t => t.status === 'reserved').length;

  // Filtered tables
  const displayedTables = useMemo(() => {
    return tables.filter(t => {
      // Scope filter
      if (scopeTab === 'my') {
        if (t.assignedWaiterId !== user?.id || t.status === 'available') {
          return false;
        }
      } else {
        const matchesFilter =
          activeFilter === 'all' ? true : t.status?.toLowerCase() === activeFilter;
        if (!matchesFilter) return false;
      }

      // Search filter
      const term = search.toLowerCase().trim();
      const matchesSearch =
        !term ||
        t.tableCode?.toLowerCase().includes(term) ||
        t.tableNumber?.toLowerCase().includes(term);
      return matchesSearch;
    });
  }, [tables, scopeTab, user?.id, activeFilter, search]);

  const handleTablePress = (table) => {
    setSelectedSheetTable(table);
    selectTable(table);
    setSheetVisible(true);
  };

  const handleStartOrder = () => {
    setSheetVisible(false);
    navigation.navigate('TakeOrder', {
      table: selectedSheetTable,
      isAddMore: selectedSheetTable.status === 'occupied',
      guestCount,
    });
  };

  const handleViewOrder = () => {
    setSheetVisible(false);
    navigation.navigate('KitchenStatus', {
      tableNo: selectedSheetTable.tableNumber || selectedSheetTable.tableCode,
      orderId: selectedSheetTable.activeOrderId,
    });
  };

  const handleViewBill = () => {
    setSheetVisible(false);
    navigation.navigate('BillSettlement', {
      tableNo: selectedSheetTable.tableNumber || selectedSheetTable.tableCode,
      orderId: selectedSheetTable.activeOrderId,
      table: selectedSheetTable,
    });
  };

  const handleMarkServed = async () => {
    setSheetVisible(false);
    try {
      if (selectedSheetTable.activeOrderId) {
        await orderApi.updateOrderStatus(selectedSheetTable.activeOrderId, 'served');
      }
      showToast({ message: `${selectedSheetTable.tableNumber || selectedSheetTable.tableCode} marked as Served!`, type: 'success' });
      triggerRefresh();
    } catch (err) {
      showToast({ message: 'Order marked served locally.', type: 'info' });
      triggerRefresh();
    }
  };

  const handleTakeOverTable = async (table) => {
    setSheetVisible(false);
    if (!table?.activeOrderId) {
      showToast({ message: 'No active order found to take over.', type: 'error' });
      return;
    }
    try {
      const res = await orderApi.takeoverOrder(table.activeOrderId);
      if (res && (res.success || res.status === 'success')) {
        showToast({
          message: `Successfully took over Table ${table.tableNumber || table.tableCode}!`,
          type: 'success',
        });
        triggerRefresh();
        fetchTables();
      } else {
        showToast({ message: res?.message || 'Could not take over table.', type: 'error' });
      }
    } catch (err) {
      console.error('Takeover error:', err);
      showToast({ message: err.message || 'Error taking over table', type: 'error' });
    }
  };

  return (
    <View style={styles.screen}>
      <AppHeader title="Saleiz Waiter" subtitle="Floor A • Shift Active" />

      <View style={styles.container}>
        {/* Subheader Title & Switch Floor */}
        <View style={styles.subHeader}>
          <View>
            <Text style={styles.pageTitle}>Tables</Text>
            <Text style={styles.pageSubtitle}>Select a table to start or manage an order</Text>
          </View>
          <TouchableOpacity style={styles.swapBtn} activeOpacity={0.8}>
            <ArrowLeftRight size={18} color={colors.primaryContainer} />
          </TouchableOpacity>
        </View>

        {/* Scope Tabs: [ My Tables ] [ All Tables ] */}
        <View style={styles.scopeTabsContainer}>
          <TouchableOpacity
            style={[styles.scopeTabBtn, scopeTab === 'my' && styles.scopeTabBtnActive]}
            onPress={() => setScopeTab('my')}
            activeOpacity={0.8}
          >
            <Text style={[styles.scopeTabBtnText, scopeTab === 'my' && styles.scopeTabBtnTextActive]}>
              My Tables ({myTablesCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.scopeTabBtn, scopeTab === 'all' && styles.scopeTabBtnActive]}
            onPress={() => setScopeTab('all')}
            activeOpacity={0.8}
          >
            <Text style={[styles.scopeTabBtnText, scopeTab === 'all' && styles.scopeTabBtnTextActive]}>
              All Tables ({tables.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Search table (e.g. TAB01)..."
          />
        </View>

        {/* Filter Pills (All Tables scope) */}
        {scopeTab === 'all' ? (
          <View style={styles.filtersRow}>
            <TouchableOpacity
              style={[styles.filterPill, activeFilter === 'all' && styles.filterPillActive]}
              onPress={() => setActiveFilter('all')}
            >
              <Text style={[styles.filterText, activeFilter === 'all' && styles.filterTextActive]}>
                All
              </Text>
              <View style={[styles.filterCount, activeFilter === 'all' && styles.filterCountActive]}>
                <Text style={[styles.filterCountText, activeFilter === 'all' && styles.filterCountTextActive]}>
                  {tables.length}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, activeFilter === 'available' && styles.filterPillActive]}
              onPress={() => setActiveFilter('available')}
            >
              <View style={[styles.filterDot, { backgroundColor: colors.readyGreen }]} />
              <Text style={[styles.filterText, activeFilter === 'available' && styles.filterTextActive]}>
                Available
              </Text>
              <Text style={styles.filterSubCount}>{availableCount}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, activeFilter === 'occupied' && styles.filterPillActive]}
              onPress={() => setActiveFilter('occupied')}
            >
              <View style={[styles.filterDot, { backgroundColor: colors.secondary }]} />
              <Text style={[styles.filterText, activeFilter === 'occupied' && styles.filterTextActive]}>
                Occupied
              </Text>
              <Text style={styles.filterSubCount}>{occupiedCount}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, activeFilter === 'reserved' && styles.filterPillActive]}
              onPress={() => setActiveFilter('reserved')}
            >
              <View style={[styles.filterDot, { backgroundColor: colors.outline }]} />
              <Text style={[styles.filterText, activeFilter === 'reserved' && styles.filterTextActive]}>
                Reserved
              </Text>
              <Text style={styles.filterSubCount}>{reservedCount}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.myScopeInfoRow}>
            <Text style={styles.myScopeInfoText}>
              {myTablesCount === 0
                ? 'No tables currently assigned to you'
                : `${myTablesCount} ${myTablesCount === 1 ? 'table' : 'tables'} actively assigned to you`}
            </Text>
          </View>
        )}

        {/* Table 2-Column Grid */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primaryContainer} />
            <Text style={styles.loadingText}>Loading floor layout...</Text>
          </View>
        ) : (
          <FlatList
            data={displayedTables}
            keyExtractor={(item) => String(item.id || item.tableCode)}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryContainer} />
            }
            renderItem={({ item }) => (
              <TableCard table={item} onPress={handleTablePress} />
            )}
            ListEmptyComponent={
              scopeTab === 'my' ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyTitle}>No Active Tables</Text>
                  <Text style={styles.emptySub}>
                    You have no active tables. Pick an available table in All Tables to start a new order.
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyActionBtn}
                    onPress={() => setScopeTab('all')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.emptyActionBtnText}>View All Tables</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyTitle}>No tables found</Text>
                  <Text style={styles.emptySub}>Try adjusting your filter or search query</Text>
                </View>
              )
            }
          />
        )}
      </View>

      {/* Table Detail Bottom Sheet */}
      <TableActionSheet
        visible={sheetVisible}
        table={selectedSheetTable}
        guestCount={guestCount}
        onGuestCountChange={setGuests}
        onClose={() => setSheetVisible(false)}
        onStartOrder={handleStartOrder}
        onViewOrder={handleViewOrder}
        onViewBill={handleViewBill}
        onMarkServed={handleMarkServed}
        onTakeOver={handleTakeOverTable}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pageTitle: {
    ...typography.headlineLg,
    color: colors.onSurface,
    fontWeight: '800',
  },
  pageSubtitle: {
    ...typography.captionSm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  swapBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSection: {
    marginBottom: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9999,
    gap: 5,
  },
  filterPillActive: {
    backgroundColor: colors.primaryContainer,
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  filterText: {
    ...typography.captionSm,
    color: colors.onSurface,
    fontWeight: '700',
  },
  filterTextActive: {
    color: colors.onPrimary,
  },
  filterCount: {
    backgroundColor: colors.surfaceContainerHighest,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 9999,
  },
  filterCountActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  filterCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
  },
  filterCountTextActive: {
    color: colors.onPrimary,
  },
  filterSubCount: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  columnWrapper: {
    gap: 12,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  emptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    ...typography.titleSm,
    color: colors.onSurface,
    fontWeight: '800',
  },
  emptySub: {
    ...typography.captionSm,
    color: colors.onSurfaceVariant,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyActionBtn: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.primaryContainer,
  },
  emptyActionBtnText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  scopeTabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  scopeTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  scopeTabBtnActive: {
    backgroundColor: colors.surfaceContainerLowest,
    ...layout.shadows.sm,
  },
  scopeTabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  scopeTabBtnTextActive: {
    color: colors.primaryContainer,
    fontWeight: '800',
  },
  myScopeInfoRow: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  myScopeInfoText: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
});
