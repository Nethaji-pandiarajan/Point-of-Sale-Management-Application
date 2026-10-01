import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import {
  User,
  Clock,
  MapPin,
  LogOut,
  Shield,
  Bell,
  Wifi,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Phone,
  Volume2,
  Utensils,
  RefreshCw,
  Info,
  Calendar,
  Smartphone,
  ExternalLink,
} from 'lucide-react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { layout } from '../constants/layout';
import AppHeader from '../components/AppHeader';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useKitchenAlert } from '../context/KitchenAlertContext';
import { orderApi } from '../api/orderApi';
import { tableApi } from '../api/tableApi';
import { getProductImageUrl } from '../utils/imageUrl';

export default function ProfileScreen({ navigation }) {
  const { user, logout, shift, floor, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const { isSoundAlertEnabled, setSoundAlertEnabled, toggleSoundAlert, playTestSound } = useKitchenAlert();

  // State
  const [tables, setTables] = useState([]);
  const [myAssignedTables, setMyAssignedTables] = useState([]);
  const [stats, setStats] = useState({
    tablesServed: 0,
    ordersHandled: 0,
    ordersCompleted: 0,
    activeOrders: 0,
    cancelledOrders: 0,
    revenueSettled: 0,
    avgServiceTimeMins: null,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Load all profile, table and order data for current waiter
  const loadProfileData = useCallback(async () => {
    if (!user?.id) return;

    try {
      const [ordersRes, tablesRes] = await Promise.allSettled([
        orderApi.getOrders({ waiterId: user.id, limit: 100 }),
        tableApi.getTables({ limit: 50 }),
      ]);

      let isSuccess = false;

      // 1. Process Orders
      if (ordersRes.status === 'fulfilled' && ordersRes.value?.data) {
        isSuccess = true;
        const waiterOrders = ordersRes.value.data;
        const completedOrders = waiterOrders.filter((o) => o.status === 'completed');
        const activeOrders = waiterOrders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled');
        const cancelledOrders = waiterOrders.filter((o) => o.status === 'cancelled');

        const distinctTables = new Set(waiterOrders.map((o) => o.tableNo || o.tableCode || o.id)).size;
        const totalRev = completedOrders.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);

        // Calculate average service duration across completed orders
        let totalDurationMs = 0;
        let countWithDuration = 0;
        for (const o of completedOrders) {
          const finish = o.completedAt || o.servedAt || o.updatedAt;
          if (finish && o.createdAt) {
            const diff = new Date(finish).getTime() - new Date(o.createdAt).getTime();
            if (diff > 0 && diff <= 4 * 3600 * 1000) {
              totalDurationMs += diff;
              countWithDuration++;
            }
          }
        }
        const avgMins = countWithDuration > 0 ? Math.round(totalDurationMs / (countWithDuration * 60000)) : null;

        setStats({
          tablesServed: distinctTables,
          ordersHandled: waiterOrders.length,
          ordersCompleted: completedOrders.length,
          activeOrders: activeOrders.length,
          cancelledOrders: cancelledOrders.length,
          revenueSettled: Math.round(totalRev),
          avgServiceTimeMins: avgMins,
        });
      }

      // 2. Process Tables
      if (tablesRes.status === 'fulfilled' && tablesRes.value?.data) {
        isSuccess = true;
        const allTables = tablesRes.value.data;
        setTables(allTables);

        // Filter strictly to current waiter's active picked/assigned tables
        const myActive = allTables.filter(
          (t) => t.assignedWaiterId === user.id && t.status !== 'available'
        );
        setMyAssignedTables(myActive);
      }

      if (isSuccess) {
        setIsOnline(true);
        setLastSyncTime(new Date());
      }
    } catch (err) {
      console.warn('[ProfileScreen] Failed to load waiter profile data:', err.message);
      setIsOnline(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProfileData();
  };

  // Sound Test Action
  const handleTestKitchenAlert = () => {
    if (typeof playTestSound === 'function') {
      playTestSound();
    }
    showToast({
      message: 'Kitchen alert chime played',
      type: 'ready',
      duration: 3000,
    });
  };

  // Safe Logout with Confirmation
  const confirmLogout = () => {
    const executeLogout = () => {
      logout();
      showToast({ message: 'Logged out successfully', type: 'info' });
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Are you sure you want to log out of your shift session?')) {
        executeLogout();
      }
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to log out of your shift session?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', style: 'destructive', onPress: executeLogout },
        ]
      );
    }
  };

  // Helper info dialogs
  const showHelpDialog = () => {
    Alert.alert(
      'Help & Support',
      'For table reassignments, POS terminal assistance, or order adjustments, please speak to your Floor Manager or visit the central POS desk.',
      [{ text: 'Got it' }]
    );
  };

  const showReportIssueDialog = () => {
    Alert.alert(
      'Report an Issue',
      'To report kitchen ticket delays, printer issues, or billing discrepancies, log the ticket number with your shift supervisor at the station pass.',
      [{ text: 'Close' }]
    );
  };

  const showAboutDialog = () => {
    Alert.alert(
      'About Saleiz Waiter',
      'Saleiz Waiter Mobile v1.0.0\nBuild: Production Preview\nBackend: http://192.168.1.45:5000\nConnected to PostgreSQL & Realtime KDS.',
      [{ text: 'OK' }]
    );
  };

  // Format relative last sync string
  const getSyncLabel = () => {
    if (!lastSyncTime) return 'Just now';
    const elapsedSecs = Math.floor((Date.now() - lastSyncTime.getTime()) / 1000);
    if (elapsedSecs < 60) return 'Just now';
    const mins = Math.floor(elapsedSecs / 60);
    return `${mins} min ago`;
  };

  // Resolve profile image
  const resolvedProfileUri = user?.profileImage ? getProductImageUrl(user.profileImage) : null;
  const employeeCode = user?.id ? `WT-${String(user.id).padStart(3, '0')}` : null;

  return (
    <View style={styles.screen}>
      <AppHeader title="Waiter Profile" subtitle="Staff Credentials & Shift" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryContainer} />
        }
      >
        {/* 1. PROFILE IDENTITY CARD */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeaderRow}>
            {resolvedProfileUri ? (
              <Image source={{ uri: resolvedProfileUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <User size={34} color={colors.onSurfaceVariant} />
              </View>
            )}

            <View style={styles.profileHeaderInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user?.name || 'Staff Waiter'}
                </Text>
                <View style={styles.roleTag}>
                  <Text style={styles.roleTagText}>
                    {(user?.role || 'waiter').toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.userEmail} numberOfLines={1}>
                {user?.email || 'waiter@saleiz.com'}
              </Text>

              {/* Verified Credentials Row */}
              <View style={styles.credentialsRow}>
                {employeeCode && (
                  <View style={styles.credBadge}>
                    <Shield size={11} color={colors.onSurfaceVariant} />
                    <Text style={styles.credBadgeText}>{employeeCode}</Text>
                  </View>
                )}

                {user?.phone ? (
                  <View style={styles.credBadge}>
                    <Phone size={11} color={colors.onSurfaceVariant} />
                    <Text style={styles.credBadgeText}>{user.phone}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </View>

        {/* 2. ACTIVE SHIFT CARD */}
        <View style={styles.sectionCard}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.sectionHeaderTitle}>ACTIVE SHIFT ASSIGNMENT</Text>
            <View style={styles.activeDotBadge}>
              <View style={styles.greenDot} />
              <Text style={styles.activeDotText}>Active</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Clock size={18} color={colors.primaryContainer} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Assigned Shift</Text>
              <Text style={styles.infoVal}>{user?.shift || shift || 'Dinner (5:00 PM – 11:30 PM)'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <MapPin size={18} color={colors.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Assigned Floor Section</Text>
              <Text style={styles.infoVal}>{user?.floor || floor || 'Floor A (Tables 1 – 9)'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Calendar size={18} color={colors.tertiaryContainer} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Shift Started</Text>
              <Text style={styles.infoVal}>5:00 PM (Today)</Text>
            </View>
          </View>
        </View>

        {/* 3. MY TABLES — LIVE ASSIGNMENT SECTION */}
        <View style={styles.sectionCard}>
          <View style={styles.cardTitleRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Utensils size={15} color={colors.onSurface} />
              <Text style={styles.sectionHeaderTitle}>MY TABLES</Text>
              <View style={styles.countPill}>
                <Text style={styles.countPillText}>{myAssignedTables.length}</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('Tables')}
              activeOpacity={0.7}
              style={styles.viewAllBtn}
            >
              <Text style={styles.viewAllText}>Floor View</Text>
              <ChevronRight size={14} color={colors.primaryContainer} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={colors.primaryContainer} style={{ paddingVertical: 14 }} />
          ) : myAssignedTables.length > 0 ? (
            <View style={styles.myTablesGrid}>
              {myAssignedTables.map((table) => {
                const isReady = table.activeOrderStatus === 'ready';
                const isPreparing = table.activeOrderStatus === 'preparing';
                const isServed = table.activeOrderStatus === 'served';

                return (
                  <TouchableOpacity
                    key={String(table.id)}
                    style={[
                      styles.myTableItemCard,
                      isReady && styles.myTableCardReady,
                    ]}
                    onPress={() => navigation.navigate('Tables')}
                    activeOpacity={0.82}
                  >
                    <View style={styles.myTableTopRow}>
                      <Text style={styles.myTableNumberText}>
                        {table.tableCode || table.tableNumber || `T${table.id}`}
                      </Text>
                      <View
                        style={[
                          styles.tableStatusPill,
                          isReady
                            ? styles.statusPillReady
                            : isPreparing
                            ? styles.statusPillPreparing
                            : isServed
                            ? styles.statusPillServed
                            : styles.statusPillOccupied,
                        ]}
                      >
                        <Text
                          style={[
                            styles.tableStatusPillText,
                            isReady
                              ? styles.statusTextReady
                              : isPreparing
                              ? styles.statusTextPreparing
                              : isServed
                              ? styles.statusTextServed
                              : styles.statusTextOccupied,
                          ]}
                        >
                          {isReady ? 'Ready' : isPreparing ? 'Cooking' : isServed ? 'Served' : 'Active'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.myTableSubText}>
                      {table.guestCount ? `${table.guestCount} Guests` : `${table.capacity || 4} Seats`}
                      {table.activeOrderId ? ` • #${table.activeOrderId}` : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyTablesBox}>
              <Utensils size={28} color={colors.onSurfaceVariant} opacity={0.4} />
              <Text style={styles.emptyTablesTitle}>No tables assigned yet</Text>
              <Text style={styles.emptyTablesSub}>
                Pick an available dining table from Floor View to start an order.
              </Text>
              <TouchableOpacity
                style={styles.pickTableCta}
                onPress={() => navigation.navigate('Tables')}
                activeOpacity={0.8}
              >
                <Text style={styles.pickTableCtaText}>Go to Floor View</Text>
                <ChevronRight size={14} color={colors.onPrimary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 4. TODAY'S SERVICE STATS */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>TODAY'S SERVICE STATS</Text>

          {loading ? (
            <ActivityIndicator size="small" color={colors.primaryContainer} style={{ paddingVertical: 12 }} />
          ) : (
            <>
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statNum}>{stats.tablesServed}</Text>
                  <Text style={styles.statLabel}>Tables Served</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNum}>{stats.ordersHandled}</Text>
                  <Text style={styles.statLabel}>Orders Handled</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statNum, { color: colors.readyGreen }]}>{stats.ordersCompleted}</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
              </View>

              {/* Revenue settled info */}
              <View style={styles.revenueRow}>
                <Text style={styles.revenueLabel}>Revenue Settled Today</Text>
                <Text style={styles.revenueAmount}>₹{stats.revenueSettled.toLocaleString('en-IN')}</Text>
              </View>
            </>
          )}
        </View>

        {/* 5. SERVICE SUMMARY (Performance Metrics) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>SERVICE SUMMARY</Text>

          <View style={styles.summaryItemRow}>
            <Text style={styles.summaryItemLabel}>Average Service Time</Text>
            <Text style={styles.summaryItemValue}>
              {stats.avgServiceTimeMins !== null ? `${stats.avgServiceTimeMins} min` : '18 min'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryItemRow}>
            <Text style={styles.summaryItemLabel}>Active In-Progress Tickets</Text>
            <Text style={[styles.summaryItemValue, stats.activeOrders > 0 && { color: colors.primaryContainer }]}>
              {stats.activeOrders} {stats.activeOrders === 1 ? 'ticket' : 'tickets'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryItemRow}>
            <Text style={styles.summaryItemLabel}>Completed & Settled</Text>
            <Text style={[styles.summaryItemValue, { color: colors.readyGreen }]}>
              {stats.ordersCompleted} orders
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryItemRow}>
            <Text style={styles.summaryItemLabel}>Cancelled / Voided</Text>
            <Text style={styles.summaryItemValue}>{stats.cancelledOrders} voided</Text>
          </View>
        </View>

        {/* 6. APP & NOTIFICATION PREFERENCES */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>APP & NOTIFICATION PREFERENCES</Text>

          {/* Sound Alert Toggle */}
          <View style={styles.prefRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View style={styles.prefIconBox}>
                <Bell size={16} color={colors.onSurface} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.prefText}>Kitchen Ready Sound Alert</Text>
                <Text style={styles.prefSub}>Play chime when kitchen marks order ready</Text>
              </View>
            </View>

            <Switch
              value={isSoundAlertEnabled}
              onValueChange={setSoundAlertEnabled}
              trackColor={{ false: colors.surfaceContainerHighest, true: colors.readyGreen }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          {/* Test Kitchen Sound Button */}
          <TouchableOpacity
            style={styles.prefActionRow}
            onPress={handleTestKitchenAlert}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.prefIconBox}>
                <Volume2 size={16} color={colors.primaryContainer} />
              </View>
              <Text style={[styles.prefText, { color: colors.primaryContainer, fontWeight: '700' }]}>
                Test Kitchen Alert Sound
              </Text>
            </View>
            <View style={styles.testBadge}>
              <Text style={styles.testBadgeText}>Play Chime</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* In-App Toast Alert Status */}
          <View style={styles.prefRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.prefIconBox}>
                <Smartphone size={16} color={colors.onSurface} />
              </View>
              <Text style={styles.prefText}>In-App Pickup Banners</Text>
            </View>
            <View style={styles.activeDotBadge}>
              <View style={styles.greenDot} />
              <Text style={styles.activeDotText}>Active</Text>
            </View>
          </View>
        </View>

        {/* 7. APP STATUS (Connection & Sync Status) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>APP STATUS</Text>

          <View style={styles.statusInfoRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.statusDot, !isOnline && { backgroundColor: colors.error }]} />
              <Text style={styles.statusInfoLabel}>Server Connection</Text>
            </View>
            <Text style={[styles.statusInfoVal, !isOnline && { color: colors.error }]}>
              {isOnline ? 'Online (192.168.1.45)' : 'Offline'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statusInfoRow}>
            <Text style={styles.statusInfoLabel}>Order Sync</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 size={13} color={colors.readyGreen} />
              <Text style={[styles.statusInfoVal, { color: colors.readyGreen }]}>Synced</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.statusInfoRow}>
            <Text style={styles.statusInfoLabel}>Last Sync</Text>
            <Text style={styles.statusInfoVal}>{getSyncLabel()}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statusInfoRow}>
            <Text style={styles.statusInfoLabel}>App Version</Text>
            <Text style={styles.statusInfoVal}>v1.0.0 (Expo EAS)</Text>
          </View>
        </View>

        {/* 8. ACCOUNT & SUPPORT */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>ACCOUNT & SUPPORT</Text>

          <TouchableOpacity style={styles.supportRow} onPress={showHelpDialog} activeOpacity={0.7}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <HelpCircle size={18} color={colors.onSurface} />
              <Text style={styles.supportRowText}>Help & Floor Support</Text>
            </View>
            <ChevronRight size={16} color={colors.onSurfaceVariant} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.supportRow} onPress={showReportIssueDialog} activeOpacity={0.7}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={18} color={colors.onSurface} />
              <Text style={styles.supportRowText}>Report a Service Issue</Text>
            </View>
            <ChevronRight size={16} color={colors.onSurfaceVariant} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.supportRow} onPress={showAboutDialog} activeOpacity={0.7}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Info size={18} color={colors.onSurface} />
              <Text style={styles.supportRowText}>About Saleiz Waiter</Text>
            </View>
            <ChevronRight size={16} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {/* 9. LOGOUT ACTION */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={confirmLogout}
          activeOpacity={0.85}
        >
          <LogOut size={18} color={colors.onErrorContainer} strokeWidth={2.2} />
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.appFooterText}>
          Saleiz Waiter Mobile • {user?.name || 'Staff'} ({user?.email || 'waiter@saleiz.com'})
        </Text>

        {/* Bottom Navigation Clearance Spacing */}
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
    paddingBottom: 40,
    gap: 12,
  },
  // Profile Identity Card
  profileCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...layout.shadows.sm,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: colors.primaryContainer,
  },
  avatarFallback: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileHeaderInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  userName: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontWeight: '800',
    fontSize: 18,
  },
  roleTag: {
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: 0.5,
  },
  userEmail: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    fontSize: 13,
    marginTop: 2,
  },
  credentialsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  credBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  credBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },

  // Standard Section Card
  sectionCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
    ...layout.shadows.sm,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderTitle: {
    ...typography.captionSm,
    color: colors.onSurfaceVariant,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  countPill: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 9999,
  },
  countPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.onSurface,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryContainer,
  },

  // Shift rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    fontWeight: '500',
  },
  infoVal: {
    ...typography.bodyMdBold,
    color: colors.onSurface,
    fontSize: 13,
    marginTop: 1,
  },
  activeDotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.readyTint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.readyGreen,
  },
  activeDotText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.readyGreen,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceContainer,
  },

  // My Tables Grid
  myTablesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  myTableItemCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  myTableCardReady: {
    borderColor: colors.readyGreen,
    backgroundColor: colors.readyTint,
  },
  myTableTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  myTableNumberText: {
    ...typography.titleSm,
    color: colors.onSurface,
    fontWeight: '800',
    fontSize: 14,
  },
  tableStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  statusPillReady: {
    backgroundColor: colors.readyGreen,
  },
  statusTextReady: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  statusPillPreparing: {
    backgroundColor: '#fff3e0',
  },
  statusTextPreparing: {
    color: '#e65100',
    fontSize: 9,
    fontWeight: '800',
  },
  statusPillServed: {
    backgroundColor: '#e0f2f1',
  },
  statusTextServed: {
    color: '#00695c',
    fontSize: 9,
    fontWeight: '800',
  },
  statusPillOccupied: {
    backgroundColor: colors.surfaceContainerHighest,
  },
  statusTextOccupied: {
    color: colors.onSurfaceVariant,
    fontSize: 9,
    fontWeight: '700',
  },
  myTableSubText: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    fontWeight: '500',
  },

  // Empty tables state
  emptyTablesBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  emptyTablesTitle: {
    ...typography.titleSm,
    color: colors.onSurface,
    fontWeight: '700',
    fontSize: 13,
  },
  emptyTablesSub: {
    ...typography.captionSm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: 20,
    fontSize: 11,
  },
  pickTableCta: {
    marginTop: 6,
    height: 32,
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pickTableCtaText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.onPrimary,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  statNum: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontWeight: '800',
    fontSize: 18,
  },
  statLabel: {
    fontSize: 10,
    color: colors.onSurfaceVariant,
    marginTop: 2,
    textAlign: 'center',
    fontWeight: '500',
  },
  revenueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 2,
  },
  revenueLabel: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    fontWeight: '600',
  },
  revenueAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.onSurface,
  },

  // Service Summary rows
  summaryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  summaryItemLabel: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
    fontWeight: '500',
  },
  summaryItemValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurface,
  },

  // Preferences
  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  prefIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefText: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontWeight: '600',
    fontSize: 13,
  },
  prefSub: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 1,
  },
  prefActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  testBadge: {
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  testBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onPrimary,
  },

  // App Status
  statusInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.readyGreen,
  },
  statusInfoLabel: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    fontWeight: '500',
  },
  statusInfoVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.onSurface,
  },

  // Support rows
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  supportRowText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.onSurface,
  },

  // Logout Button
  logoutBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.errorContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.2)',
  },
  logoutBtnText: {
    ...typography.titleSm,
    color: colors.onErrorContainer,
    fontWeight: '700',
    fontSize: 14,
  },
  appFooterText: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 2,
    opacity: 0.7,
  },
});
