import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Path, Circle } from 'react-native-svg';
import { colors } from '../constants/colors';

export default function SaleizLogo({ size = 32, showText = true }) {
  const scale = size / 40;
  return (
    <View style={styles.container}>
      <Svg width={40 * scale} height={40 * scale} viewBox="0 0 40 40" fill="none">
        <Rect width="40" height="40" rx="10" fill={colors.primaryContainer} />
        <Path
          d="M14 26C14 20 18 16 24 16C26 16 28 17 30 18.5V12L32 11V22C32 27 28 31 22 31C17 31 14 28 14 26Z"
          fill="#FFFFFF"
          opacity={0.95}
        />
        <Path
          d="M20 18C22 14 26 13 30 13M22 22L28 28"
          stroke={colors.primaryContainer}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <Circle cx="26" cy="22" r="2.8" fill="#FFFFFF" />
      </Svg>
      {showText && (
        <View style={styles.textContainer}>
          <Text style={styles.brandTitle}>SALEIZ</Text>
          <Text style={styles.brandSubtitle}>WAITER OPS</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textContainer: {
    flexDirection: 'column',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: colors.onSurface,
    lineHeight: 18,
  },
  brandSubtitle: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.primaryContainer,
    lineHeight: 10,
  },
});
