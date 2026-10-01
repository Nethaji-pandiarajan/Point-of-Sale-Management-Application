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
import {
  Clock,
  Receipt,
  CheckCircle2,
  ChevronRight,
  Utensils,
  CreditCard,
  DollarSign,
  AlertCircle,
} from 'lucide-react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { layout } from '../constants/layout';
import AppHeader from '../components/AppHeader';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';
import { orderApi } from '../api/orderApi';
import { getOrderTimingInfo } from '../utils/orderTiming';

export default function ActiveOrdersScreen({ navigation }) {
  const { user, isAuthenticated } = useAuth();
  const { setActiveOrder, refreshTrigger } = useOrder();

  const [scope, setScope] = useState('my'); // 'my' | 'all'
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed'
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await orderApi.getOrders({ limit: 50 });
      if (res && res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      if (err.status !== 401) {
        console.warn('Failed to fetch orders:', err.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchOrders();
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      fetchOrders();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders, refreshTrigger, isAuthenticated]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  // Scope filter: My orders vs All orders
  const scopedOrders = useMemo(() => {
    if (scope === 'my') {
      return orders.filter((o) => !o.waiterId || o.waiterId === user?.id);
    }
    return orders;
  }, [orders, scope, user?.id]);

  // Filter orders by active vs completed
  const activeList = useMemo(() => {
    return scopedOrders
      .filter((o) => o.status !== 'completed' && o.status !== 'cancelled')
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // Oldest first
  }, [scopedOrders]);

  const completedList = useMemo(() => {
    return scopedOrders
      .filter((o) => o.status === 'completed')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Newest first
  }, [scopedOrders]);

  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const handleOrderPress = (order) => {
    setActiveOrder(order);
    if (order.status === 'completed') {
      navigation.navigate('BillSettlement', {
        orderId: order.id,
        order,
        isCompletedReceipt: true,
      });
    } else {
      navigation.navigate('KitchenStatus', {
        orderId: order.id,
        order,
        tableNo: order.tableNo,
      });
    }
  };

  return (
    <View style={styles.screen}>
      <AppHeader title="Orders & Floor Tickets" subtitle="Live Service Activity" />

      <View style={styles.container}>
        {/* Top Header & Scope Selector: My Orders vs All Orders */}
        <View style={styles.scopeHeaderRow}>
          <View>
            <Text style={styles.pageTitle}>Order Tickets</Text>
            <Text style={styles.pageSubtitle}>
              {scope === 'my'
                ? `Showing tickets assigned to ${user?.name?.split(' ')[0] || 'you'}`
                : 'Showing all restaurant floor orders'}
            </Text>
          </View>

          <View style={styles.scopeToggleBox}>
            <TouchableOpacity
              style={[styles.scopeBtn, scope === 'my' && styles.scopeBtnActive]}
              onPress={() => setScope('my')}
              activeOpacity={0.8}
            >
              <Text style={[styles.scopeBtnText, scope === 'my' && styles.scopeBtnTextActive]}>
                My Orders
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.scopeBtn, scope === 'all' && styles.scopeBtnActive]}
              onPress={() => setScope('all')}
              activeOpacity={0.8}
            >
              <Text style={[styles.scopeBtnText, scope === 'all' && styles.scopeBtnTextActive]}>
                All Orders
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Segmented Switch: Active vs Completed */}
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'active' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('active')}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === 'active' && styles.segmentTextActive,
              ]}
            >
              {scope === 'my' ? 'My Active' : 'All Active'} ({activeList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'completed' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('completed')}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === 'completed' && styles.segmentTextActive,
              ]}
            >
              {scope === 'my' ? 'My Completed' : 'All Completed'} ({completedList.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Order Cards List */}
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={colors.primaryContainer} />
            <Text style={styles.loadingText}>Loading orders...</Text>
          </View>
        ) : (
          <FlatList
            data={activeTab === 'active' ? activeList : completedList}
            keyExtractor={(item) => String(item.id || item.orderNo)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryContainer} />
            }
            renderItem={({ item }) => {
              const isReady = item.status === 'ready';
              const isServed = item.status === 'served';
              const isCompleted = item.status === 'completed';
              const timingInfo = getOrderTimingInfo(item);

              return (
                <TouchableOpacity
                  style={[
                    styles.orderCard,
                    isReady && styles.orderCardReady,
                  ]}
                  onPress={() => handleOrderPress(item)}
                  activeOpacity={0.85}
                >
                  {/* Top Bar: Table & Status */}
                  <View style={styles.cardHeader}>
                    <View style={styles.tableGroup}>
                      <Text style={styles.tableNameText}>{item.tableNo || 'Table'}</Text>
                      <View style={styles.orderNoBadge}>
                        <Text style={styles.orderNoText}>#{item.orderNo || item.id}</Text>
                      </View>
                      {item.waiterId && user?.id && item.waiterId !== user.id && (
                        <View style={styles.otherServerBadge}>
                          <Text style={styles.otherServerBadgeText} numberOfLines={1}>
                            {item.waiterName ? item.waiterName.split(' ')[0] : 'Staff'}
                          </Text>
                        </View>
                      )}
                    </View>

                    <StatusBadge status={item.status} />
                  </View>

                  {/* Items summary */}
                  <View style={styles.itemsSummary}>
                    <Text style={styles.itemNamesLine} numberOfLines={1}>
                      {(item.items || []).map((i) => `${i.quantity}× ${i.name || i.productName}`).join(' • ') || 'Food items in order'}
                    </Text>
                  </View>

                  {/* Divider */}
                  <View style={styles.cardDivider} />

                  {/* Bottom details: Elapsed timer OR Completed time + Total Amount */}
                  <View style={styles.cardFooter}>
                    {isCompleted ? (
                      <View style={styles.completedTimeBox}>
                        <CheckCircle2 size={14} color={colors.readyGreen} />
                        <Text style={styles.completedTimeText}>
                          {timingInfo.text}
                        </Text>
                      </View>
                    ) : isServed ? (
                      <View style={styles.completedTimeBox}>
                        <CheckCircle2 size={14} color={colors.readyGreen} />
                        <Text style={[styles.completedTimeText, { color: colors.readyGreen }]}>
                          {timingInfo.text}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.timerBox}>
                        <Clock size={14} color={isReady ? colors.readyGreen : colors.primaryContainer} />
                        <Text style={[styles.timerValue, isReady && { color: colors.readyGreen }]}>
                          {timingInfo.text}
                        </Text>
                      </View>
                    )}

                    <View style={styles.footerRight}>
                      <Text style={styles.totalPrice}>
                        ₹{parseFloat(item.totalAmount || 0).toFixed(0)}
                      </Text>
                      <ChevronRight size={16} color={colors.onSurfaceVariant} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Receipt size={36} color={colors.onSurfaceVariant} opacity={0.6} />
                <Text style={styles.emptyTitle}>
                  {activeTab === 'active' ? 'No active orders' : 'No completed orders yet'}
                </Text>
                <Text style={styles.emptySub}>
                  {scope === 'my'
                    ? (activeTab === 'active'
                      ? 'You have no active orders in prep right now.'
                      : 'You have not settled any orders this shift.')
                    : (activeTab === 'active'
                      ? 'All tables are clear and orders settled.'
                      : 'Completed receipts will appear here after checkout.')}
                </Text>
              </View>
            }
          />
        )}
      </View>
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
  scopeHeaderRow: {
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
  scopeToggleBox: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 8,
    padding: 2,
  },
  scopeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  scopeBtnActive: {
    backgroundColor: colors.surfaceContainerLowest,
    ...layout.shadows.sm,
  },
  scopeBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  scopeBtnTextActive: {
    color: colors.primaryContainer,
    fontWeight: '800',
  },
  otherServerBadge: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  otherServerBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: colors.surfaceContainerLowest,
    ...layout.shadows.sm,
  },
  segmentText: {
    ...typography.bodyMd,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  segmentTextActive: {
    color: colors.primaryContainer,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 24,
  },
  orderCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    ...layout.shadows.sm,
  },
  orderCardReady: {
    borderColor: colors.readyGreen,
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tableGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tableNameText: {
    ...typography.titleSm,
    color: colors.onSurface,
    fontWeight: '800',
  },
  orderNoBadge: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  orderNoText: {
    ...typography.captionSm,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    fontSize: 10,
  },
  itemsSummary: {
    marginTop: 8,
  },
  itemNamesLine: {
    ...typography.captionSm,
    color: colors.onSurfaceVariant,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.surfaceContainer,
    marginVertical: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timerValue: {
    ...typography.captionSm,
    fontWeight: '700',
    color: colors.primaryContainer,
  },
  completedTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  completedTimeText: {
    ...typography.captionSm,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  totalPrice: {
    ...typography.labelNumeric,
    color: colors.onSurface,
    fontWeight: '800',
  },
  centerLoading: {
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
    paddingVertical: 60,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    ...typography.titleSm,
    color: colors.onSurface,
    marginTop: 4,
  },
  emptySub: {
    ...typography.captionSm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 240,
  },
});
