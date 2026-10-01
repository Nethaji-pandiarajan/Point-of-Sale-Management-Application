import React from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

export default function CategoryPills({
  categories = [],
  selectedCategory,
  onSelectCategory,
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((cat) => {
        const isSelected = selectedCategory === cat.id;
        return (
          <TouchableOpacity
            key={cat.id}
            style={[styles.pill, isSelected ? styles.pillActive : styles.pillInactive]}
            onPress={() => onSelectCategory(cat.id)}
            activeOpacity={0.8}
          >
            {cat.dotColor && (
              <View style={[styles.dot, { backgroundColor: cat.dotColor }]} />
            )}
            <Text
              style={[
                styles.pillText,
                isSelected ? styles.pillTextActive : styles.pillTextInactive,
              ]}
            >
              {cat.name}
            </Text>
            {cat.count !== undefined && (
              <View
                style={[
                  styles.countBadge,
                  isSelected ? styles.countBadgeActive : styles.countBadgeInactive,
                ]}
              >
                <Text
                  style={[
                    styles.countText,
                    isSelected ? styles.countTextActive : styles.countTextInactive,
                  ]}
                >
                  {cat.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  pill: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillActive: {
    backgroundColor: colors.primaryContainer,
  },
  pillInactive: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillText: {
    ...typography.labelBadge,
  },
  pillTextActive: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  pillTextInactive: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 9999,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  countBadgeInactive: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
  },
  countTextActive: {
    color: colors.onPrimary,
  },
  countTextInactive: {
    color: colors.onSurfaceVariant,
  },
});
