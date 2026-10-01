import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Search, X, QrCode } from 'lucide-react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { layout } from '../constants/layout';

export default function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
  showScan = false,
  onScanPress,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.searchIcon}>
        <Search size={18} color={colors.onSurfaceVariant} />
      </View>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.onSurfaceVariant}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="never"
      />
      {value ? (
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={() => onChangeText('')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={16} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      ) : showScan ? (
        <TouchableOpacity
          style={styles.scanBtn}
          onPress={onScanPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <QrCode size={18} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerLowest,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...layout.shadows.sm,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    ...typography.bodyMd,
    color: colors.onSurface,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  scanBtn: {
    padding: 4,
  },
});
