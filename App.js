// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { CartProvider } from './src/contexts/CartContext';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import RestaurantScreen from './src/screens/RestaurantScreen';
import CartScreen from './src/screens/CartScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import SearchScreen from './src/screens/SearchScreen';
import OrderTrackingScreen from './src/screens/OrderTrackingScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const AuthStack = createStackNavigator();

const colors = {
  primary: '#FE3801',
  primaryLight: '#F94234',
  secondary: '#FE8800',
  secondaryLight: '#FEA033',
  text: '#0B0C17',
  textLight: '#32354E',
  gray: '#A4A5B0',
  grayLight: '#EDEDEF',
  white: '#FFFFFF',
};

function AuthStackNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function HomeStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Restaurant" 
        component={RestaurantScreen}
        options={{
          headerStyle: { backgroundColor: colors.white },
          headerTintColor: colors.text,
          headerTitle: '',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="Search" 
        component={SearchScreen}
        options={{
          headerStyle: { backgroundColor: colors.white },
          headerTintColor: colors.text,
          headerTitle: 'Buscar',
        }}
      />
    </Stack.Navigator>
  );
}

function OrdersStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="OrdersMain" 
        component={OrdersScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="OrderTracking" 
        component={OrderTrackingScreen}
        options={{
          headerStyle: { backgroundColor: colors.white },
          headerTintColor: colors.text,
          headerTitle: 'Rastrear Pedido',
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
}

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Cart') {
            iconName = focused ? 'bag' : 'bag-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.grayLight,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      }      )}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Orders" component={OrdersStackNavigator} />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return null; // ou loading screen
  }

  return (
    <NavigationContainer>
      {user ? <MainTabNavigator /> : <AuthStackNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </CartProvider>
    </AuthProvider>
  );
}