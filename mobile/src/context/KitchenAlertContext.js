import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { tableApi } from '../api/tableApi';
import { orderApi } from '../api/orderApi';
import soundService from '../services/soundService';
import { navigate } from '../navigation/navigationRef';

const KitchenAlertContext = createContext(null);

const SOUND_PREF_KEY = '@saleiz_kitchen_sound_alert_enabled';

export function KitchenAlertProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();

  const [isSoundAlertEnabled, setIsSoundAlertEnabledState] = useState(true);
  const [prefLoading, setPrefLoading] = useState(true);

  // References to track state without closure stale issues
  const isSoundEnabledRef = useRef(true);
  const previousStatusesRef = useRef({}); // { [orderId]: status }
  const alertedReadyIdsRef = useRef(new Set()); // Set of orderIds that have alerted
  const isFirstPollRef = useRef(true);

  // 1. Load sound alert preference from storage
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(SOUND_PREF_KEY);
        if (stored !== null) {
          const val = stored === 'true';
          setIsSoundAlertEnabledState(val);
          isSoundEnabledRef.current = val;
        }
      } catch (err) {
        console.warn('Failed to read sound preference:', err.message);
      } finally {
        setPrefLoading(false);
      }
    })();
  }, []);

  // 2. Preload sound on app mount
  useEffect(() => {
    soundService.init();
    return () => {
      soundService.release();
    };
  }, []);

  // 3. Toggle sound alert preference
  const setSoundAlertEnabled = useCallback(async (enabled) => {
    try {
      setIsSoundAlertEnabledState(enabled);
      isSoundEnabledRef.current = enabled;
      await AsyncStorage.setItem(SOUND_PREF_KEY, enabled ? 'true' : 'false');
    } catch (err) {
      console.warn('Failed to persist sound preference:', err.message);
    }
  }, []);

  const toggleSoundAlert = useCallback(() => {
    setSoundAlertEnabled(!isSoundAlertEnabled);
  }, [isSoundAlertEnabled, setSoundAlertEnabled]);

  // 4. Polling & Status Transition Detection
  const checkKitchenStatusTransitions = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      // Fetch both tables and incomplete orders to ensure complete coverage
      const [tablesRes, ordersRes] = await Promise.allSettled([
        tableApi.getTables({ limit: 50 }),
        orderApi.getOrders({ status: 'incomplete', limit: 50 }),
      ]);

      // Collect all active orders with their tables
      const activeItems = [];

      // From tables API: each table may have activeOrderId & activeOrderStatus
      if (tablesRes.status === 'fulfilled' && tablesRes.value?.data) {
        for (const t of tablesRes.value.data) {
          if (t.activeOrderId && t.activeOrderStatus) {
            activeItems.push({
              orderId: t.activeOrderId,
              orderNo: t.activeOrderNo,
              status: t.activeOrderStatus,
              tableCode: t.tableCode,
              tableNo: t.tableNumber || `Table ${t.tableCode?.replace(/\D/g, '')}` || t.tableCode,
              tableId: t.id,
              waiterId: t.assignedWaiterId,
            });
          }
        }
      }

      // From orders API: check active orders
      if (ordersRes.status === 'fulfilled' && ordersRes.value?.data) {
        for (const o of ordersRes.value.data) {
          const existing = activeItems.find((item) => item.orderId === o.id);
          if (!existing) {
            activeItems.push({
              orderId: o.id,
              orderNo: o.orderNo,
              status: o.status,
              tableCode: o.tableCode || o.tableNo,
              tableNo: o.tableNo || 'Table',
              tableId: o.tableId,
              waiterId: o.waiterId,
            });
          } else {
            // Prefer the most updated status
            existing.status = o.status || existing.status;
            if (o.waiterId && !existing.waiterId) {
              existing.waiterId = o.waiterId;
            }
          }
        }
      }

      // Handle first poll: mark already-ready orders as already alerted
      if (isFirstPollRef.current) {
        for (const item of activeItems) {
          previousStatusesRef.current[item.orderId] = item.status;
          if (item.status === 'ready') {
            alertedReadyIdsRef.current.add(item.orderId);
          }
        }
        isFirstPollRef.current = false;
        return;
      }

      // Subsequent polls: detect NEW transitions into 'ready'
      for (const item of activeItems) {
        const { orderId, orderNo, status, tableNo, tableCode, waiterId } = item;
        const prevStatus = previousStatusesRef.current[orderId];

        const isNowReady = status === 'ready';
        const wasNotReady = prevStatus && prevStatus !== 'ready';
        const hasNotAlerted = !alertedReadyIdsRef.current.has(orderId);
        const isMyOrder = !waiterId || (user?.id && waiterId === user.id);

        if (isNowReady && (wasNotReady || hasNotAlerted) && hasNotAlerted) {
          // 🔔 Mark as alerted so we never repeat
          alertedReadyIdsRef.current.add(orderId);

          // Only alert this waiter if it is their order!
          if (isMyOrder) {
            // 1. Play sound if preference enabled
            if (isSoundEnabledRef.current) {
              soundService.playKitchenReadySound();
            }

            // 2. Show in-app alert toast
            const displayTable = tableNo || tableCode || 'Table';
            showToast({
              message: `${displayTable} is ready for pickup`,
              type: 'ready',
              duration: 6000,
              onPress: () => {
                navigate('KitchenStatus', {
                  orderId,
                  tableNo: displayTable,
                });
              },
            });
          }
        }

        // Clean up resolved orders from alerted set if they transitioned past ready
        if (status === 'served' || status === 'completed' || status === 'cancelled') {
          alertedReadyIdsRef.current.delete(orderId);
        }

        // Update known status
        previousStatusesRef.current[orderId] = status;
      }
    } catch (err) {
      if (err.status !== 401) {
        console.warn('Kitchen alert polling error:', err.message);
      }
    }
  }, [isAuthenticated, showToast]);

  // Set up polling interval
  useEffect(() => {
    if (!isAuthenticated) return;

    // Run first check
    checkKitchenStatusTransitions();

    const interval = setInterval(() => {
      checkKitchenStatusTransitions();
    }, 4000);

    return () => clearInterval(interval);
  }, [isAuthenticated, checkKitchenStatusTransitions]);

  return (
    <KitchenAlertContext.Provider
      value={{
        isSoundAlertEnabled,
        setSoundAlertEnabled,
        toggleSoundAlert,
        prefLoading,
        playTestSound: soundService.playKitchenReadySound,
      }}
    >
      {children}
    </KitchenAlertContext.Provider>
  );
}

export function useKitchenAlert() {
  const context = useContext(KitchenAlertContext);
  if (!context) {
    throw new Error('useKitchenAlert must be used within a KitchenAlertProvider');
  }
  return context;
}
