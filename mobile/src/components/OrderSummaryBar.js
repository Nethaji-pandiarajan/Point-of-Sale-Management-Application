import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ShoppingBag, ArrowRight } from 'lucide-react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { layout } from '../constants/layout';

export default function OrderSummaryBar({
  itemCount = 0,
  totalAmount = 0,
  onPress,
  buttonLabel = 'View Order',
}) {
  if (itemCount === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.leftInfo}>
          <View style={styles.bagIconBox}>
            <ShoppingBag size={20} color={colors.onPrimary} />
          </View>
          <View style={styles.textGroup}>
            <Text style={styles.tabLabel}>CURRENT TABLE TAB</Text>
            <View style={styles.amountsRow}>
              <Text style={styles.itemCountText}>{itemCount} Items</Text>
              <Text style={styles.dotSeparator}>•</Text>
              <Text style={styles.totalAmountText}>₹{totalAmount.toFixed(0)}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onPress}
          activeOpacity={0.88}
        >
          <Text style={styles.actionBtnText}>{buttonLabel}</Text>
          <ArrowRight size={18} color={colors.primaryContainer} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    zIndex: 50,
  },
  card: {
    backgroundColor: colors.primaryContainer,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...layout.shadows.lg,
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  bagIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textGroup: {
    flexDirection: 'column',
  },
  tabLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
  },
  amountsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    marginTop: 1,
  },
  itemCountText: {
    ...typography.titleSm,
    color: colors.onPrimary,
    fontWeight: '700',
  },
  dotSeparator: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  totalAmountText: {
    ...typography.headlineMd,
    color: colors.onPrimary,
    fontWeight: '800',
  },
  actionBtn: {
    backgroundColor: colors.surfaceContainerLowest,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtnText: {
    ...typography.titleSm,
    color: colors.primaryContainer,
    fontWeight: '700',
    fontSize: 14,
  },
});
