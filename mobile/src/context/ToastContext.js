import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { CheckCircle2, AlertCircle, Info, Bell, X, ArrowRight } from 'lucide-react-native';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  const hideToast = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setToast(null));
  }, [fadeAnim]);

  const showToast = useCallback(({ message, type = 'success', duration = 3500, onPress = null, actionText = null }) => {
    setToast({ message, type, onPress, actionText });
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    if (duration > 0) {
      setTimeout(() => {
        hideToast();
      }, duration);
    }
  }, [fadeAnim, hideToast]);

  const handlePress = () => {
    if (toast?.onPress) {
      toast.onPress();
    }
    hideToast();
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={toast.onPress ? 0.85 : 1}
            onPress={toast.onPress ? handlePress : undefined}
            style={[
              styles.toastCard,
              toast.type === 'ready' && styles.readyToastCard,
            ]}
          >
            <View style={styles.contentRow}>
              {toast.type === 'ready' && (
                <View style={styles.readyBellIconBox}>
                  <Bell size={18} color="#FFFFFF" />
                </View>
              )}
              {toast.type === 'success' && <CheckCircle2 size={18} color={colors.tertiaryFixed} />}
              {toast.type === 'error' && <AlertCircle size={18} color={colors.errorContainer} />}
              {toast.type === 'info' && <Info size={18} color={colors.secondaryFixed} />}

              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.toastText,
                    toast.type === 'ready' && styles.readyToastText,
                  ]}
                  numberOfLines={2}
                >
                  {toast.message}
                </Text>
                {toast.type === 'ready' && (
                  <Text style={styles.readySubText}>Hot food ready at kitchen pass • Tap to view</Text>
                )}
              </View>
            </View>

            {toast.onPress && (
              <View style={styles.viewBadge}>
                <ArrowRight size={14} color="#FFFFFF" />
              </View>
            )}

            <TouchableOpacity
              onPress={hideToast}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.closeBtn}
            >
              <X size={16} color={toast.type === 'ready' ? '#FFFFFF' : colors.inverseOnSurface} opacity={0.8} />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 99999,
    alignItems: 'center',
  },
  toastCard: {
    backgroundColor: colors.inverseSurface,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 8,
  },
  readyToastCard: {
    backgroundColor: '#0F5132', // Deep emerald restaurant pass banner
    borderWidth: 1,
    borderColor: '#198754',
  },
  readyBellIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#198754',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
    marginRight: 8,
  },
  toastText: {
    ...typography.bodyMd,
    color: colors.inverseOnSurface,
    fontWeight: '600',
  },
  readyToastText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  readySubText: {
    ...typography.captionSm,
    color: '#D1E7DD',
    marginTop: 2,
    fontSize: 11,
  },
  viewBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  closeBtn: {
    padding: 4,
  },
});

