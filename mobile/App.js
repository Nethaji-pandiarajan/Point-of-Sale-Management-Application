import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/context/AuthContext';
import { OrderProvider } from './src/context/OrderContext';
import { ToastProvider } from './src/context/ToastContext';
import { KitchenAlertProvider } from './src/context/KitchenAlertContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor="#FCF9F8" />
      <AuthProvider>
        <ToastProvider>
          <OrderProvider>
            <KitchenAlertProvider>
              <RootNavigator />
            </KitchenAlertProvider>
          </OrderProvider>
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
