// App.js - Configuração principal do app
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { CartProvider } from './src/contexts/CartContext';
import AppNavigator from './src/navigation/AppNavigator';
import { useSimpleNotifications } from './src/hooks/useNotifications';


export default function App() {
  const { showTest } = useSimpleNotifications();
  return (
    <AuthProvider>
      <CartProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </CartProvider>
    </AuthProvider>
  );
}