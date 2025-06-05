// src/components/SearchResultItem.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_STORAGE } from '../config/config';

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

const SearchResultItem = ({ 
  item, 
  onPress, 
  onAddToCart, 
  searchTerm,
  showAddButton = true 
}) => {
  const isRestaurant = item.type === 'restaurant';
  
  // Função para destacar termo de busca
  const highlightText = (text, term) => {
    if (!text || !term) return <Text>{text}</Text>;
    
    const index = text.toLowerCase().indexOf(term.toLowerCase());
    if (index === -1) return <Text>{text}</Text>;
    
    return (
      <Text>
        {text.substring(0, index)}
        <Text style={styles.highlightText}>
          {text.substring(index, index + term.length)}
        </Text>
        {text.substring(index + term.length)}
      </Text>
    );
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        isRestaurant && styles.restaurantContainer
      ]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Gradient de destaque para alta relevância */}
      {item.relevanceScore >= 80 && (
        <LinearGradient
          colors={['rgba(255, 107, 53, 0.1)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.highlightGradient}
        />
      )}
      
      <View style={styles.imageContainer}>
        <Image 
          source={{ 
            uri: item.image 
              ? `${API_BASE_STORAGE}${item.image}` 
              : 'https://via.placeholder.com/80x80?text=Sem+Imagem'
          }} 
          style={styles.image} 
          resizeMode="cover"
        />
        
        {/* Badge de desconto */}
        {item.discount && item.discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{item.discount}%</Text>
          </View>
        )}
        
        {/* Badge de tipo */}
        <View style={[
          styles.typeBadge,
          isRestaurant ? styles.restaurantBadge : styles.productBadge
        ]}>
          <Ionicons 
            name={isRestaurant ? "storefront" : "restaurant"} 
            size={10} 
            color={colors.surface} 
          />
        </View>
        
        {/* Indicador de disponibilidade */}
        {!isRestaurant && item.available === false && (
          <View style={styles.unavailableBadge}>
            <Text style={styles.unavailableText}>Indisponível</Text>
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={2}>
            {highlightText(item.name, searchTerm)}
          </Text>
          
          {/* Score de relevância (apenas para debug) */}
          {__DEV__ && item.relevanceScore && (
            <Text style={styles.debugScore}>{item.relevanceScore}</Text>
          )}
        </View>
        
        {isRestaurant ? (
          <RestaurantDetails item={item} searchTerm={searchTerm} />
        ) : (
          <ProductDetails item={item} searchTerm={searchTerm} />
        )}
      </View>
      
      {/* Botão de ação */}
      <View style={styles.actionContainer}>
        {!isRestaurant && showAddButton && item.available !== false ? (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={(e) => {
              e.stopPropagation();
              onAddToCart && onAddToCart(item);
            }}
          >
            <Ionicons name="add" size={20} color={colors.surface} />
          </TouchableOpacity>
        ) : (
          <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const RestaurantDetails = ({ item, searchTerm }) => (
  <View style={styles.details}>
    <Text style={styles.category}>
      {item.category || item.cuisine_type || 'Restaurante'}
    </Text>
    
    <View style={styles.metaInfo}>
      <View style={styles.rating}>
        <Ionicons name="star" size={12} color={colors.secondary} />
        <Text style={styles.ratingText}>{item.rating || '4.5'}</Text>
      </View>
      
      <Text style={styles.deliveryTime}>
        {item.delivery_time || '30-45'} min
      </Text>
      
      {item.delivery_fee && (
        <Text style={styles.deliveryFee}>
          Taxa: {item.delivery_fee} MT
        </Text>
      )}
    </View>
    
    {item.description && (
      <Text style={styles.description} numberOfLines={1}>
        {item.description}
      </Text>
    )}
  </View>
);

const ProductDetails = ({ item, searchTerm }) => (
  <View style={styles.details}>
    <View style={styles.productMeta}>
      <Text style={styles.restaurantName}>
        <Ionicons name="storefront-outline" size={12} color={colors.textSecondary} />
        {' '}{item.restaurant?.name || 'Restaurante'}
      </Text>
      
      {item.category && (
        <Text style={styles.productCategory}>• {item.category}</Text>
      )}
    </View>
    
    {item.description && (
      <Text style={styles.description} numberOfLines={2}>
        {item.description}
      </Text>
    )}
    
    <View style={styles.priceContainer}>
      {item.original_price && item.original_price > item.price && (
        <Text style={styles.originalPrice}>
          {item.original_price?.toFixed(2)} MT
        </Text>
      )}
      <Text style={styles.price}>{item.price?.toFixed(2)} MT</Text>
      
      {item.discount && item.discount > 0 && (
        <View style={styles.savingsContainer}>
          <Text style={styles.savings}>
            Economiza {((item.original_price || item.price) - item.price).toFixed(2)} MT
          </Text>
        </View>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
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
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  restaurantContainer: {
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  highlightGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  discountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 10,
    color: colors.surface,
    fontWeight: '700',
  },
  typeBadge: {
    position: 'absolute',
    bottom: -4,
    left: -4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  restaurantBadge: {
    backgroundColor: colors.accent,
  },
  productBadge: {
    backgroundColor: colors.primary,
  },
  unavailableBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unavailableText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    marginLeft: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  highlightText: {
    backgroundColor: colors.secondary,
    color: colors.text,
    fontWeight: '700',
  },
  debugScore: {
    fontSize: 10,
    color: colors.warning,
    backgroundColor: colors.background,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  details: {
    flex: 1,
  },
  category: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  ratingText: {
    fontSize: 12,
    color: colors.text,
    marginLeft: 4,
    fontWeight: '600',
  },
  deliveryTime: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: 12,
  },
  deliveryFee: {
    fontSize: 12,
    color: colors.textLight,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  restaurantName: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  productCategory: {
    fontSize: 12,
    color: colors.textLight,
    marginLeft: 8,
  },
  description: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 8,
    lineHeight: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  originalPrice: {
    fontSize: 12,
    color: colors.textLight,
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 8,
  },
  savingsContainer: {
    backgroundColor: colors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  savings: {
    fontSize: 10,
    color: colors.surface,
    fontWeight: '600',
  },
  actionContainer: {
    marginLeft: 12,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SearchResultItem;