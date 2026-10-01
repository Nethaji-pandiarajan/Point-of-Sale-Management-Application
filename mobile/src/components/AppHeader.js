import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Bell } from 'lucide-react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { useAuth } from '../context/AuthContext';
import SaleizLogo from './SaleizLogo';

export default function AppHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightElement,
}) {
  const insets = useSafeAreaInsets();
  const { user, floor, shift } = useAuth();

  return (
    <View style={[styles.headerWrapper, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.headerContent}>
        {/* Left Section: Back button OR Brand / Title */}
        <View style={styles.leftSection}>
          {showBack ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Go Back"
            >
              <ChevronLeft size={24} color={colors.onSurface} strokeWidth={2.5} />
            </TouchableOpacity>
          ) : (
            <SaleizLogo size={32} showText={false} />
          )}

          <View style={styles.titleColumn}>
            <Text style={styles.titleText} numberOfLines={1}>
              {title || 'Saleiz Waiter'}
            </Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.subtitleText} numberOfLines={1}>
                {subtitle || `${floor || 'Floor A'} • ${shift ? 'Shift Active' : 'Online'}`}
              </Text>
            </View>
          </View>
        </View>

        {/* Right Section: Notifications & Avatar */}
        <View style={styles.rightSection}>
          {rightElement ? (
            rightElement
          ) : (
            <>
              <TouchableOpacity
                style={styles.iconButton}
                accessibilityLabel="Notifications"
                activeOpacity={0.7}
              >
                <Bell size={20} color={colors.onSurface} />
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>3</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.avatarWrapper}>
                <Image
                  source={{
                    uri:
                      (user && user.profileImage) ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                  }}
                  style={styles.avatar}
                />
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    zIndex: 100,
  },
  headerContent: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleColumn: {
    flexDirection: 'column',
    justifyContent: 'center',
    flex: 1,
  },
  titleText: {
    ...typography.titleSm,
    color: colors.onSurface,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.readyGreen,
  },
  subtitleText: {
    ...typography.captionSm,
    color: colors.onSurfaceVariant,
    fontWeight: '500',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.primaryContainer,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notificationBadgeText: {
    color: colors.onPrimary,
    fontSize: 9,
    fontWeight: '700',
  },
  avatarWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
});
