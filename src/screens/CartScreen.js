// src/screens/CartScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCart } from '../contexts/CartContext';
import { API_BASE_STORAGE } from '../config/config';

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

export default function CartScreen({ navigation }) {
  const { items, updateQuantity, removeItem, totalPrice, clearCart, totalItems } = useCart();
  const [animatedValues] = useState(() => 
    items.reduce((acc, item) => {
      acc[item.id] = new Animated.Value(1);
      return acc;
    }, {})
  );

  const handleRemoveItem = (itemId) => {
    Alert.alert(
      'Remover item',
      'Deseja remover este item do carrinho?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Remover', 
          style: 'destructive',
          onPress: () => {
            // Animação de saída
            if (animatedValues[itemId]) {
              Animated.timing(animatedValues[itemId], {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }).start(() => {
                removeItem(itemId);
              });
            } else {
              removeItem(itemId);
            }
          }
        }
      ]
    );
  };

  const handleClearCart = () => {
    Alert.alert(
      'Limpar carrinho',
      'Deseja remover todos os itens do carrinho?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Limpar', 
          style: 'destructive',
          onPress: clearCart
        }
      ]
    );
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      Alert.alert('Carrinho vazio', 'Adicione itens ao carrinho para continuar');
      return;
    }

    // Verificar se todos os itens são do mesmo restaurante
    const restaurantIds = [...new Set(items.map(item => item.restaurant_id))];
    if (restaurantIds.length > 1) {
      Alert.alert(
        'Múltiplos restaurantes',
        'Você só pode fazer pedidos de um restaurante por vez. Deseja limpar o carrinho?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Limpar carrinho', onPress: clearCart }
        ]
      );
      return;
    }

    // Navegar para tela de checkout
    navigation.navigate('Checkout', {
      cartItems: items,
      totalPrice: totalPrice,
      restaurantId: restaurantIds[0]
    });
  };

  const calculateItemTotal = (item) => {
    return (item.price * item.quantity).toFixed(2);
  };

  const getRestaurantInfo = () => {
    if (items.length === 0) return null;
    
    const firstItem = items[0];
    return {
      id: firstItem.restaurant_id,
      name: firstItem.restaurant_name || 'Restaurante'
    };
  };

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Carrinho</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="bag-outline" size={80} color={colors.textLight} />
          </View>
          <Text style={styles.emptyTitle}>Seu carrinho está vazio</Text>
          <Text style={styles.emptySubtitle}>
            Adicione deliciosos pratos dos restaurantes para começar
          </Text>
          <TouchableOpacity 
            style={styles.exploreButton}
            onPress={() => navigation.navigate('Home')}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.exploreButtonGradient}
            >
              <Ionicons name="restaurant" size={20} color={colors.surface} />
              <Text style={styles.exploreButtonText}>Explorar Restaurantes</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const restaurantInfo = getRestaurantInfo();

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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Carrinho</Text>
          <Text style={styles.headerSubtitle}>{totalItems} item{totalItems !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity 
          style={styles.clearButton}
          onPress={handleClearCart}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      {/* Restaurant Info */}
      {restaurantInfo && (
        <View style={styles.restaurantInfo}>
          <View style={styles.restaurantIconContainer}>
            <Ionicons name="storefront" size={20} color={colors.primary} />
          </View>
          <Text style={styles.restaurantName}>{restaurantInfo.name}</Text>
        </View>
      )}

      {/* Items List */}
      <ScrollView 
        style={styles.itemsList} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.itemsListContent}
      >
        {items.map((item, index) => (
          <Animated.View 
            key={`${item.id}-${index}`}
            style={[
              styles.cartItem,
              {
                opacity: animatedValues[item.id] || 1,
                transform: [{
                  scale: animatedValues[item.id] || 1
                }]
              }
            ]}
          >
            <View style={styles.itemImageContainer}>
              <Image 
                source={{ 
                  uri: item.image ? `${API_BASE_STORAGE}${item.image}` : 'https://via.placeholder.com/80x80'
                }} 
                style={styles.itemImage} 
                resizeMode="cover"
              />
            </View>
            
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
              {item.notes && (
                <Text style={styles.itemNotes} numberOfLines={1}>
                  Obs: {item.notes}
                </Text>
              )}
              <View style={styles.itemPriceRow}>
                <Text style={styles.itemPrice}>{item.price} MT</Text>
                <Text style={styles.itemTotal}>
                  Total: {calculateItemTotal(item)} MT
                </Text>
              </View>
            </View>
            
            <View style={styles.itemActions}>
              <View style={styles.quantityControls}>
                <TouchableOpacity 
                  style={[
                    styles.quantityButton,
                    item.quantity <= 1 && styles.quantityButtonDisabled
                  ]}
                  onPress={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                >
                  <Ionicons 
                    name="remove" 
                    size={16} 
                    color={item.quantity <= 1 ? colors.textLight : colors.primary} 
                  />
                </TouchableOpacity>
                
                <Text style={styles.quantity}>{item.quantity}</Text>
                
                <TouchableOpacity 
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  <Ionicons name="add" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => handleRemoveItem(item.id)}
              >
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        ))}
      </ScrollView>

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal ({totalItems} item{totalItems !== 1 ? 's' : ''})</Text>
          <Text style={styles.summaryValue}>{totalPrice} MT</Text>
        </View>
        
        <View style={styles.summaryNote}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.summaryNoteText}>
            Taxa de entrega e impostos serão calculados no checkout
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <View>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalSubtext}>*Valor estimado</Text>
          </View>
          <Text style={styles.totalPrice}>{totalPrice} MT</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.checkoutButton} 
          onPress={handleCheckout}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.checkoutButtonGradient}
          >
            <Text style={styles.checkoutButtonText}>Continuar para Checkout</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.surface} />
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
    // paddingTop: 50,
    // paddingBottom: 16,
    backgroundColor: colors.surface,
    // elevation: 2,
    // shadowColor: colors.shadowColor,
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  restaurantIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  itemsList: {
    flex: 1,
  },
  itemsListContent: {
    padding: 20,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    elevation: 2,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  itemImageContainer: {
    marginRight: 16,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    lineHeight: 22,
  },
  itemNotes: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  itemPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  itemActions: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 12,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quantityButtonDisabled: {
    backgroundColor: colors.border,
  },
  quantity: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginHorizontal: 16,
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    marginTop: 12,
    padding: 8,
  },
  summary: {
    backgroundColor: colors.surface,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  summaryNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
  },
  summaryNoteText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  footer: {
    backgroundColor: colors.surface,
    padding: 20,
    paddingTop: 16,
    marginBottom:80
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
    color: colors.textLight,
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
    marginRight: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
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
  exploreButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  exploreButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  exploreButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});