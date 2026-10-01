import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {
  Utensils,
  Receipt,
  Clock,
  CheckCircle2,
  Table as TableIcon,
  ChevronRight,
  Sliders,
  Send,
  CreditCard,
  Bell,
  Sparkles,
} from 'lucide-react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { layout } from '../constants/layout';
import AppHeader from '../components/AppHeader';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';
import { tableApi } from '../api/tableApi';
import { orderApi } from '../api/orderApi';
import { getOrderTimingInfo } from '../utils/orderTiming';

export default function HomeScreen({ navigation }) {
  const { user, shift, floor, isAuthenticated } = useAuth();
  const { selectTable, setActiveOrder, refreshTrigger } = useOrder();

  const [tables, setTables] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [tablesRes, ordersRes] = await Promise.allSettled([
        tableApi.getTables({ limit: 50 }),
        orderApi.getOrders({ limit: 50 }),
      ]);

      if (tablesRes.status === 'fulfilled' && tablesRes.value?.data) {
        setTables(tablesRes.value.data);
      }
      if (ordersRes.status === 'fulfilled' && ordersRes.value?.data) {
        setActiveOrders(ordersRes.value.data);
      }
    } catch (err) {
      if (err.status !== 401) {
        console.warn('Dashboard fetch error:', err.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchDashboardData();
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchDashboardData, refreshTrigger, isAuthenticated]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Waiter-specific data ("My Work First")
  const myAssignedTables = tables.filter(
    t => t.assignedWaiterId === user?.id && t.status !== 'available'
  );
  const myActiveOrders = activeOrders.filter(
    o => o.waiterId === user?.id && o.status !== 'completed' && o.status !== 'cancelled'
  );
  const myReadyOrders = myActiveOrders.filter(o => o.status === 'ready');

  const myTablesCount = myAssignedTables.length;
  const activeOrdersCount = myActiveOrders.length;
  const readyCount = myReadyOrders.length;

  // Urgent attention order (only from current waiter's ready orders)
  const urgentOrder = myReadyOrders[0] || null;

  const handleUrgentOrderPress = () => {
    if (!urgentOrder) return;
    setActiveOrder(urgentOrder);
    navigation.navigate('KitchenStatus', { orderId: urgentOrder.id, order: urgentOrder, tableNo: urgentOrder.tableNo });
  };

  const handleTablePress = (table) => {
    selectTable(table);
    if (table.status === 'available') {
      navigation.navigate('Tables');
    } else {
      navigation.navigate('KitchenStatus', { tableNo: table.tableNumber || table.tableCode, orderId: table.activeOrderId });
    }
  };

  return (
    <View style={styles.screen}>
      <AppHeader title="Saleiz Waiter" subtitle={`${floor || 'Floor A'} • Shift Active`} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryContainer} />
        }
      >
        {/* Waiter Shift Header Greeting */}
        <View style={styles.greetingRow}>
          <View style={styles.greetingTextGroup}>
            <View style={styles.helloTitleRow}>
              <Text style={styles.greetingTitle}>
                Good Evening, {user?.name?.split(' ')[0] || 'Waiter'}
              </Text>
              <Text style={styles.handWave}>👋</Text>
            </View>
            <View style={styles.shiftBadgeRow}>
              <Clock size={13} color={colors.primaryContainer} />
              <Text style={styles.shiftBadgeText}>
                Shift: {shift || 'Dinner (5:00 PM – 11:30 PM)'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.filterBtn}
            activeOpacity={0.75}
            onPress={() => navigation.navigate('Tables')}
          >
            <TableIcon size={18} color={colors.onSurface} />
          </TouchableOpacity>
        </View>

        {/* Real-time Shift KPI Summary Strip */}
        <View style={styles.kpiGrid}>
          {/* Metric 1: My Tables */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => navigation.navigate('Tables')}
            activeOpacity={0.8}
          >
            <Text style={styles.kpiLabel}>My Tables</Text>
            <View style={styles.kpiNumRow}>
              <Text style={styles.kpiNum}>{myTablesCount}</Text>
              <TableIcon size={14} color={colors.onSurfaceVariant} />
            </View>
            <Text style={styles.kpiSub}>Assigned to you</Text>
          </TouchableOpacity>

          {/* Metric 2: Active Orders */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => navigation.navigate('ActiveOrders')}
            activeOpacity={0.8}
          >
            <Text style={styles.kpiLabel}>Active Orders</Text>
            <View style={styles.kpiNumRow}>
              <Text style={styles.kpiNum}>{activeOrdersCount}</Text>
              <Receipt size={14} color={colors.secondary} />
            </View>
            <Text style={[styles.kpiSub, { color: colors.secondary, fontWeight: '700' }]}>
              Your orders
            </Text>
          </TouchableOpacity>

          {/* Metric 3: Ready for Me */}
          <TouchableOpacity
            style={[styles.kpiCard, readyCount > 0 && styles.kpiCardReady]}
            onPress={() => {
              if (urgentOrder) {
                handleUrgentOrderPress();
              } else {
                navigation.navigate('ActiveOrders');
              }
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.kpiLabel, readyCount > 0 && { color: colors.tertiary, fontWeight: '800' }]}>
              Ready for Me
            </Text>
            <View style={styles.kpiNumRow}>
              <Text style={[styles.kpiNum, readyCount > 0 && { color: colors.tertiary }]}>{readyCount}</Text>
              <Utensils size={15} color={readyCount > 0 ? colors.tertiary : colors.onSurfaceVariant} />
            </View>
            {readyCount > 0 ? (
              <View style={styles.actionRequiredBadge}>
                <View style={styles.pingDot} />
                <Text style={styles.actionRequiredText}>Pickup now</Text>
              </View>
            ) : (
              <Text style={styles.kpiSub}>No hot dishes</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Urgent Attention Card: Ready for Pickup (Only when ready orders exist for this waiter) */}
        {urgentOrder ? (
          <View style={styles.urgentCard}>
            <View style={styles.urgentHeader}>
              <View style={styles.readyPickupPill}>
                <View style={styles.readyPingDot} />
                <Text style={styles.readyPickupText}>READY FOR PICKUP</Text>
              </View>
              <View style={styles.urgentTimer}>
                <Clock size={12} color={colors.onSurfaceVariant} />
                <Text style={styles.urgentTimerText}>
                  {urgentOrder ? getOrderTimingInfo(urgentOrder).text : 'Ready now'}
                </Text>
              </View>
            </View>

            <View style={styles.urgentBody}>
              <View>
                <View style={styles.urgentTableCodeRow}>
                  <Text style={styles.urgentTableName}>{urgentOrder.tableNo || 'Table'}</Text>
                  <View style={styles.codePill}>
                    <Text style={styles.codePillText}>{urgentOrder.tableCode || 'TAB'}</Text>
                  </View>
                </View>
                <Text style={styles.urgentOrderSub}>
                  Order #{urgentOrder.orderNo || urgentOrder.id} • {urgentOrder.items?.length || 1} Items
                </Text>
              </View>

              <View style={styles.dishIconBox}>
                <Utensils size={24} color={colors.primaryContainer} />
              </View>
            </View>

            {/* Prepared Items Pills */}
            <View style={styles.preparedPillsRow}>
              {(urgentOrder.items || []).slice(0, 3).map((it, idx) => (
                <View key={idx} style={styles.prepItemPill}>
                  <CheckCircle2 size={13} color={colors.readyGreen} />
                  <Text style={styles.prepItemText} numberOfLines={1}>
                    {it.quantity}x {it.name || it.productName}
                  </Text>
                </View>
              ))}
            </View>

            {/* Primary Action Button */}
            <TouchableOpacity
              style={styles.serveActionBtn}
              onPress={handleUrgentOrderPress}
              activeOpacity={0.9}
            >
              <Utensils size={18} color={colors.onPrimary} />
              <Text style={styles.serveActionText}>Serve & View Order</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Section: My Assigned Tables */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>My Assigned Tables</Text>
            <View style={styles.countTag}>
              <Text style={styles.countTagText}>{myAssignedTables.length}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Tables')}>
            <Text style={styles.viewAllLink}>View All Tables</Text>
          </TouchableOpacity>
        </View>

        {/* Assigned Tables List or Empty State */}
        {myAssignedTables.length > 0 ? (
          <View style={styles.assignedTablesList}>
            {myAssignedTables.map((table) => {
              const isReady = table.activeOrderStatus === 'ready';
              const isOccupied = table.status === 'occupied';

              return (
                <TouchableOpacity
                  key={table.id || table.tableCode}
                  style={[styles.assignedTableCard, isReady && styles.tableCardReadyGlow]}
                  onPress={() => handleTablePress(table)}
                  activeOpacity={0.88}
                >
                  <View style={styles.tableCardTop}>
                    <View style={styles.tableCardLeft}>
                      <View
                        style={[
                          styles.tableCardNumberBadge,
                          isReady && { backgroundColor: colors.readyTint },
                          isOccupied && { backgroundColor: colors.secondaryFixed },
                        ]}
                      >
                        <Text
                          style={[
                            styles.tableCardNumberText,
                            isReady && { color: colors.readyGreen },
                            isOccupied && { color: colors.onSecondaryFixed },
                          ]}
                        >
                          {String(table.tableNumber || table.tableCode || '01').replace(/\D/g, '').padStart(2, '0')}
                        </Text>
                      </View>
                      <View>
                        <View style={styles.tableCardNameRow}>
                          <Text style={styles.tableCardName}>{table.tableNumber || 'Table'}</Text>
                          <Text style={styles.tableCardCode}>{table.tableCode}</Text>
                        </View>
                        <Text style={styles.tableCardDetail}>
                          {table.capacity || 4} Seats • Order #{table.activeOrderNo || 'Active'}
                        </Text>
                      </View>
                    </View>
                    <StatusBadge status={isReady ? 'ready' : table.status} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.homeEmptyCard}>
            <TableIcon size={32} color={colors.outline} />
            <Text style={styles.homeEmptyTitle}>No tables assigned yet</Text>
            <Text style={styles.homeEmptySub}>
              Select an available table from the floor layout to start serving guests.
            </Text>
            <TouchableOpacity
              style={styles.homeEmptyBtn}
              onPress={() => navigation.navigate('Tables')}
              activeOpacity={0.85}
            >
              <Text style={styles.homeEmptyBtnText}>Go to Floor Plan</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* View All Tables CTA */}
        <TouchableOpacity
          style={styles.viewTablesBtn}
          onPress={() => navigation.navigate('Tables')}
          activeOpacity={0.85}
        >
          <TableIcon size={18} color={colors.onSurface} />
          <Text style={styles.viewTablesBtnText}>View All Tables & Floor Plan</Text>
        </TouchableOpacity>

        {/* Section: Recent Floor Activity */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Floor Activity</Text>
          <Clock size={16} color={colors.onSurfaceVariant} />
        </View>

        <View style={styles.activityFeedCard}>
          <View style={styles.activityRow}>
            <View style={[styles.activityIconCircle, { backgroundColor: colors.readyTint }]}>
              <CheckCircle2 size={16} color={colors.readyGreen} />
            </View>
            <View style={styles.activityContent}>
              <View style={styles.activityMeta}>
                <Text style={styles.activityTarget}>Table 4</Text>
                <Text style={styles.activityTime}>2m ago</Text>
              </View>
              <Text style={styles.activityDesc}>2 items marked Ready by Chef</Text>
            </View>
          </View>

          <View style={styles.activityDivider} />

          <View style={styles.activityRow}>
            <View style={[styles.activityIconCircle, { backgroundColor: colors.secondaryFixed }]}>
              <Send size={15} color={colors.secondary} />
            </View>
            <View style={styles.activityContent}>
              <View style={styles.activityMeta}>
                <Text style={styles.activityTarget}>Table 2</Text>
                <Text style={styles.activityTime}>12m ago</Text>
              </View>
              <Text style={styles.activityDesc}>KOT #3 sent to Kitchen</Text>
            </View>
          </View>

          <View style={styles.activityDivider} />

          <View style={styles.activityRow}>
            <View style={[styles.activityIconCircle, { backgroundColor: colors.surfaceContainerHigh }]}>
              <CreditCard size={15} color={colors.onSurfaceVariant} />
            </View>
            <View style={styles.activityContent}>
              <View style={styles.activityMeta}>
                <Text style={styles.activityTarget}>Table 1</Text>
                <Text style={styles.activityTime}>28m ago</Text>
              </View>
              <Text style={styles.activityDesc}>Payment completed (₹1,450 via UPI)</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greetingTextGroup: {
    flex: 1,
  },
  helloTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greetingTitle: {
    ...typography.headlineLg,
    color: colors.onSurface,
    fontWeight: '800',
  },
  handWave: {
    fontSize: 20,
  },
  shiftBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  shiftBadgeText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  filterBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...layout.shadows.sm,
  },
  kpiCardReady: {
    backgroundColor: '#EDF9F0',
    borderColor: '#C3E8CC',
  },
  kpiLabel: {
    ...typography.captionSm,
    color: colors.onSurfaceVariant,
    marginBottom: 4,
    fontWeight: '600',
  },
  kpiNumRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  kpiNum: {
    ...typography.displayTableNum,
    color: colors.onSurface,
    fontSize: 26,
    lineHeight: 30,
  },
  kpiSub: {
    fontSize: 10,
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  actionRequiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  pingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.readyGreen,
  },
  actionRequiredText: {
    fontSize: 10,
    color: colors.tertiary,
    fontWeight: '700',
  },
  urgentCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    ...layout.shadows.md,
  },
  urgentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  readyPickupPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.tertiaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  readyPingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.onTertiary,
  },
  readyPickupText: {
    ...typography.captionSm,
    color: colors.onTertiary,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  urgentTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  urgentTimerText: {
    ...typography.captionSm,
    color: colors.onSurfaceVariant,
    fontWeight: '600',
  },
  urgentBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  urgentTableCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  urgentTableName: {
    ...typography.headlineLg,
    color: colors.onSurface,
    fontWeight: '800',
  },
  codePill: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  codePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
  },
  urgentOrderSub: {
    ...typography.captionSm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  dishIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.selectedTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preparedPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  prepItemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  prepItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.onSurface,
  },
  serveActionBtn: {
    backgroundColor: colors.primaryContainer,
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...layout.shadows.md,
  },
  serveActionText: {
    ...typography.titleSm,
    color: colors.onPrimary,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontWeight: '700',
    fontSize: 18,
  },
  countTag: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 9999,
  },
  countTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
  },
  floorText: {
    ...typography.captionSm,
    color: colors.onSurfaceVariant,
  },
  assignedTablesList: {
    gap: 10,
    marginBottom: 14,
  },
  assignedTableCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
    ...layout.shadows.sm,
  },
  tableCardReadyGlow: {
    borderColor: colors.readyGreen,
    borderWidth: 1.5,
  },
  tableCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tableCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tableCardNumberBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableCardNumberText: {
    ...typography.titleSm,
    color: colors.onSecondaryFixed,
    fontWeight: '800',
  },
  tableCardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tableCardName: {
    ...typography.titleSm,
    color: colors.onSurface,
    fontWeight: '700',
  },
  tableCardCode: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  tableCardDetail: {
    ...typography.captionSm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  tableCardBottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  cardOrderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cardOrderNo: {
    ...typography.captionSm,
    fontWeight: '700',
    color: colors.onSurface,
  },
  cardOrderTime: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  cardTimerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cardTimerText: {
    ...typography.captionSm,
    color: colors.onSurfaceVariant,
    fontWeight: '600',
  },
  viewTablesBtn: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 12,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  viewTablesBtnText: {
    ...typography.bodyMdBold,
    color: colors.onSurface,
  },
  activityFeedCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...layout.shadows.sm,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityTarget: {
    ...typography.bodyMdBold,
    color: colors.onSurface,
  },
  activityTime: {
    ...typography.captionSm,
    color: colors.onSurfaceVariant,
  },
  activityDesc: {
    ...typography.captionSm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  activityDivider: {
    height: 1,
    backgroundColor: colors.surfaceContainer,
    marginVertical: 12,
  },
  viewAllLink: {
    ...typography.captionSm,
    color: colors.primaryContainer,
    fontWeight: '700',
  },
  homeEmptyCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    ...layout.shadows.sm,
  },
  homeEmptyTitle: {
    ...typography.titleSm,
    color: colors.onSurface,
    fontWeight: '700',
    marginTop: 4,
  },
  homeEmptySub: {
    ...typography.captionSm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  homeEmptyBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainerHigh,
  },
  homeEmptyBtnText: {
    ...typography.captionSm,
    color: colors.onSurface,
    fontWeight: '700',
  },
});
