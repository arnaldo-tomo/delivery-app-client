// src/screens/RestaurantScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  FlatList,
  Alert,
  StatusBar,
  Dimensions,
  Animated,
  Modal,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCart } from '../contexts/CartContext';
import * as api from '../services/api';
import { API_BASE_STORAGE } from '../config/config';

const { width, height } = Dimensions.get('window');

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

const HEADER_HEIGHT = 280;
const SCROLL_THRESHOLD = HEADER_HEIGHT - 100;

export default function RestaurantScreen({ route, navigation }) {

    // Verificação e normalização dos dados do restaurante
    const rawRestaurant = route.params?.restaurant;
  
    // Se não há restaurante, voltar para a tela anterior
    if (!rawRestaurant || !rawRestaurant.id) {
      Alert.alert(
        'Erro',
        'Informações do restaurante não encontradas',
        [
          {
            text: 'Voltar',
            onPress: () => navigation.goBack(),
            style: 'default'
          }
        ]
      );
      return null; // ou um componente de loading
    }
  
    // Normalizar dados do restaurante com valores padrão
    const restaurant = {
      id: rawRestaurant.id,
      name: rawRestaurant.name || 'Restaurante',
      category: rawRestaurant.category || rawRestaurant.cuisine_type || 'Restaurante',
      image: rawRestaurant.image || rawRestaurant.cover_image || null,
      cover_image: rawRestaurant.cover_image || rawRestaurant.image || null,
      description: rawRestaurant.description || 'Descrição não disponível',
      rating: rawRestaurant.rating || '4.5',
      total_reviews: rawRestaurant.total_reviews || 0,
      delivery_time_min: rawRestaurant.delivery_time_min || 30,
      delivery_time_max: rawRestaurant.delivery_time_max || 45,
      delivery_fee: rawRestaurant.delivery_fee || '0.00',
      minimum_order: rawRestaurant.minimum_order || '50.00',
      is_active: rawRestaurant.is_active !== false,
      is_featured: rawRestaurant.is_featured || false,
      categories: rawRestaurant.categories || [],
      address: rawRestaurant.address || 'Endereço não informado',
      phone: rawRestaurant.phone || '+258 84 123 4567',
      email: rawRestaurant.email || 'contato@restaurante.com',
      opening_time: rawRestaurant.opening_time || '09:00',
      closing_time: rawRestaurant.closing_time || '23:00',
      working_days: rawRestaurant.working_days || [
        'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
      ],
      latitude: rawRestaurant.latitude || null,
      longitude: rawRestaurant.longitude || null,
      // Manter todas as outras propriedades que possam existir
      ...rawRestaurant
    };
  
    console.log('🏪 Dados do restaurante normalizados:', {
      id: restaurant.id,
      name: restaurant.name,
      hasImage: !!restaurant.image,
      hasDescription: !!restaurant.description,
      categoriesCount: restaurant.categories?.length || 0
    });
  // const { restaurant } = route.params;
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productQuantity, setProductQuantity] = useState(1);
  const [productNotes, setProductNotes] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  
  const { addItem, items } = useCart();
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadProducts();
    
    // Animação de entrada
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  async function loadProducts() {
    try {
      const response = await api.getRestaurantProducts(restaurant.id);
      const productsData = response.data.data || response.data || [];
      setProducts(productsData);
      
      // Extrair categorias únicas dos produtos
      const uniqueCategories = [...new Set(productsData.map(p => p.category).filter(Boolean))];
      setCategories([
        { id: 'all', name: 'Todos', count: productsData.length },
        ...uniqueCategories.map(cat => ({
          id: cat.toLowerCase().replace(/\s+/g, '_'),
          name: cat,
          count: productsData.filter(p => p.category === cat).length
        }))
      ]);
      
    } catch (error) {
      console.log('Erro ao carregar produtos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os produtos');
    } finally {
      setLoading(false);
    }
  }

  function handleAddToCart(product, quantity = 1, notes = '') {
    const cartItem = {
      ...product,
      restaurant_id: restaurant.id,
      restaurant_name: restaurant.name,
      quantity,
      notes: notes.trim(),
      id: `${product.id}_${Date.now()}` // ID único para permitir múltiplas variações
    };
    
    addItem(cartItem, quantity);
    
    Alert.alert(
      'Adicionado ao carrinho! 🎉',
      `${quantity}x ${product.name}${notes ? `\nObs: ${notes}` : ''}`,
      [
        { text: 'Continuar', style: 'default' },
        { text: 'Ver carrinho', onPress: () =>  navigation.navigate('MainTabs', { screen: 'Cart' }) }
      ]
    );
  }

  function openProductModal(product) {
    setSelectedProduct(product);
    setProductQuantity(1);
    setProductNotes('');
    setShowProductModal(true);
  }

  function handleModalAddToCart() {
    if (selectedProduct) {
      handleAddToCart(selectedProduct, productQuantity, productNotes);
      setShowProductModal(false);
    }
  }

  function toggleFavorite() {
    setIsFavorite(!isFavorite);
    // Aqui você implementaria a lógica para salvar/remover favoritos na API
  }

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || 
      product.category?.toLowerCase().replace(/\s+/g, '_') === selectedCategory;
    
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, SCROLL_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.2, 1],
    extrapolate: 'clamp',
  });

  const imageTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT * 0.7],
    extrapolate: 'clamp',
  });

  function renderCategory({ item }) {
    const isSelected = selectedCategory === item.id;
    
    return (
      <TouchableOpacity
        style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
        onPress={() => setSelectedCategory(item.id)}
      >
        <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
          {item.name} ({item.count})
        </Text>
      </TouchableOpacity>
    );
  }

  function renderProduct({ item, index }) {
    const itemInCart = items.find(cartItem => cartItem.id === item.id);
    const quantityInCart = itemInCart?.quantity || 0;

    return (
      <Animated.View
        style={[
          styles.productCard,
          {
            opacity: fadeAnim,
            transform: [{
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0]
              })
            }]
          }
        ]}
      >
        <TouchableOpacity
          style={styles.productContent}
          onPress={() => openProductModal(item)}
          activeOpacity={0.9}
        >
          <View style={styles.productImageContainer}>
            <Image 
              source={{ 
                uri: item.image ? `${API_BASE_STORAGE}${item.image}` : 'https://via.placeholder.com/100x100'
              }} 
              style={styles.productImage} 
              resizeMode="cover"
            />
            {item.discount && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-{item.discount}%</Text>
              </View>
            )}
            {item.popular && (
              <View style={styles.popularBadge}>
                <Ionicons name="flame" size={12} color={colors.surface} />
                <Text style={styles.popularText}>Popular</Text>
              </View>
            )}
          </View>
          
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
            {item.description && (
              <Text style={styles.productDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            
            <View style={styles.productFooter}>
              <View style={styles.priceContainer}>
                {item.discount ? (
                  <View style={styles.priceWithDiscount}>
                    <Text style={styles.originalPrice}>{item.price} MT</Text>
                    <Text style={styles.productPrice}>
                      {(item.price * (1 - item.discount / 100)).toFixed(2)} MT
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.productPrice}>{item.price} MT</Text>
                )}
              </View>
              
              {item.rating && (
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={14} color={colors.secondary} />
                  <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
        
        <View style={styles.productActions}>
          {quantityInCart > 0 && (
            <View style={styles.quantityBadge}>
              <Text style={styles.quantityText}>{quantityInCart}</Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => openProductModal(item)}
          >
            <Ionicons name="add" size={20} color={colors.surface} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Animated Header */}
      <Animated.View style={[styles.animatedHeader, { opacity: headerOpacity }]}>
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          style={styles.headerGradient}
        >
          <SafeAreaView style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.surface} />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle} numberOfLines={1}>
              {restaurant.name}
            </Text>
            
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={toggleFavorite}
              >
                <Ionicons 
                  name={isFavorite ? "heart" : "heart-outline"} 
                  size={24} 
                  color={isFavorite ? colors.error : colors.surface} 
                />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Restaurant Header */}
        <View style={styles.imageContainer}>
          <Animated.Image
            source={{ 
              uri: restaurant.image ? `${API_BASE_STORAGE}${restaurant.image}` : 'https://via.placeholder.com/400x280'
            }}
            style={[
              styles.restaurantImage,
              {
                transform: [
                  { scale: imageScale },
                  { translateY: imageTranslateY }
                ]
              }
            ]}
            resizeMode="cover"
          />
          
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.imageOverlay}
          />
          
          {/* Floating Action Buttons */}
          <View style={styles.floatingActions}>
            <TouchableOpacity 
              style={styles.floatingButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.surface} />
            </TouchableOpacity>
            
            <View style={styles.floatingActionsRight}>
              <TouchableOpacity 
                style={styles.floatingButton}
                onPress={toggleFavorite}
              >
                <Ionicons 
                  name={isFavorite ? "heart" : "heart-outline"} 
                  size={24} 
                  color={isFavorite ? colors.error : colors.surface} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.floatingButton}
                onPress={() => setShowInfo(true)}
              >
                <Ionicons name="information-circle-outline" size={24} color={colors.surface} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Restaurant Info */}
        <View style={styles.restaurantInfo}>
          <View style={styles.restaurantHeader}>
            <View style={styles.restaurantTitleSection}>
              <Text style={styles.restaurantName}>{restaurant.name}</Text>
              <Text style={styles.restaurantCategory}>{restaurant.category}</Text>
            </View>
            
            <View style={styles.restaurantBadges}>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={16} color={colors.secondary} />
                <Text style={styles.ratingBadgeText}>4.8</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.restaurantMeta}>
            <View style={styles.metaItem}>
              <View style={styles.metaIcon}>
                <Ionicons name="time-outline" size={16} color={colors.accent} />
              </View>
              <Text style={styles.metaText}>30-45 min</Text>
            </View>
            
            <View style={styles.metaItem}>
              <View style={styles.metaIcon}>
                <Ionicons name="bicycle-outline" size={16} color={colors.accent} />
              </View>
              <Text style={styles.metaText}>Grátis</Text>
            </View>
            
            <View style={styles.metaItem}>
              <View style={styles.metaIcon}>
                <Ionicons name="location-outline" size={16} color={colors.accent} />
              </View>
              <Text style={styles.metaText}>2.1 km</Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color={colors.textLight} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar no cardápio..."
              placeholderTextColor={colors.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textLight} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Categories */}
        {categories.length > 1 && (
          <View style={styles.categoriesSection}>
            <FlatList
              data={categories}
              renderItem={renderCategory}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesList}
            />
          </View>
        )}

        {/* Products */}
        <View style={styles.productsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Cardápio {searchQuery && `(${filteredProducts.length} resultados)`}
            </Text>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Carregando cardápio...</Text>
            </View>
          ) : filteredProducts.length > 0 ? (
            <FlatList
              data={filteredProducts}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="restaurant-outline" size={64} color={colors.textLight} />
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'Nenhum prato encontrado' : 'Cardápio em breve'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery 
                  ? 'Tente buscar por outro termo' 
                  : 'Este restaurante ainda está preparando seu cardápio'
                }
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.bottomPadding} />
      </Animated.ScrollView>

      {/* Product Detail Modal */}
      <Modal
        visible={showProductModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowProductModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {selectedProduct && (
            <>
              <View style={styles.modalHeader}>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setShowProductModal(false)}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Adicionar ao carrinho</Text>
                <View style={styles.modalHeaderSpacer} />
              </View>
              
              <ScrollView style={styles.modalContent}>
                <Image
                  source={{ 
                    uri: selectedProduct.image ? `${API_BASE_STORAGE}${selectedProduct.image}` : 'https://via.placeholder.com/300x200'
                  }}
                  style={styles.modalProductImage}
                  resizeMode="cover"
                />
                
                <View style={styles.modalProductInfo}>
                  <Text style={styles.modalProductName}>{selectedProduct.name}</Text>
                  {selectedProduct.description && (
                    <Text style={styles.modalProductDescription}>
                      {selectedProduct.description}
                    </Text>
                  )}
                  <Text style={styles.modalProductPrice}>{selectedProduct.price} MT</Text>
                </View>
                
                {/* Quantity Selector */}
                <View style={styles.quantitySection}>
                  <Text style={styles.quantityLabel}>Quantidade</Text>
                  <View style={styles.quantitySelector}>
                    <TouchableOpacity 
                      style={styles.quantityButton}
                      onPress={() => setProductQuantity(Math.max(1, productQuantity - 1))}
                    >
                      <Ionicons name="remove" size={20} color={colors.primary} />
                    </TouchableOpacity>
                    
                    <Text style={styles.quantityValue}>{productQuantity}</Text>
                    
                    <TouchableOpacity 
                      style={styles.quantityButton}
                      onPress={() => setProductQuantity(productQuantity + 1)}
                    >
                      <Ionicons name="add" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* Notes */}
                <View style={styles.notesSection}>
                  <Text style={styles.notesLabel}>Observações (opcional)</Text>
                  <TextInput
                    style={styles.notesInput}
                    placeholder="Ex: sem cebola, molho à parte..."
                    placeholderTextColor={colors.textLight}
                    value={productNotes}
                    onChangeText={setProductNotes}
                    multiline
                    maxLength={150}
                  />
                  <Text style={styles.notesCounter}>{productNotes.length}/150</Text>
                </View>
              </ScrollView>
              
              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={styles.addToCartButton}
                  onPress={handleModalAddToCart}
                >
                  <Text style={styles.addToCartButtonText}>
                    Adicionar • {(selectedProduct.price * productQuantity).toFixed(2)} MT
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </SafeAreaView>
      </Modal>

      {/* Restaurant Info Modal */}
      <Modal
        visible={showInfo}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInfo(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowInfo(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Informações</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>Sobre o restaurante</Text>
              <Text style={styles.infoText}>
                {restaurant.description || 'Informações sobre o restaurante em breve.'}
              </Text>
            </View>
            
            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>Horário de funcionamento</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Segunda a Domingo:</Text>
                <Text style={styles.infoValue}>11:00 - 23:00</Text>
              </View>
            </View>
            
            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>Entrega</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tempo estimado:</Text>
                <Text style={styles.infoValue}>30-45 min</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Taxa de entrega:</Text>
                <Text style={styles.infoValue}>Grátis</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Pedido mínimo:</Text>
                <Text style={styles.infoValue}>50 MT</Text>
              </View>
            </View>
            
            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>Contato</Text>
              <TouchableOpacity style={styles.contactButton}>
                <Ionicons name="call" size={20} color={colors.primary} />
                <Text style={styles.contactText}>+258 84 123 4567</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactButton}>
                <Ionicons name="location" size={20} color={colors.primary} />
                <Text style={styles.contactText}>Ver no mapa</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  headerGradient: {
    paddingTop: StatusBar.currentHeight || 44,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.surface,
    marginHorizontal: 16,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    height: HEADER_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },
  restaurantImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  floatingActions: {
    position: 'absolute',
    top: (StatusBar.currentHeight || 44) + 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  floatingActionsRight: {
    flexDirection: 'row',
    gap: 12,
  },
  floatingButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  restaurantInfo: {
    backgroundColor: colors.surface,
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    elevation: 8,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  restaurantTitleSection: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  restaurantCategory: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  restaurantBadges: {
    alignItems: 'flex-end',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  ratingBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 4,
  },
  restaurantMeta: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metaItem: {
    alignItems: 'center',
    flex: 1,
  },
  metaIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  searchSection: {
    backgroundColor: colors.surface,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
  },
  categoriesSection: {
    backgroundColor: colors.surface,
    paddingBottom: 16,
  },
  categoriesList: {
    paddingHorizontal: 24,
  },
  categoryChip: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: colors.surface,
  },
  productsSection: {
    padding: 24,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  productCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  productContent: {
    flexDirection: 'row',
    padding: 16,
  },
  productImageContainer: {
    position: 'relative',
  },
  productImage: {
    width: 100,
    height: 100,
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
  popularBadge: {
    position: 'absolute',
    bottom: -4,
    left: -4,
    backgroundColor: colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  popularText: {
    fontSize: 10,
    color: colors.surface,
    fontWeight: '700',
    marginLeft: 2,
  },
  productInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  productDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flex: 1,
  },
  priceWithDiscount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originalPrice: {
    fontSize: 14,
    color: colors.textLight,
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    color: colors.text,
    marginLeft: 4,
    fontWeight: '600',
  },
  productActions: {
    position: 'absolute',
    top: 16,
    right: 16,
    alignItems: 'center',
  },
  quantityBadge: {
    backgroundColor: colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quantityText: {
    fontSize: 12,
    color: colors.surface,
    fontWeight: '700',
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 32,
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
    paddingHorizontal: 20,
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
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  modalHeaderSpacer: {
    width: 40,
  },
  modalContent: {
    flex: 1,
  },
  modalProductImage: {
    width: '100%',
    height: 200,
  },
  modalProductInfo: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalProductName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  modalProductDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 16,
  },
  modalProductPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  quantitySection: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  quantityLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  quantityValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginHorizontal: 32,
    minWidth: 40,
    textAlign: 'center',
  },
  notesSection: {
    padding: 24,
  },
  notesLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  notesCounter: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'right',
    marginTop: 8,
  },
  modalFooter: {
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addToCartButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addToCartButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.surface,
  },
  
  // Info Modal Styles
  infoSection: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  contactText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 12,
  },
});