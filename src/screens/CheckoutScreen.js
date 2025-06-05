// src/screens/CheckoutScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  StatusBar,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
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

const paymentMethods = [
  {
    id: 'mpesa',
    name: 'M-Pesa',
    description: 'Vodacom M-Pesa',
    icon: 'phone-portrait-outline',
    color: colors.accent,
    requiresPhone: true
  },
  {
    id: 'emola',
    name: 'eMola',
    description: 'BCI/Millennium eMola',
    icon: 'card-outline',
    color: colors.secondary,
    requiresPhone: true
  },
  {
    id: 'cash',
    name: 'Dinheiro',
    description: 'Pagamento na entrega',
    icon: 'cash-outline',
    color: colors.success,
    requiresPhone: false
  }
];

export default function CheckoutScreen({ route, navigation }) {
  const { cartItems, totalPrice, restaurantId } = route.params;
  const { user } = useAuth();
  const { clearCart } = useCart();
  
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const deliveryFee = 25; // Taxa fixa de entrega
  const taxRate = 0.17; // 17% IVA
  const subtotal = parseFloat(totalPrice);
  const taxAmount = subtotal * taxRate;
  const finalTotal = subtotal + deliveryFee + taxAmount;

  useEffect(() => {
    // Pré-preencher endereço do usuário se disponível
    if (user?.address) {
      setDeliveryAddress(user.address);
    }
  }, [user]);

  const validateForm = () => {
    if (!selectedPaymentMethod) {
      Alert.alert('Erro', 'Selecione um método de pagamento');
      return false;
    }

    if (!deliveryAddress.trim()) {
      Alert.alert('Erro', 'Digite o endereço de entrega');
      return false;
    }

    const paymentMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);
    if (paymentMethod?.requiresPhone && !phoneNumber.trim()) {
      Alert.alert('Erro', 'Digite o número de telefone para o pagamento');
      return false;
    }

    return true;
  };

  const createOrder = async () => {
    try {
      const orderData = {
        restaurant_id: restaurantId,
        items: cartItems.map(item => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          special_instructions: item.notes || ''
        })),
        delivery_address: {
          street: deliveryAddress,
          city: user?.address ? user.address.split(',').pop().trim() : "Maputo",
          latitude: parseFloat(user?.latitude || -25.9662),
          longitude: parseFloat(user?.longitude || 32.5779),
        },
        payment_method: selectedPaymentMethod,
        notes: deliveryNotes,
      };

      console.log('Criando pedido:', orderData);
      const response = await api.createOrder(orderData);
      return response.data.data.order;
    } catch (error) {
      console.log('Erro ao criar pedido:', error.response?.data);
      throw error;
    }
  };

  const processPayment = async (order) => {
    try {
      let paymentResponse;

      switch (selectedPaymentMethod) {
        case 'mpesa':
          paymentResponse = await api.initiateMpesaPayment(order.id, {
            phone_number: phoneNumber
          });
          break;
          
        case 'emola':
          paymentResponse = await api.initiateMolaPayment(order.id, {
            phone_number: phoneNumber
          });
          break;
          
        case 'cash':
          paymentResponse = await api.confirmCashPayment(order.id);
          break;
          
        default:
          throw new Error('Método de pagamento inválido');
      }

      return paymentResponse.data;
    } catch (error) {
      console.log('Erro no pagamento:', error.response?.data);
      throw error;
    }
  };

  const handleCheckout = async () => {
    if (!validateForm()) return;

    setProcessing(true);

    try {
      // 1. Criar pedido
      const order = await createOrder();
      
      // 2. Processar pagamento
      const paymentResult = await processPayment(order);
      
      // 3. Limpar carrinho
      clearCart();
      
      // 4. Mostrar sucesso e navegar
      Alert.alert(
        'Pedido realizado! 🎉',
        paymentResult.message || 'Seu pedido foi criado com sucesso',
        [
          {
            text: 'Continuar comprando',
            style: 'cancel',
            onPress: () => {
              if (clearCart) clearCart();
              navigation.navigate('MainTabs', { screen: 'Home' });
            }
          },
          {
            text: 'Acompanhar pedido',
            onPress: () => {
              if (clearCart) clearCart();
              navigation.navigate('MainTabs', { screen: 'Orders' });
            }
          }
        ]
      );

    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Não foi possível realizar o pedido';
      Alert.alert('Erro', errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const renderPaymentMethod = (method) => {
    const isSelected = selectedPaymentMethod === method.id;
    
    return (
      <TouchableOpacity
        key={method.id}
        style={[
          styles.paymentMethodCard,
          isSelected && styles.paymentMethodCardSelected
        ]}
        onPress={() => setSelectedPaymentMethod(method.id)}
      >
        <View style={styles.paymentMethodInfo}>
          <View style={[styles.paymentMethodIcon, { backgroundColor: method.color }]}>
            <Ionicons name={method.icon} size={24} color={colors.surface} />
          </View>
          <View style={styles.paymentMethodText}>
            <Text style={styles.paymentMethodName}>{method.name}</Text>
            <Text style={styles.paymentMethodDescription}>{method.description}</Text>
          </View>
        </View>
        
        <View style={[
          styles.radioButton,
          isSelected && styles.radioButtonSelected
        ]}>
          {isSelected && (
            <View style={styles.radioButtonInner} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finalizar Pedido</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo do Pedido</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''})</Text>
              <Text style={styles.summaryValue}>{subtotal.toFixed(2)} MT</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Taxa de entrega</Text>
              <Text style={styles.summaryValue}>{deliveryFee.toFixed(2)} MT</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>IVA (17%)</Text>
              <Text style={styles.summaryValue}>{taxAmount.toFixed(2)} MT</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryRowTotal]}>
              <Text style={styles.summaryLabelTotal}>Total</Text>
              <Text style={styles.summaryValueTotal}>{finalTotal.toFixed(2)} MT</Text>
            </View>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Endereço de Entrega</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.textInput}
              placeholder="Digite seu endereço completo"
              placeholderTextColor={colors.textLight}
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              multiline
            />
          </View>
        </View>

        {/* Delivery Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Observações (Opcional)</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.textInput}
              placeholder="Ex: Tocar campainha, apartamento 201..."
              placeholderTextColor={colors.textLight}
              value={deliveryNotes}
              onChangeText={setDeliveryNotes}
              multiline
            />
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Método de Pagamento</Text>
          <View style={styles.paymentMethods}>
            {paymentMethods.map(renderPaymentMethod)}
          </View>
        </View>

        {/* Phone Number (if required) */}
        {selectedPaymentMethod && paymentMethods.find(m => m.id === selectedPaymentMethod)?.requiresPhone && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Número de Telefone</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.textInput}
                placeholder="Ex: 84 123 4567"
                placeholderTextColor={colors.textLight}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View>
            <Text style={styles.inputHint}>
              Digite o número associado à sua conta {paymentMethods.find(m => m.id === selectedPaymentMethod)?.name}
            </Text>
          </View>
        )}

        {/* Terms */}
        <View style={styles.termsSection}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.termsText}>
            Ao finalizar o pedido, você concorda com nossos Termos de Serviço e Política de Privacidade
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <View>
            <Text style={styles.totalLabel}>Total a pagar</Text>
            <Text style={styles.totalSubtext}>Incluindo taxas e impostos</Text>
          </View>
          <Text style={styles.totalPrice}>{finalTotal.toFixed(2)} MT</Text>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.checkoutButton,
            (!selectedPaymentMethod || processing) && styles.checkoutButtonDisabled
          ]}
          onPress={handleCheckout}
          disabled={!selectedPaymentMethod || processing}
        >
          <LinearGradient
            colors={
              (!selectedPaymentMethod || processing) 
                ? [colors.textLight, colors.textLight]
                : [colors.primary, colors.primaryDark]
            }
            style={styles.checkoutButtonGradient}
          >
            {processing ? (
              <>
                <Ionicons name="sync" size={20} color={colors.surface} />
                <Text style={styles.checkoutButtonText}>Processando...</Text>
              </>
            ) : (
              <>
                <Ionicons name="card" size={20} color={colors.surface} />
                <Text style={styles.checkoutButtonText}>Finalizar Pedido</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    elevation: 2,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 20,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryRowTotal: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: 0,
  },
  summaryLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  summaryLabelTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  summaryValueTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
    minHeight: 20,
  },
  inputHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    marginLeft: 4,
  },
  paymentMethods: {
    gap: 12,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
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
  paymentMethodText: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  paymentMethodDescription: {
    fontSize: 14,
    color: colors.textSecondary,
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
  termsSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    margin: 20,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  termsText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    backgroundColor: colors.surface,
    padding: 20,
    paddingTop: 16,
    elevation: 8,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  totalSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  checkoutButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  checkoutButtonDisabled: {
    opacity: 0.6,
  },
  checkoutButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  checkoutButtonText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
});