import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  Utensils,
  Clock,
  CheckCircle2,
  Check,
  Receipt,
  PlusCircle,
  CreditCard,
  ChefHat,
  StickyNote,
} from 'lucide-react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { layout } from '../constants/layout';
import AppHeader from '../components/AppHeader';
import ProgressionStepper from '../components/ProgressionStepper';
import { useOrder } from '../context/OrderContext';
import { useToast } from '../context/ToastContext';
import { orderApi } from '../api/orderApi';
import { billApi } from '../api/billApi';
import { getOrderTimingInfo } from '../utils/orderTiming';

export default function KitchenStatusScreen({ navigation, route }) {
  const { orderId: routeOrderId, tableNo: routeTableNo, order: routeOrder } = route.params || {};
  const { activeOrder, setActiveOrder, triggerRefresh, guestCount } = useOrder();
  const { showToast } = useToast();

  const [order, setOrder] = useState(routeOrder || activeOrder || null);
  const [loading, setLoading] = useState(false);
  const [serving, setServing] = useState(false);
  const [isServed, setIsServed] = useState(
    (routeOrder?.status || activeOrder?.status) === 'served'
  );

  const displayGuestCount = order?.guestCount || activeOrder?.guestCount || guestCount || 1;
  const guestLabel = `${displayGuestCount} ${displayGuestCount === 1 ? 'Guest' : 'Guests'}`;

  const targetOrderId = routeOrderId || order?.id || 125;

  const fetchOrderDetails = useCallback(async () => {
    if (!targetOrderId) return;
    setLoading(true);
    try {
      const res = await orderApi.getOrderById(targetOrderId);
      if (res && res.data) {
        setOrder(res.data);
        setActiveOrder(res.data);
        if (res.data.status === 'served') setIsServed(true);
      }
    } catch (err) {
      if (err.status !== 401) {
        console.warn('Could not fetch single order:', err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [targetOrderId, routeTableNo, setActiveOrder, order]);

  useEffect(() => {
    fetchOrderDetails();
    // Poll order status every 4 seconds for active orders
    const interval = setInterval(() => {
      fetchOrderDetails();
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchOrderDetails]);

  const handleMarkServed = async () => {
    setServing(true);
    try {
      if (order?.id) {
        await orderApi.updateOrderStatus(order.id, 'served');
      }
      setIsServed(true);
      setOrder(prev => ({ ...prev, status: 'served' }));
      showToast({
        message: `${order?.tableNo || 'Table'} served! Updating restaurant floor.`,
        type: 'success',
      });
      triggerRefresh();
    } catch (err) {
      setIsServed(true);
      showToast({ message: 'Order marked served locally.', type: 'info' });
      triggerRefresh();
    } finally {
      setServing(false);
    }
  };

  const handleAddMoreItems = () => {
    navigation.navigate('TakeOrder', {
      table: {
        tableCode: order?.tableCode || 'TAB03',
        tableNumber: order?.tableNo || 'Table 3',
        activeOrderId: order?.id,
      },
      isAddMore: true,
    });
  };

  const handleGoToBill = () => {
    navigation.navigate('BillSettlement', {
      orderId: order?.id,
      tableNo: order?.tableNo || 'Table 3',
      order,
    });
  };

  const currentStatus = isServed ? 'served' : order?.status || 'ready';
  const isReady = currentStatus === 'ready';

  return (
    <View style={styles.screen}>
      <AppHeader
        title="Kitchen Status"
        subtitle={`${order?.tableNo || 'Table 3'} • Ticket Details`}
        showBack={true}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Kitchen Completion Celebration Banner (when Ready) */}
        {isReady && (
          <View style={styles.celebrationBanner}>
            <View style={styles.bannerLeft}>
              <View style={styles.chefHatIconBox}>
                <ChefHat size={22} color="#FFFFFF" />
              </View>
              <View>
                <View style={styles.bannerBadgeRow}>
                  <View style={styles.bannerPingDot} />
                  <Text style={styles.bannerBadgeText}>CHEF FINISHED TICKET</Text>
                </View>
                <Text style={styles.bannerTitle}>Ready for Pickup!</Text>
              </View>
            </View>

            <View style={styles.passTag}>
              <Text style={styles.passTagText}>Pass Hot</Text>
            </View>
          </View>
        )}

        {/* Order Meta Card */}
        <View style={styles.metaCard}>
          <View style={styles.metaTopRow}>
            <View>
              <View style={styles.ticketRow}>
                <View style={styles.ticketPill}>
                  <Text style={styles.ticketText}>Ticket #{order?.orderNo || order?.id || 'ORD-00125'}</Text>
                </View>
                <Text style={styles.stationText}>Station Pass #2</Text>
              </View>

              <View style={styles.tableTitleRow}>
                <Text style={styles.tableNameText}>{order?.tableNo || 'Table 3'}</Text>
                <Text style={styles.tableCodeSub}>• {order?.tableCode || 'TAB03'} • {guestLabel}</Text>
              </View>
            </View>

            <View style={styles.waiterTag}>
              <Text style={styles.waiterTagText}>{order?.customerName || order?.waiterName || 'Jonathan'}</Text>
            </View>
          </View>

          {/* Duration Tracker Bar */}
          <View style={styles.durationBox}>
            <View style={styles.durationLeft}>
              <Clock size={16} color={colors.primaryContainer} />
              <View>
                <Text style={styles.elapsedLabel}>
                  {getOrderTimingInfo(order).text}
                </Text>
                <Text style={styles.placedSub}>
                  {order?.createdAt
                    ? `Placed at ${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'Placed recently'}
                </Text>
              </View>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: isServed ? '100%' : isReady ? '80%' : currentStatus === 'preparing' ? '50%' : '20%' },
                ]}
              />
            </View>
          </View>
        </View>

        {/* 5-Stage Progression Stepper */}
        <View style={styles.stepperSection}>
          <ProgressionStepper currentStage={currentStatus} />
        </View>

        {/* Items Visual Inspection List */}
        <View style={styles.itemsCard}>
          <View style={styles.itemsCardHeader}>
            <View style={styles.itemsCardTitleRow}>
              <Receipt size={18} color={colors.onSurface} />
              <Text style={styles.itemsCardTitle}>Kitchen Ticket Items</Text>
            </View>
            <View style={styles.readyItemsBadge}>
              <Text style={styles.readyItemsBadgeText}>
                {order?.items?.length || 3} of {order?.items?.length || 3} Ready
              </Text>
            </View>
          </View>

          {/* List of items */}
          <View style={styles.itemsList}>
            {(order?.items || [
              { name: 'Margherita Pizza', quantity: 2, price: 250, station: 'Pizza Oven', notes: 'Extra crispy crust' },
              { name: 'Classic Caesar Salad', quantity: 1, price: 180, station: 'Cold Pantry', notes: 'Dressing on side' },
              { name: 'Lemon Mint Cooler', quantity: 2, price: 120, station: 'Bar Station', notes: 'Crushed ice' },
            ]).map((item, idx) => (
              <View key={idx} style={styles.itemInspectionCard}>
                <View style={styles.itemQtyBadge}>
                  <Text style={styles.itemQtyBadgeText}>{item.quantity}×</Text>
                </View>

                <View style={styles.itemInspectionBody}>
                  <View style={styles.itemTitleRow}>
                    <Text style={styles.itemInspectionName} numberOfLines={1}>
                      {item.name || item.productName}
                    </Text>
                    <CheckCircle2 size={18} color={colors.readyGreen} />
                  </View>

                  <Text style={styles.itemStation}>
                    {item.station || 'Kitchen Station'} • Prepared & Plated
                  </Text>

                  {item.notes ? (
                    <View style={styles.itemNoteBadge}>
                      <StickyNote size={12} color={colors.primaryContainer} />
                      <Text style={styles.itemNoteText}>{item.notes}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Primary Action Dispatch Button */}
        <View style={styles.actionsSection}>
          {!isServed ? (
            <TouchableOpacity
              style={[
                styles.markServedBtn,
                isReady && styles.markServedBtnReady,
              ]}
              onPress={handleMarkServed}
              disabled={serving}
              activeOpacity={0.88}
            >
              {serving ? (
                <ActivityIndicator color={colors.onTertiary} size="small" />
              ) : (
                <>
                  <CheckCircle2 size={22} color={colors.onTertiary} strokeWidth={2.5} />
                  <Text style={styles.markServedBtnText}>
                    Mark as Served ({order?.tableNo || 'Table 3'})
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.servedBanner}>
              <CheckCircle2 size={20} color={colors.readyGreen} />
              <Text style={styles.servedBannerText}>
                Food is Served! Table remains active until checkout.
              </Text>
            </View>
          )}

          {/* Secondary Actions Row */}
          <View style={styles.secondaryActionsGrid}>
            <TouchableOpacity
              style={styles.actionOutlineBtn}
              onPress={handleAddMoreItems}
              activeOpacity={0.8}
            >
              <PlusCircle size={18} color={colors.primaryContainer} />
              <Text style={styles.actionOutlineText}>+ Add Items</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionOutlineBtn, styles.billBtn]}
              onPress={handleGoToBill}
              activeOpacity={0.8}
            >
              <CreditCard size={18} color={colors.onPrimary} />
              <Text style={[styles.actionOutlineText, { color: colors.onPrimary }]}>
                Generate Bill & Pay
              </Text>
            </TouchableOpacity>
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
    gap: 14,
  },
  celebrationBanner: {
    backgroundColor: colors.tertiaryContainer,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...layout.shadows.md,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chefHatIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  bannerPingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.tertiaryFixed,
  },
  bannerBadgeText: {
    ...typography.captionSm,
    color: colors.tertiaryFixed,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  bannerTitle: {
    ...typography.headlineMd,
    color: colors.onTertiary,
    fontWeight: '800',
    marginTop: 2,
  },
  passTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  passTagText: {
    ...typography.captionSm,
    color: colors.onTertiary,
    fontWeight: '700',
  },
  metaCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    ...layout.shadows.sm,
  },
  metaTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ticketPill: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  ticketText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
  },
  stationText: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  tableTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 4,
  },
  tableNameText: {
    ...typography.headlineLg,
    color: colors.onSurface,
    fontWeight: '800',
  },
  tableCodeSub: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  waiterTag: {
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  waiterTagText: {
    ...typography.captionSm,
    color: colors.onSurface,
    fontWeight: '600',
  },
  durationBox: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  durationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  elapsedLabel: {
    ...typography.labelNumeric,
    color: colors.onSurface,
    fontSize: 13,
  },
  placedSub: {
    ...typography.captionSm,
    color: colors.onSurfaceVariant,
    fontSize: 10,
  },
  progressTrack: {
    width: 60,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceContainerHigh,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.readyGreen,
    borderRadius: 3,
  },
  stepperSection: {
    // Stepper component
  },
  itemsCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    ...layout.shadows.sm,
  },
  itemsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 4,
  },
  itemsCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemsCardTitle: {
    ...typography.titleSm,
    color: colors.onSurface,
    fontWeight: '700',
  },
  readyItemsBadge: {
    backgroundColor: colors.readyTint,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  readyItemsBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.readyGreen,
  },
  itemsList: {
    gap: 10,
  },
  itemInspectionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 10,
  },
  itemQtyBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemQtyBadgeText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 12,
  },
  itemInspectionBody: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInspectionName: {
    ...typography.bodyMdBold,
    color: colors.onSurface,
  },
  itemStation: {
    ...typography.captionSm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  itemNoteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 5,
    alignSelf: 'flex-start',
  },
  itemNoteText: {
    fontSize: 10,
    color: colors.primaryContainer,
    fontWeight: '600',
  },
  actionsSection: {
    gap: 10,
    marginTop: 4,
  },
  markServedBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.tertiaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...layout.shadows.md,
  },
  markServedBtnReady: {
    backgroundColor: colors.readyGreen,
  },
  markServedBtnText: {
    ...typography.titleSm,
    color: colors.onTertiary,
    fontWeight: '800',
  },
  servedBanner: {
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.readyTint,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  servedBannerText: {
    ...typography.captionSm,
    color: colors.readyGreen,
    fontWeight: '700',
  },
  secondaryActionsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  actionOutlineBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...layout.shadows.sm,
  },
  billBtn: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primaryContainer,
  },
  actionOutlineText: {
    ...typography.bodyMdBold,
    color: colors.onSurface,
  },
});
