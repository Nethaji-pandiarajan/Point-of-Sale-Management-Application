import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Plus, Minus, PlusCircle, Receipt, UtensilsCrossed, X, UserCheck, AlertCircle, ArrowRightLeft } from 'lucide-react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { layout } from '../constants/layout';
import StatusBadge from './StatusBadge';
import { useAuth } from '../context/AuthContext';

export default function TableActionSheet({
  visible,
  table,
  guestCount = 1,
  onGuestCountChange,
  onClose,
  onStartOrder,
  onViewOrder,
  onViewBill,
  onMarkServed,
  onTakeOver,
}) {
  const { user } = useAuth();
  const [showTakeoverConfirm, setShowTakeoverConfirm] = useState(false);

  if (!table) return null;

  const { tableCode, tableNumber, capacity, status, activeOrderStatus, activeOrderNo, assignedWaiterId, assignedWaiter } = table;
  const isAvailable = status === 'available';
  const isOccupied = status === 'occupied';
  const isReady = activeOrderStatus === 'ready';
  const isReserved = status === 'reserved';

  const isHandledByOther = Boolean(!isAvailable && !isReserved && assignedWaiterId && user?.id && assignedWaiterId !== user.id);

  const handleClose = () => {
    setShowTakeoverConfirm(false);
    onClose();
  };

  const maxCapacity = parseInt(capacity, 10) || 4;
  const canDecrement = guestCount > 1;
  const canIncrement = guestCount < maxCapacity;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              {/* Drag handle */}
              <View style={styles.handleBar} />

              {/* Header row */}
              <View style={styles.headerRow}>
                <View>
                  <View style={styles.nameCodeRow}>
                    <Text style={styles.tableName}>
                      {tableNumber || `Table ${tableCode?.replace(/\D/g, '')}`}
                    </Text>
                    <View style={styles.codeBadge}>
                      <Text style={styles.codeBadgeText}>{tableCode}</Text>
                    </View>
                  </View>
                  <Text style={styles.subtitle}>
                    {capacity ? `${capacity} Seats Capacity` : 'Dining Table'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={18} color={colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>

              {/* Status and description */}
              <View style={styles.statusBox}>
                <StatusBadge status={isReady ? 'ready' : status} />
                <Text style={styles.statusDesc}>
                  {isAvailable
                    ? 'Table is clean and ready for seating new guests.'
                    : isReady
                    ? 'Hot food is ready at the kitchen pass! Pick up and serve.'
                    : isOccupied
                    ? `Active Order ${activeOrderNo ? '#' + activeOrderNo : ''} in service.`
                    : 'Table has a reserved booking.'}
                </Text>
              </View>

              {/* Handled by another server notice */}
              {isHandledByOther && (
                <View style={styles.takeoverNoticeBox}>
                  <AlertCircle size={18} color="#B45309" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.takeoverNoticeTitle}>
                      Handled by {assignedWaiter || 'another server'}
                    </Text>
                    <Text style={styles.takeoverNoticeSubtitle}>
                      Active order #{activeOrderNo || ''} is assigned to {assignedWaiter}. You can take over this table.
                    </Text>
                  </View>
                </View>
              )}

              {/* Guest Count Selector (Active for new orders) */}
              {isAvailable && (
                <View style={styles.guestSelectorWrapper}>
                  <View style={styles.guestSelectorBox}>
                    <View>
                      <Text style={styles.guestLabel}>Select Guests Count</Text>
                      <Text style={styles.capacityHintText}>
                        Maximum capacity: {maxCapacity} {maxCapacity === 1 ? 'guest' : 'guests'}
                      </Text>
                    </View>

                    <View style={styles.guestControls}>
                      <TouchableOpacity
                        style={[styles.guestBtn, !canDecrement && styles.guestBtnDisabled]}
                        onPress={() => canDecrement && onGuestCountChange && onGuestCountChange(guestCount - 1)}
                        disabled={!canDecrement}
                        activeOpacity={0.7}
                      >
                        <Minus size={18} color={canDecrement ? colors.onSurface : colors.outline} strokeWidth={2.5} />
                      </TouchableOpacity>

                      <Text style={styles.guestCountNum}>{guestCount}</Text>

                      <TouchableOpacity
                        style={[styles.guestBtn, !canIncrement && styles.guestBtnDisabled]}
                        onPress={() => canIncrement && onGuestCountChange && onGuestCountChange(guestCount + 1)}
                        disabled={!canIncrement}
                        activeOpacity={0.7}
                      >
                        <Plus size={18} color={canIncrement ? colors.onSurface : colors.outline} strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {/* Actions */}
              <View style={styles.actionsColumn}>
                {showTakeoverConfirm ? (
                  <View style={styles.confirmBox}>
                    <Text style={styles.confirmTitle}>Take Over Table?</Text>
                    <Text style={styles.confirmDesc}>
                      Take over {tableNumber || tableCode} from {assignedWaiter}? All active orders and kitchen alerts will transfer to your account.
                    </Text>
                    <View style={styles.confirmBtnRow}>
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => setShowTakeoverConfirm(false)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.confirmTakeoverBtn}
                        onPress={() => {
                          setShowTakeoverConfirm(false);
                          if (onTakeOver) onTakeOver(table);
                        }}
                        activeOpacity={0.88}
                      >
                        <ArrowRightLeft size={16} color="#FFFFFF" />
                        <Text style={styles.confirmTakeoverBtnText}>Confirm Takeover</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : isHandledByOther ? (
                  <>
                    <TouchableOpacity
                      style={[styles.primaryBtn, { backgroundColor: colors.secondary }]}
                      onPress={() => setShowTakeoverConfirm(true)}
                      activeOpacity={0.88}
                    >
                      <ArrowRightLeft size={20} color={colors.onSecondary} />
                      <Text style={styles.primaryBtnText}>Take Over Table</Text>
                    </TouchableOpacity>

                    <View style={styles.secondaryRow}>
                      <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={onViewOrder}
                        activeOpacity={0.8}
                      >
                        <Receipt size={18} color={colors.onSurface} />
                        <Text style={styles.secondaryBtnText}>Order Status</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={onViewBill}
                        activeOpacity={0.8}
                      >
                        <Receipt size={18} color={colors.primaryContainer} />
                        <Text style={[styles.secondaryBtnText, { color: colors.primaryContainer }]}>
                          Bill & Pay
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    {isAvailable && (
                      <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={onStartOrder}
                        activeOpacity={0.88}
                      >
                        <PlusCircle size={20} color={colors.onPrimary} />
                        <Text style={styles.primaryBtnText}>Start New Order</Text>
                      </TouchableOpacity>
                    )}

                    {isReady && (
                      <TouchableOpacity
                        style={[styles.primaryBtn, { backgroundColor: colors.tertiaryContainer }]}
                        onPress={onMarkServed}
                        activeOpacity={0.88}
                      >
                        <UtensilsCrossed size={20} color={colors.onTertiary} />
                        <Text style={styles.primaryBtnText}>Serve All to Table</Text>
                      </TouchableOpacity>
                    )}

                    {isOccupied && !isReady && (
                      <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={onStartOrder}
                        activeOpacity={0.88}
                      >
                        <PlusCircle size={20} color={colors.onPrimary} />
                        <Text style={styles.primaryBtnText}>+ Add More Items</Text>
                      </TouchableOpacity>
                    )}

                    {isReserved && (
                      <TouchableOpacity
                        style={[styles.primaryBtn, { backgroundColor: colors.secondaryContainer }]}
                        onPress={onStartOrder}
                        activeOpacity={0.88}
                      >
                        <UserCheck size={20} color={colors.onSecondary} />
                        <Text style={styles.primaryBtnText}>Seat Arrived Guest</Text>
                      </TouchableOpacity>
                    )}

                    {(isOccupied || isReady) && (
                      <View style={styles.secondaryRow}>
                        <TouchableOpacity
                          style={styles.secondaryBtn}
                          onPress={onViewOrder}
                          activeOpacity={0.8}
                        >
                          <Receipt size={18} color={colors.onSurface} />
                          <Text style={styles.secondaryBtnText}>Order Status</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.secondaryBtn}
                          onPress={onViewBill}
                          activeOpacity={0.8}
                        >
                          <Receipt size={18} color={colors.primaryContainer} />
                          <Text style={[styles.secondaryBtnText, { color: colors.primaryContainer }]}>
                            Bill & Pay
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    ...layout.shadows.lg,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceContainerHighest,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nameCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tableName: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontWeight: '800',
  },
  codeBadge: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  codeBadgeText: {
    ...typography.labelBadge,
    color: colors.onSurfaceVariant,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBox: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    gap: 8,
  },
  statusDesc: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
  },
  guestSelectorWrapper: {
    marginTop: 16,
  },
  guestSelectorBox: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerLow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  guestLabel: {
    ...typography.titleSm,
    color: colors.onSurface,
    fontWeight: '700',
  },
  capacityHintText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  guestControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  guestBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  guestBtnDisabled: {
    opacity: 0.35,
    backgroundColor: colors.surfaceContainerLow,
    borderColor: colors.border,
  },
  guestCountNum: {
    ...typography.titleSm,
    color: colors.onSurface,
    minWidth: 24,
    textAlign: 'center',
    fontWeight: '800',
  },
  actionsColumn: {
    marginTop: 20,
    gap: 10,
  },
  primaryBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnText: {
    ...typography.titleSm,
    color: colors.onPrimary,
    fontWeight: '700',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerLow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryBtnText: {
    ...typography.bodyMdBold,
    color: colors.onSurface,
  },
  takeoverNoticeBox: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  takeoverNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  takeoverNoticeSubtitle: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
    lineHeight: 16,
  },
  confirmBox: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  confirmTitle: {
    ...typography.titleSm,
    fontWeight: '800',
    color: colors.onSurface,
  },
  confirmDesc: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 18,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    ...typography.labelMd,
    color: colors.onSurface,
    fontWeight: '700',
  },
  confirmTakeoverBtn: {
    flex: 1.5,
    height: 42,
    borderRadius: 10,
    backgroundColor: colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  confirmTakeoverBtnText: {
    ...typography.labelMd,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
