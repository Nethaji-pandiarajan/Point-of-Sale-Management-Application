import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

export default function QuantityStepper({ quantity, onIncrease, onDecrease, min = 0 }) {
  return (
    <View style={styles.stepperContainer}>
      <TouchableOpacity
        style={styles.btn}
        onPress={onDecrease}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel="Decrease quantity"
      >
        <Minus size={15} color={colors.onPrimary} strokeWidth={2.5} />
      </TouchableOpacity>

      <Text style={styles.qtyText}>{quantity}</Text>

      <TouchableOpacity
        style={styles.btn}
        onPress={onIncrease}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel="Increase quantity"
      >
        <Plus size={15} color={colors.onPrimary} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    borderRadius: 12,
    height: 38,
    paddingHorizontal: 4,
    shadowColor: colors.primaryContainer,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  btn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    ...typography.labelNumeric,
    color: colors.onPrimary,
    minWidth: 26,
    textAlign: 'center',
    fontWeight: '800',
  },
});
