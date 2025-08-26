// src/screens/CheckoutScreen.js - LOCALIZAÇÃO REAL DO DISPOSITIVO
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
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { orders } from '../services/api';
import * as Location from 'expo-location';
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

export default function CheckoutScreen({ route, navigation }) {
  const { cartItems, totalPrice, restaurant } = route.params;
  const { user } = useAuth();
  const { clearCart } = useCart();
useEffect(() => {
    console.log('🔍 route.params:', route.params);
    if (!restaurant || !restaurant.id) {
      Alert.alert(
        'Erro',
        'Restaurante não especificado. Volte para o carrinho.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      Alert.alert(
        'Erro',
        'Carrinho vazio ou inválido. Volte para o carrinho.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
    if (!cartItems.every(item => item && typeof item.id !== 'undefined')) {
      Alert.alert(
        'Erro',
        'Itens do carrinho inválidos. Volte para o carrinho.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [restaurant, cartItems, navigation]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  
  // Estados para localização REAL
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [realAddress, setRealAddress] = useState('');
  
  // Estados para cálculos
  const [deliveryFee, setDeliveryFee] = useState(parseFloat(restaurant?.delivery_fee || 25));
  const [taxAmount, setTaxAmount] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);

  const paymentMethods = [
    {
      id: 'mpesa',
      name: 'M-Pesa',
      description: 'Vodacom M-Pesa',
      icon: 'phone-portrait-outline',
      color: colors.accent,
      requiresPhone: true,
      available: true
    },
    {
      id: 'mola',
      name: 'Mola',
      description: 'BCI/Millennium Mola',
      icon: 'card-outline', 
      color: colors.secondary,
      requiresPhone: true,
      available: true
    },
    {
      id: 'cash',
      name: 'Dinheiro',
      description: 'Pagamento na entrega',
      icon: 'cash-outline',
      color: colors.success,
      requiresPhone: false,
      available: true
    }
  ];

  useEffect(() => {
    calculateTotals();
    checkLocationPermission();
  }, []);

  useEffect(() => {
    calculateTotals();
  }, [cartItems, deliveryFee]);

  // ✅ VERIFICAR PERMISSÃO DE LOCALIZAÇÃO
  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status === 'granted') {
        await getCurrentLocationReal();
      }
    } catch (error) {
      console.log('Erro ao verificar permissão:', error);
    }
  };

  // ✅ OBTER LOCALIZAÇÃO REAL DO DISPOSITIVO
  const getCurrentLocationReal = async () => {
    try {
      setLoadingLocation(true);
      console.log('🌍 Obtendo localização real do dispositivo...');
      
      // Verificar se já tem permissão
      let { status } = await Location.getForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('📍 Solicitando permissão de localização...');
        const permissionResult = await Location.requestForegroundPermissionsAsync();
        if (permissionResult.status !== 'granted') {
          Alert.alert(
            'Permissão de Localização',
            'Para melhor experiência, permita o acesso à localização para obter seu endereço automaticamente.',
            [
              { text: 'Agora não', style: 'cancel' },
              { text: 'Permitir', onPress: () => getCurrentLocationReal() }
            ]
          );
          return;
        }
      }

      // Obter posição atual com alta precisão
      console.log('🎯 Obtendo coordenadas GPS...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
        distanceInterval: 1,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setCurrentLocation(coords);
      console.log('📍 Coordenadas obtidas:', coords);

      // Fazer reverse geocoding para obter endereço REAL
      console.log('🏠 Obtendo endereço real...');
      const addressResults = await Location.reverseGeocodeAsync(coords, {
        useGoogleMaps: false, // Usar o serviço nativo primeiro
      });

      if (addressResults && addressResults.length > 0) {
        const address = addressResults[0];
        console.log('📮 Dados do endereço:', address);
        
        // Construir endereço completo REAL
        const addressParts = [];
        
        // Rua e número
        if (address.street) addressParts.push(address.street);
        if (address.streetNumber) addressParts.push(address.streetNumber);
        
        // Bairro/Distrito
        if (address.district) addressParts.push(address.district);
        if (address.subregion) addressParts.push(address.subregion);
        
        // Cidade
        if (address.city) addressParts.push(address.city);
        
        // Província/Estado
        if (address.region) addressParts.push(address.region);
        
        // País
        if (address.country) addressParts.push(address.country);
        
        const fullRealAddress = addressParts.join(', ');
        
        if (fullRealAddress && fullRealAddress !== ', , , ') {
          setRealAddress(fullRealAddress);
          setDeliveryAddress(fullRealAddress);
          console.log('✅ Endereço real obtido:', fullRealAddress);
        } else {
          // Fallback para coordenadas
          const fallbackAddress = `Lat: ${coords.latitude.toFixed(6)}, Lng: ${coords.longitude.toFixed(6)}`;
          setRealAddress(fallbackAddress);
          setDeliveryAddress(fallbackAddress);
          console.log('⚠️ Usando coordenadas como endereço:', fallbackAddress);
        }
      } else {
        console.log('⚠️ Nenhum endereço encontrado, usando coordenadas');
        const coordsAddress = `Lat: ${coords.latitude.toFixed(6)}, Lng: ${coords.longitude.toFixed(6)}`;
        setRealAddress(coordsAddress);
        setDeliveryAddress(coordsAddress);
      }

    } catch (error) {
      console.log('❌ Erro ao obter localização:', error);
      
      // Mostrar erro específico
      let errorMessage = 'Não foi possível obter sua localização';
      if (error.code === 'E_LOCATION_SETTINGS_UNSATISFIED') {
        errorMessage = 'Ative o GPS nas configurações do dispositivo';
      } else if (error.code === 'E_LOCATION_UNAVAILABLE') {
        errorMessage = 'Localização indisponível. Verifique sua conexão';
      }
      
      Alert.alert('Erro de Localização', errorMessage);
    } finally {
      setLoadingLocation(false);
    }
  };

  // ✅ BOTÃO PARA FORÇAR OBTER LOCALIZAÇÃO
  const forceGetLocation = async () => {
    if (!locationPermission) {
      Alert.alert(
        'Permissão Necessária',
        'Conceda permissão de localização para obter seu endereço automaticamente',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Permitir', onPress: getCurrentLocationReal }
        ]
      );
    } else {
      await getCurrentLocationReal();
    }
  };

  const calculateTotals = () => {
    const calculatedSubtotal = cartItems.reduce((total, item) => {
      const itemPrice = parseFloat(item.price || 0);
      const quantity = parseInt(item.quantity || 1);
      return total + (itemPrice * quantity);
    }, 0);

    const calculatedTax = calculatedSubtotal * 0.17; // IVA 17%
    const calculatedTotal = calculatedSubtotal + deliveryFee + calculatedTax;

    setSubtotal(calculatedSubtotal);
    setTaxAmount(calculatedTax);
    setFinalTotal(calculatedTotal);
  };

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
      Alert.alert('Erro', `Digite o número de telefone para ${paymentMethod.name}`);
      return false;
    }

    return true;
  };

 const createOrder = async () => {
    try {
      console.log('🔄 Iniciando criação do pedido...');
      
      // Verificar se a função api.createOrder existe
      if (!api || typeof api.createOrder !== 'function') {
        console.error('❌ api.createOrder não está disponível');
        throw new Error('Serviço de API não está disponível. Verifique a conexão.');
      }

      const orderData = {
        restaurant_id: restaurant.id,
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

      console.log('📝 Dados do pedido:', orderData);
      
      const response = await api.createOrder(orderData);
      console.log('✅ Pedido criado:', response.data);
      
      return response.data.data?.order || response.data;
    } catch (error) {
      console.log('❌ Erro ao criar pedido:', [error.message]);
      console.log('🔍 Detalhes do erro:', {
        message: error.message,
        response: error.response?.data,
        stack: error.stack
      });
      
      // Tratamento de erro mais específico
      if (error.response?.status === 401) {
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      } else if (error.response?.status === 422) {
        const errorMessages = error.response.data?.errors;
        const firstError = Object.values(errorMessages || {})[0]?.[0];
        throw new Error(firstError || 'Dados do pedido inválidos');
      } else if (error.response?.status >= 500) {
        throw new Error('Erro do servidor. Tente novamente em alguns minutos.');
      }
      
      throw error;
    }
  };

const prepareOrderData = () => {
  return {
    restaurant_id: restaurant.id,
    items: cartItems.map(item => {
      const menuItemId = parseInt(item.id, 10);
      if (isNaN(menuItemId)) {
        throw new Error(`ID de item inválido: ${item.id}`);
      }
      return {
        menu_item_id: menuItemId,
        quantity: parseInt(item.quantity),
        customizations: item.customizations || [],
        special_instructions: item.notes || ''
      };
    }),
    delivery_address: {
      street: deliveryAddress,
      city: currentLocation ? 'Localização Atual' : 'Cidade',
      latitude: currentLocation?.latitude || -19.80515060,
      longitude: currentLocation?.longitude || 34.86603780,
    },
    payment_method: selectedPaymentMethod,
    notes: deliveryNotes,
  };
};

  const handleCheckout = async () => {
    if (!validateForm()) return;

    setProcessing(true);

    try {
      const order = await createOrder();
      clearCart();
      
      Alert.alert(
        'Pedido realizado! 🎉',
        `Seu pedido #${order.order_number || order.id} foi criado com sucesso!`,
        [
          {
            text: 'Ver pedido',
            onPress: () => navigation.navigate('OrderTracking', { orderId: order.id })
          },
          {
            text: 'Continuar comprando',
            style: 'cancel',
            onPress: () => navigation.navigate('Home')
          }
        ]
      );

    } catch (error) {
      Alert.alert('Erro no pedido', error.message);
    } finally {
      setProcessing(false);
    }
  };

  const renderPaymentMethod = (method) => {
    if (!method.available) return null;
    
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
          {isSelected && <View style={styles.radioButtonInner} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
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
        {/* Restaurante */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restaurante</Text>
          <View style={styles.restaurantCard}>
            <Ionicons name="restaurant" size={20} color={colors.primary} />
            <View style={styles.restaurantInfo}>
              <Text style={styles.restaurantName}>{restaurant?.name}</Text>
              <Text style={styles.restaurantAddress}>{restaurant?.address}</Text>
              <Text style={styles.deliveryTime}>
                🕒 {restaurant?.delivery_time_min}-{restaurant?.delivery_time_max} min • 
                💰 Taxa: {deliveryFee.toFixed(2)} MT
              </Text>
            </View>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo do Pedido</Text>
          <View style={styles.summaryCard}>
            {cartItems.map((item, index) => (
              <View key={index} style={styles.orderItem}>
                <Text style={styles.orderItemName}>
                  {item.quantity}x {item.name}
                </Text>
                <Text style={styles.orderItemPrice}>
                  {(parseFloat(item.price) * parseInt(item.quantity)).toFixed(2)} MT
                </Text>
              </View>
            ))}
            
            <View style={styles.divider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
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

        {/* Endereço de Entrega - COM LOCALIZAÇÃO REAL */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Endereço de Entrega</Text>
            <TouchableOpacity 
              onPress={forceGetLocation}
              style={styles.locationButton}
              disabled={loadingLocation}
            >
              {loadingLocation ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="location" size={16} color={colors.primary} />
              )}
              <Text style={styles.locationButtonText}>
                {loadingLocation ? 'Obtendo...' : 'Usar localização atual'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Mostrar status da localização */}
          {currentLocation && (
            <View style={styles.locationStatus}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.locationStatusText}>
                Localização obtida: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </Text>
            </View>
          )}
          
          <View style={styles.inputContainer}>
            <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.textInput}
              placeholder="Digite seu endereço ou use a localização atual"
              placeholderTextColor={colors.textLight}
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              multiline
            />
          </View>
          
          {realAddress && realAddress !== deliveryAddress && (
            <TouchableOpacity 
              style={styles.addressSuggestion}
              onPress={() => setDeliveryAddress(realAddress)}
            >
              <Ionicons name="location" size={14} color={colors.primary} />
              <Text style={styles.addressSuggestionText}>
                Usar endereço detectado: {realAddress}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Observações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Observações (Opcional)</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.textInput}
              placeholder="Ex: Tocar campainha, portão azul, apartamento 201..."
              placeholderTextColor={colors.textLight}
              value={deliveryNotes}
              onChangeText={setDeliveryNotes}
              multiline
            />
          </View>
        </View>

        {/* Métodos de Pagamento */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Método de Pagamento</Text>
          <View style={styles.paymentMethods}>
            {paymentMethods.map(renderPaymentMethod)}
          </View>
        </View>

        {/* Número de Telefone */}
        {selectedPaymentMethod && paymentMethods.find(m => m.id === selectedPaymentMethod)?.requiresPhone && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Número para {paymentMethods.find(m => m.id === selectedPaymentMethod)?.name}
            </Text>
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
                <ActivityIndicator size="small" color={colors.surface} />
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
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: `${colors.primary}10`,
  },
  locationButtonText: {
    fontSize: 14,
    color: colors.primary,
    marginLeft: 4,
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: `${colors.success}10`,
    borderRadius: 8,
  },
  locationStatusText: {
    fontSize: 12,
    color: colors.success,
    marginLeft: 6,
    flex: 1,
  },
  addressSuggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: `${colors.primary}10`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  addressSuggestionText: {
    fontSize: 14,
    color: colors.primary,
    marginLeft: 6,
    flex: 1,
  },
  restaurantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  restaurantInfo: {
    flex: 1,
    marginLeft: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  restaurantAddress: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  deliveryTime: {
    fontSize: 12,
    color: colors.success,
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  orderItemName: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  summaryRowTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginTop: 6,
  },
  summaryLabelTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  summaryValueTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    fontStyle: 'italic',
  },
  paymentMethods: {
    gap: 12,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  paymentMethodCardSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
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
  },
  paymentMethodText: {
    marginLeft: 12,
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  paymentMethodDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
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
  footer: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  totalSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
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
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.surface,
    marginLeft: 8,
  },
});