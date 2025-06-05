import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Animated,
  Alert,
  Linking,
  RefreshControl,
  StatusBar,
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

// Seus status reais mapeados
const trackingSteps = [
  {
    key: 'pending',
    title: 'Aguardando Pagamento',
    description: 'Confirme o pagamento para prosseguir',
    icon: 'time-outline',
  },
  {
    key: 'confirmed',
    title: 'Pedido Confirmado',
    description: 'Restaurante confirmou seu pedido',
    icon: 'checkmark-circle-outline',
  },
  {
    key: 'preparing',
    title: 'Preparando',
    description: 'Seu pedido está sendo preparado',
    icon: 'restaurant-outline',
  },
  {
    key: 'ready',
    title: 'Pronto para Retirada',
    description: 'Entregador vai buscar seu pedido',
    icon: 'bag-check-outline',
  },
  {
    key: 'picked_up',
    title: 'A Caminho',
    description: 'Entregador saiu para entrega',
    icon: 'bicycle-outline',
  },
  {
    key: 'delivered',
    title: 'Entregue',
    description: 'Pedido entregue com sucesso',
    icon: 'checkmark-done-outline',
  },
];

export default function OrderTrackingScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState('45-60 min');
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadOrderDetails();
    
    // Animação de pulso
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    // Auto-refresh para pedidos ativos
    let interval;
    if (order && ['confirmed', 'preparing', 'ready', 'picked_up'].includes(order.status)) {
      interval = setInterval(loadOrderDetails, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
      pulseAnimation.stop();
    };
  }, [orderId]);

  useEffect(() => {
    if (order) {
      updateProgress();
    }
  }, [order, currentStep]);

  async function loadOrderDetails() {
    try {
      const response = await api.getOrderDetails(orderId);
      // Seus dados vêm em response.data.order
      const orderData = response.data?.order || response.data;
      
      // console.log('Dados reais do pedido:', orderData.data.order);
      setOrder(orderData.data.order );
      
      // Determinar step atual baseado no status
      const stepIndex = getStepIndex(orderData.status);
      setCurrentStep(stepIndex);
      
      // Atualizar tempo estimado
      updateEstimatedTime(orderData.status);
      
      console.log("order",order.status);
    } catch (error) {
      console.log('Erro ao carregar detalhes:', error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes do pedido');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function getStepIndex(status) {
    const statusMap = {
      'pending': 0,      // Aguardando Pagamento
      'confirmed': 1,    // Pedido Confirmado  
      'preparing': 2,    // Preparando
      'ready': 3,        // Pronto para Retirada
      'picked_up': 4,    // A Caminho
      'delivered': 5,    // Entregue
      'cancelled': -1,   // Cancelado
    };
    return statusMap[status] >= 0 ? statusMap[status] : 0;
  }

  function updateEstimatedTime(status) {
    const timeMap = {
      'pending': 'Aguardando pagamento',
      'confirmed': '45-60 min',
      'preparing': '30-45 min', 
      'ready': '15-25 min',
      'picked_up': '10-15 min',
      'delivered': 'Entregue',
      'cancelled': 'Cancelado',
    };
    setEstimatedTime(timeMap[status] || '45-60 min');
  }

  function updateProgress() {
    const progress = (currentStep + 1) / trackingSteps.length;
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }

  const onRefresh = () => {
    setRefreshing(true);
    loadOrderDetails();
  };

  function callRestaurant() {
    const phone = order?.restaurant?.phone || '+258843456789';
    Alert.alert(
      'Ligar para Restaurante',
      `Deseja ligar para ${order?.restaurant?.name || 'o restaurante'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ligar', onPress: () => Linking.openURL(`tel:${phone}`) }
      ]
    );
  }

  function callDelivery() {
    const phone = '+258840000001'; // Telefone padrão do entregador
    Alert.alert(
      'Ligar para Entregador',
      'Deseja ligar para o entregador?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ligar', onPress: () => Linking.openURL(`tel:${phone}`) }
      ]
    );
  }

  function openMap() {
    // Usar as coordenadas reais do seu pedido
    const latitude = order?.delivery_address?.latitude || -19.8377596;
    const longitude = order?.delivery_address?.longitude || 34.8401948;
    const url = `https://maps.google.com/?q=${latitude},${longitude}`;
    
    Alert.alert(
      'Abrir Mapa',
      'Ver localização da entrega no Google Maps?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Abrir', onPress: () => Linking.openURL(url) }
      ]
    );
  }

  function getActionButtons() {
    const buttons = [
      {
        title: 'Ligar para Restaurante',
        icon: 'call-outline',
        colors: [colors.accent, '#00A67E'],
        onPress: callRestaurant
      }
    ];

    // Botões específicos para "picked_up"
    if (order.status === 'picked_up') {
      buttons.push({
        title: 'Ligar para Entregador',
        icon: 'bicycle-outline',
        colors: [colors.secondary, '#E6A500'],
        onPress: callDelivery
      });

      buttons.push({
        title: 'Ver no Mapa',
        icon: 'map-outline',
        colors: [colors.primary, colors.primaryDark],
        onPress: openMap
      });
    }

    return buttons;
  }

  function getStatusColor(status) {
    const statusColors = {
      'pending': colors.warning,
      'confirmed': colors.accent,
      'preparing': colors.secondary,
      'ready': colors.primary,
      'picked_up': colors.primary,
      'delivered': colors.success,
      'cancelled': colors.error,
    };
    return statusColors[status] || colors.primary;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.View style={[styles.loadingIcon, { transform: [{ scale: pulseAnim }] }]}>
          <Ionicons name="bicycle-outline" size={60} color={colors.primary} />
        </Animated.View>
        <Text style={styles.loadingText}>Carregando rastreamento...</Text>
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
          <Text style={styles.headerTitle}>Rastreamento</Text>
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

  // Tela especial para cancelado
  if (order.status === 'cancelled') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pedido #{order.order_number}</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <View style={styles.cancelledContainer}>
          <View style={styles.cancelledCard}>
            <View style={[styles.cancelledIcon, { backgroundColor: colors.error }]}>
              <Ionicons name="close-circle" size={60} color={colors.surface} />
            </View>
            <Text style={styles.cancelledTitle}>Pedido Cancelado</Text>
            <Text style={styles.cancelledSubtitle}>
              Este pedido foi cancelado. Entre em contato conosco se precisar de ajuda.
            </Text>
            <TouchableOpacity style={styles.supportButton} onPress={callRestaurant}>
              <Text style={styles.supportButtonText}>Falar com Suporte</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const currentStepData = trackingSteps[currentStep];
  const statusColor = getStatusColor(order.status);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pedido #{order.order_number}</Text>
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
            colors={[statusColor, statusColor + 'DD']}
            style={styles.statusGradient}
          >
            <Animated.View style={[styles.statusIcon, { transform: [{ scale: pulseAnim }] }]}>
              <Ionicons 
                name={currentStepData?.icon || 'time-outline'} 
                size={40} 
                color={colors.surface} 
              />
            </Animated.View>
            <Text style={styles.statusTitle}>
              {currentStepData?.title || 'Processando'}
            </Text>
            <Text style={styles.statusDescription}>
              {currentStepData?.description || 'Aguardando atualização'}
            </Text>
            <View style={styles.timeContainer}>
              <Ionicons name="time-outline" size={16} color={colors.surface} />
              <Text style={styles.timeText}>Tempo: {estimatedTime}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Progress Tracker */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressTitle}>Acompanhe seu pedido</Text>
          
          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground} />
            <Animated.View 
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: statusColor,
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>

          {/* Steps */}
          {trackingSteps.map((step, index) => {
            const isCompleted = index <= currentStep;
            const isActive = index === currentStep;
            
            return (
              <View key={step.key} style={styles.stepContainer}>
                <View style={styles.stepLeft}>
                  <View style={[
                    styles.stepDot,
                    isCompleted && [styles.stepDotCompleted, { backgroundColor: statusColor, borderColor: statusColor }],
                    isActive && [styles.stepDotActive, { backgroundColor: statusColor, borderColor: statusColor }],
                  ]}>
                    {isCompleted ? (
                      <Ionicons 
                        name="checkmark" 
                        size={16} 
                        color={colors.surface} 
                      />
                    ) : (
                      <View style={styles.stepDotInner} />
                    )}
                  </View>
                  {index < trackingSteps.length - 1 && (
                    <View style={[
                      styles.stepLine,
                      isCompleted && [styles.stepLineCompleted, { backgroundColor: statusColor }],
                    ]} />
                  )}
                </View>
                
                <View style={styles.stepContent}>
                  <Text style={[
                    styles.stepTitle,
                    isCompleted && styles.stepTitleCompleted,
                    isActive && [styles.stepTitleActive, { color: statusColor }],
                  ]}>
                    {step.title}
                  </Text>
                  <Text style={[
                    styles.stepDescription,
                    isCompleted && styles.stepDescriptionCompleted,
                  ]}>
                    {step.description}
                  </Text>
                  {isActive && (
                    <Text style={[styles.stepTime, { color: statusColor }]}>
                      {new Date(order.updated_at).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Order Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Detalhes do Pedido</Text>
          
          {/* Status atual */}
          <View style={styles.detailRow}>
            <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Status Atual</Text>
              <Text style={[styles.detailValue, { color: statusColor }]}>
                {currentStepData?.title || order.status.toUpperCase()}
              </Text>
            </View>
          </View>
          
          {/* Restaurant Info */}
          <View style={styles.detailRow}>
            <Ionicons name="storefront-outline" size={20} color={colors.textSecondary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Restaurante</Text>
              <Text style={styles.detailValue}>
                {order.restaurant?.name || 'Restaurante'}
              </Text>
            </View>
          </View>

          {/* Address */}
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Endereço de entrega</Text>
              <Text style={styles.detailValue}>
                {order.delivery_address?.street || 'Endereço não informado'}
              </Text>
            </View>
          </View>

          {/* Payment */}
          <View style={styles.detailRow}>
            <Ionicons name="card-outline" size={20} color={colors.textSecondary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Pagamento</Text>
              <Text style={styles.detailValue}>
                {(order.payment_method || 'N/A').toUpperCase()} • {order.total_amount || '0.00'} MT
              </Text>
            </View>
          </View>

          {/* Items */}
          <View style={styles.detailRow}>
            <Ionicons name="receipt-outline" size={20} color={colors.textSecondary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Itens do Pedido</Text>
              {order.items && order.items.length > 0 ? (
                order.items.map((item, index) => (
                  <Text key={index} style={styles.detailValue}>
                    {item.quantity}x {item.menu_item?.name || item.name || 'Produto'}
                  </Text>
                ))
              ) : (
                <Text style={styles.detailValue}>Itens não disponíveis</Text>
              )}
            </View>
          </View>

          {/* Order Number */}
          <View style={styles.detailRow}>
            <Ionicons name="barcode-outline" size={20} color={colors.textSecondary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Número do Pedido</Text>
              <Text style={styles.detailValue}>
                {order.order_number}
              </Text>
            </View>
          </View>

          {/* Notes */}
          {order.notes && (
            <View style={styles.detailRow}>
              <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Observações</Text>
                <Text style={styles.detailValue}>
                  {order.notes}
                </Text>
              </View>
            </View>
          )}

          {/* Order Date */}
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Data do Pedido</Text>
              <Text style={styles.detailValue}>
                {new Date(order.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {getActionButtons().map((button, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.actionButton} 
              onPress={button.onPress}
            >
              <LinearGradient
                colors={button.colors}
                style={styles.actionGradient}
              >
                <Ionicons name={button.icon} size={24} color={colors.surface} />
                <Text style={styles.actionText}>{button.title}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Status Info */}
        <View style={styles.statusInfoCard}>
          <View style={styles.statusInfoHeader}>
            <Ionicons name="help-circle-outline" size={20} color={statusColor} />
            <Text style={[styles.statusInfoTitle, { color: statusColor }]}>
              Sobre este status
            </Text>
          </View>
          <Text style={styles.statusInfoText}>
            {getStatusExplanation(order.status)}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  function getStatusExplanation(status) {
    const explanations = {
      'pending': 'Seu pedido foi criado e está aguardando a confirmação do pagamento. Assim que o pagamento for processado, o restaurante será notificado.',
      'confirmed': 'O restaurante recebeu seu pedido e confirmou que pode prepará-lo. Eles começarão a trabalhar em breve.',
      'preparing': 'O restaurante está preparando seus itens com cuidado. Isso pode levar alguns minutos dependendo da complexidade do pedido.',
      'ready': 'Seu pedido está pronto e aguardando um entregador. Em breve alguém irá buscar para levar até você.',
      'picked_up': 'O entregador pegou seu pedido e está a caminho do seu endereço. Fique atento ao telefone!',
      'delivered': 'Seu pedido foi entregue com sucesso. Esperamos que tenha gostado!',
      'cancelled': 'Este pedido foi cancelado. Se você tem dúvidas, entre em contato conosco.',
    };
    return explanations[status] || 'Status do pedido atualizado.';
  }
}

// Estilos (manter os mesmos mas adicionar alguns novos)
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
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    marginBottom: 24,
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.surface,
    marginBottom: 8,
    textAlign: 'center',
  },
  statusDescription: {
    fontSize: 16,
    color: colors.surface,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 16,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timeText: {
    fontSize: 14,
    color: colors.surface,
    fontWeight: '600',
    marginLeft: 6,
  },
  progressContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.border,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  stepDotCompleted: {
    elevation: 2,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  stepDotActive: {
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  stepDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textLight,
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginTop: 8,
  },
  stepLineCompleted: {
    // backgroundColor será definido dinamicamente
  },
  stepContent: {
    flex: 1,
    paddingTop: 4,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  stepTitleCompleted: {
    color: colors.text,
  },
  stepTitleActive: {
    fontWeight: '700',
  },
  stepDescription: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
  stepDescriptionCompleted: {
    color: colors.textSecondary,
  },
  stepTime: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  detailsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
    marginTop: 2,
  },
  actionsContainer: {
    marginBottom: 20,
  },
  actionButton: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
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
  cancelledContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  cancelledCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cancelledIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  cancelledTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  cancelledSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  supportButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  supportButtonText: {
    fontSize: 16,
    color: colors.surface,
    fontWeight: '600',
  },
  statusInfoCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 90,
    elevation: 1,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statusInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  statusInfoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});