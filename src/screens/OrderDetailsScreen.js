// src/screens/OrderDetailsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  RefreshControl,
  StatusBar,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as api from '../services/api';

const colors = {
  primary: '#FF6B35',
  primaryDark: '#FF4500',
  secondary: '#FFB800',
  accent: '#00C896',
  background: '#FAFBFC',
  surface: '#FFFFFF',
  text: '#1A1D23',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  shadowColor: '#000000',
};

const statusConfig = {
  pending: {
    color: colors.warning,
    label: 'Aguardando Pagamento',
    icon: 'time-outline',
  },
  confirmed: {
    color: colors.accent,
    label: 'Confirmado',
    icon: 'checkmark-circle-outline',
  },
  preparing: {
    color: colors.secondary,
    label: 'Preparando',
    icon: 'restaurant-outline',
  },
  on_way: {
    color: colors.primary,
    label: 'A Caminho',
    icon: 'bicycle-outline',
  },
  delivered: {
    color: colors.success,
    label: 'Entregue',
    icon: 'checkmark-done-outline',
  },
  cancelled: {
    color: colors.error,
    label: 'Cancelado',
    icon: 'close-circle-outline',
  },
};

const paymentMethods = {
  mpesa: { name: 'M-Pesa', icon: 'phone-portrait-outline', color: colors.accent },
  emola: { name: 'eMola', icon: 'card-outline', color: colors.secondary },
  cash: { name: 'Dinheiro', icon: 'cash-outline', color: colors.success },
};

export default function OrderDetailsScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  async function loadOrderDetails() {
    try {
      const response = await api.getOrderDetails(orderId);
      const orderData = response.data?.data || response.data;
      console.log('Detalhes do pedido carregados:', orderData);
      setOrder(orderData);
    } catch (error) {
      console.log('Erro ao carregar detalhes:', error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes do pedido');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    loadOrderDetails();
  };

  function handleTrackOrder() {
    navigation.navigate('OrderTracking', { orderId: order.id });
  }

  function handleReorder() {
    Alert.alert(
      'Fazer pedido novamente?',
      'Deseja adicionar os mesmos itens ao carrinho?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sim', 
          onPress: () => {
            // Aqui você pode implementar a lógica para adicionar ao carrinho
            Alert.alert('Sucesso', 'Itens adicionados ao carrinho!');
            navigation.navigate('MainTabs', { screen: 'Cart' });
          }
        }
      ]
    );
  }

  function handleContactSupport() {
    Alert.alert(
      'Contatar Suporte',
      'Como deseja entrar em contato?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'WhatsApp', onPress: () => Linking.openURL('https://wa.me/258840000000') },
        { text: 'Telefone', onPress: () => Linking.openURL('tel:+258840000000') },
      ]
    );
  }

  function callRestaurant() {
    if (order?.restaurant?.phone) {
      Linking.openURL(`tel:${order.restaurant.phone}`);
    } else {
      Alert.alert('Info', 'Número do restaurante não disponível');
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingIcon}>
          <Ionicons name="receipt-outline" size={60} color={colors.primary} />
        </View>
        <Text style={styles.loadingText}>Carregando detalhes...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalhes do Pedido</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={80} color={colors.error} />
          <Text style={styles.errorTitle}>Pedido não encontrado</Text>
          <Text style={styles.errorSubtitle}>Verifique o número do pedido e tente novamente</Text>
        </View>
      </SafeAreaView>
    );
  }

  const status = statusConfig[order.status] || statusConfig.pending;
  const paymentMethod = paymentMethods[order.payment_method];
  const canTrack = ['confirmed', 'preparing', 'on_way'].includes(order.status);
  const canReorder = ['delivered', 'cancelled'].includes(order.status);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pedido #{order.id}</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <LinearGradient
            colors={[status.color, status.color + 'DD']}
            style={styles.statusGradient}
          >
            <View style={styles.statusIcon}>
              <Ionicons name={status.icon} size={32} color={colors.surface} />
            </View>
            <Text style={styles.statusTitle}>{status.label}</Text>
            <Text style={styles.statusDate}>
              {new Date(order.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </LinearGradient>
        </View>

        {/* Restaurant Info */}
        {order.restaurant && (
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Restaurante</Text>
            <View style={styles.restaurantRow}>
              <View style={styles.restaurantInfo}>
                <Ionicons name="storefront" size={24} color={colors.primary} />
                <View style={styles.restaurantText}>
                  <Text style={styles.restaurantName}>{order.restaurant.name}</Text>
                  {order.restaurant.address && (
                    <Text style={styles.restaurantAddress}>{order.restaurant.address}</Text>
                  )}
                </View>
              </View>
              {order.restaurant.phone && (
                <TouchableOpacity style={styles.callButton} onPress={callRestaurant}>
                  <Ionicons name="call" size={20} color={colors.accent} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Order Items */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Itens do Pedido</Text>
          {order.items?.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemQuantity}>{item.quantity}x</Text>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>
                    {item.menu_item?.name || item.name || 'Produto'}
                  </Text>
                  {item.notes && (
                    <Text style={styles.itemNotes}>Obs: {item.notes}</Text>
                  )}
                </View>
              </View>
              <Text style={styles.itemPrice}>
                {(parseFloat(item.price || 0) * item.quantity).toFixed(2)} MT
              </Text>
            </View>
          ))}
          
          {/* Order Summary */}
          <View style={styles.orderSummary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                {(parseFloat(order.total_amount || 0) - parseFloat(order.delivery_fee || 0)).toFixed(2)} MT
              </Text>
            </View>
            {order.delivery_fee && parseFloat(order.delivery_fee) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Taxa de entrega</Text>
                <Text style={styles.summaryValue}>{order.delivery_fee} MT</Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.summaryTotalLabel}>Total</Text>
              <Text style={styles.summaryTotalValue}>{order.total_amount} MT</Text>
            </View>
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Pagamento</Text>
          <View style={styles.paymentRow}>
            {paymentMethod && (
              <View style={styles.paymentMethod}>
                <View style={[styles.paymentIcon, { backgroundColor: paymentMethod.color }]}>
                  <Ionicons name={paymentMethod.icon} size={20} color={colors.surface} />
                </View>
                <Text style={styles.paymentText}>{paymentMethod.name}</Text>
              </View>
            )}
            <View style={[
              styles.paymentStatus,
              { backgroundColor: order.payment_status === 'paid' ? colors.success : colors.warning }
            ]}>
              <Text style={styles.paymentStatusText}>
                {order.payment_status === 'paid' ? 'Pago' : 'Pendente'}
              </Text>
            </View>
          </View>
        </View>

        {/* Delivery Info */}
        {order.delivery_address && (
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Entrega</Text>
            <View style={styles.deliveryRow}>
              <Ionicons name="location" size={20} color={colors.primary} />
              <Text style={styles.deliveryAddress}>{order.delivery_address}</Text>
            </View>
            {order.delivery_notes && (
              <View style={styles.deliveryRow}>
                <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.deliveryNotes}>{order.delivery_notes}</Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* Track Order Button */}
          {canTrack && (
            <TouchableOpacity style={styles.primaryActionButton} onPress={handleTrackOrder}>
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.actionGradient}
              >
                <Ionicons name="location" size={24} color={colors.surface} />
                <Text style={styles.actionText}>Rastrear Pedido</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Secondary Actions */}
          <View style={styles.secondaryActions}>
            {/* Reorder Button */}
            {canReorder && (
              <TouchableOpacity style={styles.secondaryActionButton} onPress={handleReorder}>
                <View style={styles.secondaryActionContent}>
                  <Ionicons name="refresh-circle-outline" size={24} color={colors.accent} />
                  <Text style={styles.secondaryActionText}>Pedir Novamente</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Support Button */}
            <TouchableOpacity style={styles.secondaryActionButton} onPress={handleContactSupport}>
              <View style={styles.secondaryActionContent}>
                <Ionicons name="help-circle-outline" size={24} color={colors.secondary} />
                <Text style={styles.secondaryActionText}>Suporte</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingIcon: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statusGradient: {
    padding: 24,
    alignItems: 'center',
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.surface,
    marginBottom: 8,
  },
  statusDate: {
    fontSize: 14,
    color: colors.surface,
    opacity: 0.9,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  restaurantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  restaurantText: {
    marginLeft: 12,
    flex: 1,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  restaurantAddress: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemQuantity: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 12,
    minWidth: 24,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  itemNotes: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  orderSummary: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  summaryTotal: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
  },
  paymentStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  paymentStatusText: {
    fontSize: 12,
    color: colors.surface,
    fontWeight: '700',
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  deliveryAddress: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
    flex: 1,
    lineHeight: 22,
  },
  deliveryNotes: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 12,
    flex: 1,
    fontStyle: 'italic',
  },
  actionsContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  primaryActionButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  actionText: {
    fontSize: 16,
    color: colors.surface,
    fontWeight: '600',
    marginLeft: 12,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  secondaryActionButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 1,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryActionContent: {
    alignItems: 'center',
  },
  secondaryActionText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});