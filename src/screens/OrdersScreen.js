// src/screens/OrdersScreen.js - Versão atualizada com rastreamento
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
  RefreshControl,
  Animated,
  Modal,
  TextInput,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
// import { useNotifications } from '../hooks/useNotifications';

const { width } = Dimensions.get('window');

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
    description: 'Confirme o pagamento para prosseguir'
  },
  confirmed: {
    color: colors.accent,
    label: 'Confirmado',
    icon: 'checkmark-circle-outline',
    description: 'Pedido confirmado e em preparação'
  },
  preparing: {
    color: colors.secondary,
    label: 'Preparando',
    icon: 'restaurant-outline',
    description: 'Seu pedido está sendo preparado'
  },
  on_way: {
    color: colors.primary,
    label: 'A Caminho',
    icon: 'bicycle-outline',
    description: 'Pedido saiu para entrega'
  },
  delivered: {
    color: colors.success,
    label: 'Entregue',
    icon: 'checkmark-done-outline',
    description: 'Pedido entregue com sucesso'
  },
  cancelled: {
    color: colors.error,
    label: 'Cancelado',
    icon: 'close-circle-outline',
    description: 'Pedido foi cancelado'
  },
};

const paymentMethods = {
  mpesa: { name: 'M-Pesa', icon: 'phone-portrait-outline', color: colors.accent },
  emola: { name: 'eMola', icon: 'card-outline', color: colors.secondary },
  cash: { name: 'Dinheiro', icon: 'cash-outline', color: colors.success },
};

export default function OrdersScreen({ navigation }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  // const { showTest } = useNotifications();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    loadOrders();
    
    // Animação de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Auto-refresh a cada 30 segundos para pedidos ativos
    const interval = setInterval(() => {
      if (hasActiveOrders()) {
        loadOrders();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Verificar se há pedidos ativos que precisam de monitoramento
  function hasActiveOrders() {
    return orders.some(order => 
      ['confirmed', 'preparing', 'on_way'].includes(order.status)
    );
  }

  async function loadOrders() {
    try {
      const response = await api.getMyOrders();
      const ordersData = response.data?.data?.data || response.data?.data || [];
      setOrders(ordersData);
    } catch (error) {
      console.log('Erro ao carregar pedidos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os pedidos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  function handleOrderAction(order) {
    if (order.payment_status === 'pending') {
      // Abrir modal de pagamento
      setSelectedOrder(order);
      setPhoneNumber('');
      setPaymentMethod('');
      setShowPaymentModal(true);
    } else if (['preparing', 'on_way'].includes(order.status)) {
      // Navegar para rastreamento
      navigation.navigate('OrderTracking', { orderId: order.id });
    } else if (['confirmed'].includes(order.status)) {
      // Ver detalhes ou rastrear
      navigation.navigate('OrderDetails', { orderId: order.id });
    } else {
      // Ver detalhes para pedidos finalizados
      navigation.navigate('OrderDetails', { orderId: order.id });
    }
  }

  // Função específica para rastreamento
  function handleTrackOrder(order) {
    navigation.navigate('OrderTracking', { orderId: order.id });
  }

  async function processPayment() {
    if (!paymentMethod) {
      Alert.alert('Erro', 'Selecione um método de pagamento');
      return;
    }

    if (paymentMethod !== 'cash' && !phoneNumber.trim()) {
      Alert.alert('Erro', 'Digite o número de telefone');
      return;
    }

    setProcessingPayment(true);

    try {
      let response;
      
      if (paymentMethod === 'cash') {
        response = await api.confirmCashPayment(selectedOrder.id);
      } else if (paymentMethod === 'mpesa') {
        response = await api.initiateMpesaPayment(selectedOrder.id, {
          phone_number: phoneNumber
        });
      } else if (paymentMethod === 'emola') {
        response = await api.initiateMolaPayment(selectedOrder.id, {
          phone_number: phoneNumber
        });
      }

      if (response.data.status === 'success') {
        Alert.alert(
          'Sucesso!',
          response.data.message,
          [
            {
              text: 'OK',
              onPress: () => {
                setShowPaymentModal(false);
                loadOrders();
              }
            }
          ]
        );
      } else {
        Alert.alert('Erro', response.data.message);
      }
    } catch (error) {
      console.log('Erro no pagamento:', error);
      Alert.alert('Erro', 'Não foi possível processar o pagamento');
    } finally {
      setProcessingPayment(false);
    }
  }

  const filterOptions = [
    { id: 'all', name: 'Todos', count: orders.length },
    { id: 'pending', name: 'Pendentes', count: orders.filter(o => o.payment_status === 'pending').length },
    { id: 'active', name: 'Ativos', count: orders.filter(o => ['confirmed', 'preparing', 'on_way'].includes(o.status)).length },
    { id: 'completed', name: 'Concluídos', count: orders.filter(o => o.status === 'delivered').length },
  ];

  const filteredOrders = orders.filter(order => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'pending') return order.payment_status === 'pending';
    if (selectedFilter === 'active') return ['confirmed', 'preparing', 'on_way'].includes(order.status);
    if (selectedFilter === 'completed') return order.status === 'delivered';
    return true;
  });

  function renderFilterTab({ item }) {
    const isSelected = selectedFilter === item.id;
    
    return (
      <TouchableOpacity
        style={[styles.filterTab, isSelected && styles.filterTabSelected]}
        onPress={() => setSelectedFilter(item.id)}
        activeOpacity={0.7}
      >
        <Text style={[styles.filterTabText, isSelected && styles.filterTabTextSelected]}>
          {item.name}
        </Text>
        {item.count > 0 && (
          <View style={[styles.filterTabBadge, isSelected && styles.filterTabBadgeSelected]}>
            <Text style={[styles.filterTabBadgeText, isSelected && styles.filterTabBadgeTextSelected]}>
              {item.count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  function renderOrder({ item, index }) {
    const status = statusConfig[item.status] || statusConfig.pending;
    const paymentPending = item.payment_status === 'pending';
    const canTrack = ['confirmed', 'preparing', 'on_way'].includes(item.status);
    const isDelivered = item.status === 'delivered';
    
    return (
      <Animated.View
        style={[
          styles.orderCard,
          {
            opacity: fadeAnim,
            transform: [{
              translateY: slideAnim.interpolate({
                inputRange: [0, 50],
                outputRange: [0, 50 * (index + 1)],
                extrapolate: 'clamp'
              })
            }]
          }
        ]}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderIdSection}>
            <Text style={styles.orderId}>Pedido #{item.id}</Text>
            <Text style={styles.orderDate}>
              {new Date(item.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
            <Ionicons name={status.icon} size={14} color={colors.surface} />
            <Text style={styles.statusText}>{status.label}</Text>
          </View>
        </View>

        {/* Restaurant Info */}
        {item.restaurant && (
          <View style={styles.restaurantInfo}>
            <Ionicons name="storefront-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.restaurantName}>{item.restaurant.name}</Text>
          </View>
        )}

        {/* Order Items */}
        <View style={styles.orderItems}>
          {item.items?.slice(0, 2).map((orderItem, index) => (
            <View key={index} style={styles.orderItem}>
              <Text style={styles.itemQuantity}>{orderItem.quantity}x</Text>
              <Text style={styles.itemName} numberOfLines={1}>
                {orderItem.menu_item?.name || orderItem.name || 'Produto'}
              </Text>
            </View>
          ))}
          {item.items?.length > 2 && (
            <Text style={styles.moreItems}>
              +{item.items.length - 2} item{item.items.length - 2 > 1 ? 's' : ''}
            </Text>
          )}
        </View>

        {/* Payment Info */}
        <View style={styles.paymentInfo}>
          <View style={styles.paymentMethod}>
            {item.payment_method && paymentMethods[item.payment_method] && (
              <>
                <Ionicons 
                  name={paymentMethods[item.payment_method].icon} 
                  size={16} 
                  color={paymentMethods[item.payment_method].color} 
                />
                <Text style={styles.paymentMethodText}>
                  {paymentMethods[item.payment_method].name}
                </Text>
              </>
            )}
          </View>
          
          <Text style={styles.orderTotal}>
            {item.total_amount || '0.00'} MT
          </Text>
        </View>

        {/* Status Description */}
        <Text style={styles.statusDescription}>
          {status.description}
        </Text>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          {/* Botão principal */}
          <TouchableOpacity 
            style={[
              styles.actionButton,
              styles.primaryActionButton,
              paymentPending ? styles.paymentButton : 
              canTrack ? styles.trackButton : styles.detailsButton
            ]}
            onPress={() => handleOrderAction(item)}
          >
            <Ionicons 
              name={
                paymentPending ? "card-outline" :
                canTrack ? "eye-outline" : "receipt-outline"
              } 
              size={18} 
              color={colors.surface} 
            />
            <Text style={styles.actionButtonText}>
              {paymentPending ? 'Pagar Agora' :
               canTrack ? 'Ver Detalhes' : 'Ver Pedido'}
            </Text>
          </TouchableOpacity>

          {/* Botão de rastreamento (para pedidos ativos) */}
          {canTrack && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryActionButton]}
              onPress={() => handleTrackOrder(item)}
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.trackingButtonGradient}
              >
                <Ionicons name="location-outline" size={18} color={colors.surface} />
                <Text style={styles.trackingButtonText}>Rastrear</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Status Indicator para pedidos ativos */}
        {canTrack && (
          <View style={styles.quickStatusContainer}>
            <View style={styles.quickStatusDot} />
            <Text style={styles.quickStatusText}>
              {item.status === 'confirmed' ? 'Confirmado - clique em Rastrear' :
               item.status === 'preparing' ? 'Sendo preparado agora' :
               'Entregador a caminho!'}
            </Text>
          </View>
        )}
      </Animated.View>
    );
  }

  // Componente de teste (apenas em desenvolvimento)
  // const TestButton = () => (
  //   __DEV__ && (
  //     <TouchableOpacity 
  //       style={styles.testButton}
  //       onPress={showTest}
  //     >
  //       <Text style={styles.testButtonText}>🧪 Testar Notificação</Text>
  //     </TouchableOpacity>
  //   )
  // );

  if (!loading && orders.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        
        <View style={styles.header}>
          <Text style={styles.title}>Meus Pedidos</Text>
        </View>
        
        {/* <TestButton /> */}
        
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="receipt-outline" size={80} color={colors.textLight} />
          </View>
          <Text style={styles.emptyTitle}>Nenhum pedido ainda</Text>
          <Text style={styles.emptySubtitle}>
            Quando você fizer seu primeiro pedido, ele aparecerá aqui
          </Text>
          <TouchableOpacity 
            style={styles.startOrderButton}
            onPress={() => navigation.navigate('Home')}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.startOrderGradient}
            >
              <Text style={styles.startOrderButtonText}>Fazer Primeiro Pedido</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Meus Pedidos</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* <TestButton /> */}

      {/* Filter Tabs - CORRIGIDAS */}
      <View style={styles.filterTabsContainer}>
        <FlatList
          data={filterOptions}
          renderItem={renderFilterTab}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabs}
        />
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ordersList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyFilterContainer}>
            <Ionicons name="filter-outline" size={48} color={colors.textLight} />
            <Text style={styles.emptyFilterTitle}>
              Nenhum pedido {selectedFilter !== 'all' ? filterOptions.find(f => f.id === selectedFilter)?.name.toLowerCase() : ''}
            </Text>
          </View>
        }
      />

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowPaymentModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Escolher Pagamento</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          {selectedOrder && (
            <View style={styles.modalContent}>
              {/* Order Summary */}
              <View style={styles.orderSummary}>
                <Text style={styles.orderSummaryTitle}>Resumo do Pedido</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Pedido #{selectedOrder.id}</Text>
                  <Text style={styles.summaryValue}>{selectedOrder.total_amount} MT</Text>
                </View>
                {selectedOrder.restaurant && (
                  <Text style={styles.summaryRestaurant}>
                    {selectedOrder.restaurant.name}
                  </Text>
                )}
              </View>

              {/* Payment Methods */}
              <View style={styles.paymentSection}>
                <Text style={styles.paymentSectionTitle}>Método de Pagamento</Text>
                
                {Object.entries(paymentMethods).map(([key, method]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.paymentMethodCard,
                      paymentMethod === key && styles.paymentMethodCardSelected
                    ]}
                    onPress={() => setPaymentMethod(key)}
                  >
                    <View style={styles.paymentMethodInfo}>
                      <View style={[styles.paymentMethodIcon, { backgroundColor: method.color }]}>
                        <Ionicons name={method.icon} size={24} color={colors.surface} />
                      </View>
                      <Text style={styles.paymentMethodName}>{method.name}</Text>
                    </View>
                    
                    <View style={[
                      styles.radioButton,
                      paymentMethod === key && styles.radioButtonSelected
                    ]}>
                      {paymentMethod === key && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Phone Number Input */}
              {paymentMethod && paymentMethod !== 'cash' && (
                <View style={styles.phoneSection}>
                  <Text style={styles.phoneSectionTitle}>Número de Telefone</Text>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Ex: 84 123 4567"
                    placeholderTextColor={colors.textLight}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    maxLength={15}
                  />
                  <Text style={styles.phoneHint}>
                    Digite o número associado à sua conta {paymentMethods[paymentMethod]?.name}
                  </Text>
                </View>
              )}

              {/* Confirm Button */}
              <TouchableOpacity
                style={[
                  styles.confirmPaymentButton,
                  (!paymentMethod || processingPayment) && styles.confirmPaymentButtonDisabled
                ]}
                onPress={processPayment}
                disabled={!paymentMethod || processingPayment}
              >
                {processingPayment ? (
                  <Text style={styles.confirmPaymentButtonText}>Processando...</Text>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color={colors.surface} />
                    <Text style={styles.confirmPaymentButtonText}>
                      Confirmar Pagamento • {selectedOrder.total_amount} MT
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: colors.accent,
    margin: 10,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: colors.surface,
    fontWeight: '600',
  },
  filterTabsContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterTabs: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTabSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterTabTextSelected: {
    color: colors.surface,
  },
  filterTabBadge: {
    backgroundColor: colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
    minWidth: 20,
    alignItems: 'center',
  },
  filterTabBadgeSelected: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  filterTabBadgeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  filterTabBadgeTextSelected: {
    color: colors.surface,
  },
  ordersList: {
    padding: 24,
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderIdSection: {
    flex: 1,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: colors.surface,
    fontWeight: '700',
    marginLeft: 4,
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  restaurantName: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
    marginLeft: 6,
  },
  orderItems: {
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
    marginRight: 8,
    minWidth: 24,
  },
  itemName: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  moreItems: {
    fontSize: 12,
    color: colors.textLight,
    fontStyle: 'italic',
    marginTop: 4,
  },
  paymentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 6,
    fontWeight: '500',
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  statusDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  primaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  secondaryActionButton: {
    minWidth: 100,
  },
  paymentButton: {
    backgroundColor: colors.warning,
  },
  trackButton: {
    backgroundColor: colors.accent,
  },
  detailsButton: {
    backgroundColor: colors.textSecondary,
  },
  actionButtonText: {
    fontSize: 14,
    color: colors.surface,
    fontWeight: '600',
    marginLeft: 8,
  },
  trackingButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  trackingButtonText: {
    fontSize: 14,
    color: colors.surface,
    fontWeight: '600',
    marginLeft: 6,
  },
  quickStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  quickStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 8,
  },
  quickStatusText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  startOrderButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  startOrderGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  startOrderButtonText: {
    fontSize: 16,
    color: colors.surface,
    fontWeight: '700',
  },
  emptyFilterContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyFilterTitle: {
    fontSize: 18,
    color: colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalHeaderSpacer: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  orderSummary: {
    backgroundColor: colors.background,
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  orderSummaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  summaryRestaurant: {
    fontSize: 14,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  paymentSection: {
    marginBottom: 24,
  },
  paymentSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: 12,
  },
  paymentMethodCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  paymentMethodName: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: colors.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  phoneSection: {
    marginBottom: 32,
  },
  phoneSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  phoneInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  phoneHint: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 8,
    lineHeight: 20,
  },
  confirmPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 'auto',
  },
  confirmPaymentButtonDisabled: {
    backgroundColor: colors.textLight,
  },
  confirmPaymentButtonText: {
    fontSize: 18,
    color: colors.surface,
    fontWeight: '700',
    marginLeft: 8,
  },
});