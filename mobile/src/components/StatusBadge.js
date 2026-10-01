import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

export default function StatusBadge({ status, label, size = 'medium' }) {
  const normStatus = (status || '').toLowerCase();

  let bg = colors.surfaceContainer;
  let text = colors.onSurfaceVariant;
  let dotColor = colors.onSurfaceVariant;
  let displayLabel = label;

  switch (normStatus) {
    case 'available':
    case 'open':
      bg = colors.readyTint;
      text = colors.readyGreen;
      dotColor = colors.readyGreen;
      displayLabel = displayLabel || 'OPEN';
      break;

    case 'occupied':
    case 'busy':
    case 'in_service':
      bg = colors.secondaryFixed;
      text = colors.onSecondaryFixedVariant;
      dotColor = colors.secondary;
      displayLabel = displayLabel || 'BUSY';
      break;

    case 'preparing':
    case 'prepped':
      bg = colors.preparingTint;
      text = colors.preparingDark;
      dotColor = colors.preparing;
      displayLabel = displayLabel || 'PREPARING';
      break;

    case 'ready':
    case 'ready_for_pickup':
      bg = colors.tertiaryContainer;
      text = colors.onTertiary;
      dotColor = colors.onTertiary;
      displayLabel = displayLabel || 'READY';
      break;

    case 'served':
      bg = colors.readyTint;
      text = colors.tertiary;
      dotColor = colors.tertiary;
      displayLabel = displayLabel || 'SERVED';
      break;

    case 'reserved':
      bg = colors.surfaceContainerHigh;
      text = colors.outline;
      dotColor = colors.outline;
      displayLabel = displayLabel || 'RESERVED';
      break;

    case 'completed':
      bg = colors.readyTint;
      text = colors.readyGreen;
      dotColor = colors.readyGreen;
      displayLabel = displayLabel || 'COMPLETED';
      break;

    default:
      bg = colors.surfaceContainerHigh;
      text = colors.onSurfaceVariant;
      dotColor = colors.onSurfaceVariant;
      displayLabel = displayLabel || status?.toUpperCase() || 'INFO';
  }

  const isSmall = size === 'small';

  return (
    <View style={[styles.badge, { backgroundColor: bg }, isSmall && styles.badgeSmall]}>
      <View style={[styles.dot, { backgroundColor: dotColor }, isSmall && styles.dotSmall]} />
      <Text style={[styles.label, { color: text }, isSmall && styles.labelSmall]}>
        {displayLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    gap: 5,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotSmall: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  label: {
    ...typography.captionSm,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  labelSmall: {
    fontSize: 10,
    lineHeight: 12,
  },
});
