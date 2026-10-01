import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { User, Clock, CheckCircle2, ChevronRight, Utensils, ShieldCheck } from 'lucide-react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { layout } from '../constants/layout';
import StatusBadge from './StatusBadge';
import { useAuth } from '../context/AuthContext';

export default function TableCard({ table, onPress }) {
  const { user } = useAuth();
  const {
    tableCode,
    tableNumber,
    capacity,
    status,
    activeOrderNo,
    activeOrderStatus,
    activeOrderTotal,
    assignedWaiterId,
    assignedWaiter,
  } = table;

  const isAvailable = status === 'available';
  const isOccupied = status === 'occupied';
  const isReserved = status === 'reserved';
  const isReady = activeOrderStatus === 'ready';

  const isMyTable = Boolean(user?.id && assignedWaiterId === user.id);
  const isOtherTable = Boolean(assignedWaiterId && user?.id && assignedWaiterId !== user.id);

  // Extract clean 2-digit number e.g. "01" from TAB01 or "Table 1"
  const rawNum = (tableCode || '').replace(/\D/g, '') || (tableNumber || '').replace(/\D/g, '') || '1';
  const displayNum = rawNum.padStart(2, '0');

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isReady && styles.cardReady,
        isOccupied && styles.cardOccupied,
      ]}
      onPress={() => onPress(table)}
      activeOpacity={0.85}
    >
      {/* Ready Alert Pulsing Dot */}
      {isReady && (
        <View style={styles.readyIndicator}>
          <View style={styles.readyIndicatorInner} />
        </View>
      )}

      {/* Top Row: Table Num + Status Badge */}
      <View style={styles.topRow}>
        <View style={styles.numberGroup}>
          <Text style={styles.tableNum}>{displayNum}</Text>
          <Text style={styles.tableCode}>{tableCode || `TAB${displayNum}`}</Text>
        </View>
        <View style={styles.statusCol}>
          <StatusBadge status={isReady ? 'ready' : status} size="small" />
          {isMyTable && (
            <View style={styles.myTablePill}>
              <Text style={styles.myTablePillText}>My Table</Text>
            </View>
          )}
          {isOtherTable && (
            <View style={styles.otherTablePill}>
              <Text style={styles.otherTablePillText} numberOfLines={1}>
                {assignedWaiter ? assignedWaiter.split(' ')[0] : 'Other'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Middle & Bottom Info */}
      <View style={styles.bottomSection}>
        {/* Capacity / Timer Row */}
        <View style={styles.metaRow}>
          <View style={styles.capacityGroup}>
            <User size={13} color={colors.onSurfaceVariant} />
            <Text style={styles.capacityText}>
              {capacity ? `${capacity} Seats` : '4 Seats'}
            </Text>
          </View>

          {isOccupied && (
            <View style={styles.timerGroup}>
              <Clock size={12} color={colors.primaryContainer} />
              <Text style={styles.timerText}>20m</Text>
            </View>
          )}
        </View>

        {/* Footer Pill: Ready for guests OR Active Order OR Ready Food */}
        {isAvailable && (
          <View style={styles.footerPillAvailable}>
            <CheckCircle2 size={12} color={colors.readyGreen} />
            <Text style={styles.footerTextAvailable} numberOfLines={1}>
              Ready for Guests
            </Text>
          </View>
        )}

        {isOccupied && !isReady && (
          <View style={styles.footerPillOccupied}>
            <Text style={styles.footerTextOrder} numberOfLines={1}>
              {activeOrderNo ? `#${activeOrderNo}` : '#ORD-Active'}
            </Text>
            <ChevronRight size={13} color={colors.secondary} />
          </View>
        )}

        {isReady && (
          <View style={styles.footerPillReady}>
            <Utensils size={12} color={colors.tertiary} />
            <Text style={styles.footerTextReady} numberOfLines={1}>
              Hot dishes ready!
            </Text>
          </View>
        )}

        {isReserved && (
          <View style={styles.footerPillReserved}>
            <Text style={styles.footerTextReserved} numberOfLines={1}>
              Reserved 8:00 PM
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 154,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 14,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    ...layout.shadows.sm,
    position: 'relative',
  },
  cardOccupied: {
    borderColor: '#D0E1FD',
  },
  cardReady: {
    borderColor: colors.readyGreen,
    borderWidth: 1.5,
    shadowColor: colors.readyGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  readyIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#8FFF9B',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  readyIndicatorInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.readyGreen,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  myTablePill: {
    backgroundColor: '#EBF3FE',
    borderWidth: 1,
    borderColor: '#BDD7FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  myTablePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  otherTablePill: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: 80,
  },
  otherTablePillText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  numberGroup: {
    flexDirection: 'column',
  },
  tableNum: {
    ...typography.displayTableNum,
    color: colors.onSurface,
    lineHeight: 32,
  },
  tableCode: {
    ...typography.labelBadge,
    color: colors.onSurfaceVariant,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  bottomSection: {
    gap: 8,
    marginTop: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  capacityGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  capacityText: {
    ...typography.captionSm,
    color: colors.onSurfaceVariant,
  },
  timerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timerText: {
    ...typography.captionSm,
    color: colors.primaryContainer,
    fontWeight: '700',
  },
  footerPillAvailable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  footerTextAvailable: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.readyGreen,
    flex: 1,
  },
  footerPillOccupied: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.secondaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  footerTextOrder: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
    fontFamily: typography.captionSm.fontFamily,
  },
  footerPillReady: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.tertiaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  footerTextReady: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onTertiaryFixed,
    flex: 1,
  },
  footerPillReserved: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  footerTextReserved: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.outline,
  },
});
