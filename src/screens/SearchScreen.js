// src/screens/SearchScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  Alert,
  StatusBar,
  ActivityIndicator,
  Animated,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCart } from '../contexts/CartContext';
import * as api from '../services/api';
import { API_BASE_STORAGE } from '../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  error: '#EF4444',
  shadowColor: '#000000',
};

const RECENT_SEARCHES_KEY = '@recent_searches';

export default function SearchScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('restaurants');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const [allRestaurants, setAllRestaurants] = useState([]);
  
  const { addItem, items } = useCart();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    loadRecentSearches();
    loadAllRestaurants();
  }, []);

  // Carregar restaurantes uma vez só
  async function loadAllRestaurants() {
    try {
      const response = await api.getRestaurants();
      setAllRestaurants(response.data.data || response.data || []);
    } catch (error) {
      console.log('Erro ao carregar restaurantes:', error);
    }
  }

  // Carregar buscas recentes
  async function loadRecentSearches() {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.log('Erro ao carregar buscas recentes:', error);
    }
  }

  // Salvar busca recente
  async function saveRecentSearch(query, type) {
    try {
      const newSearch = { query, type, timestamp: Date.now() };
      const filtered = recentSearches.filter(s => 
        !(s.query === query && s.type === type)
      );
      const updated = [newSearch, ...filtered].slice(0, 10);
      
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.log('Erro ao salvar busca:', error);
    }
  }

  // Busca em tempo real
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch();
      }, 500); // Busca após 500ms de pausa na digitação
    } else if (searchQuery.trim().length === 0) {
      setResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, activeTab]);

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      if (activeTab === 'restaurants') {
        await searchRestaurants();
      } else {
        await searchDishes();
      }
      
      // Salvar busca recente
      await saveRecentSearch(searchQuery.trim(), activeTab);
    } catch (error) {
      console.log('Erro na busca:', error);
      Alert.alert('Erro', 'Não foi possível realizar a busca');
    } finally {
      setLoading(false);
    }
  }

  async function searchRestaurants() {
    const filtered = allRestaurants.filter(restaurant =>
      restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (restaurant.description && restaurant.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (restaurant.category && restaurant.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    setResults(filtered.map(r => ({ ...r, type: 'restaurant' })));
  }

  async function searchDishes() {
    try {
      let allDishes = [];
      const query = searchQuery.toLowerCase();
      
      // Buscar em até 15 restaurantes para performance
      const restaurantsToSearch = allRestaurants.slice(0, 15);
      
      for (const restaurant of restaurantsToSearch) {
        try {
          const productsResponse = await api.getRestaurantProducts(restaurant.id);
          const products = productsResponse.data?.data || productsResponse.data || productsResponse || [];
          
          const matchingProducts = products.filter(product =>
            product.name?.toLowerCase().includes(query) ||
            product.description?.toLowerCase().includes(query) ||
            product.category?.toLowerCase().includes(query)
          );
          
          const productsWithRestaurant = matchingProducts.map(product => ({
            ...product,
            restaurant: restaurant,
            type: 'product'
          }));
          
          allDishes.push(...productsWithRestaurant);
        } catch (error) {
          console.log(`Erro ao buscar produtos do restaurante ${restaurant.name}:`, error);
        }
      }
      
      console.log(`Encontrados ${allDishes.length} pratos para "${searchQuery}"`);
      setResults(allDishes);
    } catch (error) {
      console.log('Erro na busca de pratos:', error);
      setResults([]);
    }
  }

  function openModal(item) {
    setSelectedItem(item);
    setQuantity(1);
    setNotes('');
    setShowModal(true);
  }

  function handleAddToCart() {
    if (!selectedItem) return;
    
    addItem({
      ...selectedItem,
      restaurant_id: selectedItem.restaurant?.id,
      restaurant_name: selectedItem.restaurant?.name,
      notes: notes.trim(),
    }, quantity);
    
    setShowModal(false);
    Alert.alert('Sucesso! 🎉', `${selectedItem.name} adicionado ao carrinho!`);
  }

  function navigateToRestaurant(restaurant) {
    const restaurantData = {
      id: restaurant.id,
      name: restaurant.name || 'Restaurante',
      category: restaurant.category || 'Restaurante',
      image: restaurant.image || restaurant.cover_image,
      description: restaurant.description || '',
      rating: restaurant.rating || '4.5',
      delivery_time_min: restaurant.delivery_time_min || 30,
      delivery_time_max: restaurant.delivery_time_max || 45,
      delivery_fee: restaurant.delivery_fee || '0.00',
      minimum_order: restaurant.minimum_order || '50.00',
      is_active: restaurant.is_active !== false,
      categories: restaurant.categories || [],
      ...restaurant
    };
    navigation.navigate('Restaurant', { restaurant: restaurantData });
  }

  function handleRecentSearch(recent) {
    setActiveTab(recent.type);
    setSearchQuery(recent.query);
  }

  function clearRecentSearches() {
    setRecentSearches([]);
    AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
  }

  function renderResult(item, index) {
    const isRestaurant = activeTab === 'restaurants';
    const inCart = items.find(cartItem => cartItem.id === item.id);

    return (
      <Animated.View
        key={`${item.type}-${item.id}-${index}`}
        style={[
          styles.card,
          {
            opacity: fadeAnim,
            transform: [{
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0]
              })
            }]
          }
        ]}
      >
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() => isRestaurant ? navigateToRestaurant(item) : openModal(item)}
          activeOpacity={0.95}
        >
          {/* Imagem */}
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: item.image
                  ? `${API_BASE_STORAGE}${item.image}`
                  : 'https://via.placeholder.com/120x120'
              }}
              style={styles.image}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)']}
              style={styles.imageGradient}
            />
            
            {/* Badge de tipo */}
            <View style={[styles.typeBadge, isRestaurant ? styles.restaurantBadge : styles.productBadge]}>
              <Ionicons
                name={isRestaurant ? "storefront" : "restaurant"}
                size={10}
                color={colors.surface}
              />
            </View>
          </View>

          {/* Conteúdo */}
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
              {item.rating && (
                <View style={styles.rating}>
                  <Ionicons name="star" size={12} color={colors.secondary} />
                  <Text style={styles.ratingText}>{parseFloat(item.rating).toFixed(1)}</Text>
                </View>
              )}
            </View>

            {isRestaurant ? (
              <View style={styles.restaurantInfo}>
                <Text style={styles.category}>{item.category || 'Restaurante'}</Text>
                <View style={styles.meta}>
                  <Text style={styles.metaText}>
                    {item.delivery_time_min || 30}-{item.delivery_time_max || 45} min
                  </Text>
                  <Text style={styles.metaText}>•</Text>
                  <Text style={[styles.metaText, parseFloat(item.delivery_fee || 0) === 0 && styles.freeDelivery]}>
                    {parseFloat(item.delivery_fee || 0) === 0 ? 'Grátis' : `${parseFloat(item.delivery_fee).toFixed(0)} MT`}
                  </Text>
                </View>
                {item.description && (
                  <Text style={styles.description} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
              </View>
            ) : (
              <View style={styles.productInfo}>
                <Text style={styles.restaurant}>{item.restaurant?.name}</Text>
                {item.description && (
                  <Text style={styles.description} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
                <Text style={styles.price}>{parseFloat(item.price || 0).toFixed(2)} MT</Text>
              </View>
            )}
          </View>

          {/* Ações */}
          {!isRestaurant && (
            <View style={styles.actionContainer}>
              {inCart && (
                <View style={styles.quantityBadge}>
                  <Text style={styles.quantityText}>{inCart.quantity}</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.addButton}
                onPress={(e) => {
                  e.stopPropagation();
                  openModal(item);
                }}
              >
                <Ionicons name="add" size={20} color={colors.surface} />
              </TouchableOpacity>
            </View>
          )}

          {isRestaurant && (
            <View style={styles.arrowContainer}>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  function renderRecentSearch(recent, index) {
    return (
      <TouchableOpacity
        key={index}
        style={styles.recentItem}
        onPress={() => handleRecentSearch(recent)}
      >
        <View style={styles.recentContent}>
          <Ionicons 
            name={recent.type === 'restaurants' ? "storefront-outline" : "restaurant-outline"} 
            size={16} 
            color={colors.textSecondary} 
          />
          <Text style={styles.recentText}>{recent.query}</Text>
          <Text style={styles.recentType}>
            {recent.type === 'restaurants' ? 'Restaurantes' : 'Pratos'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.textLight} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Buscar ${activeTab === 'restaurants' ? 'restaurantes' : 'pratos'}...`}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {loading && <ActivityIndicator size="small" color={colors.primary} />}
            {searchQuery.length > 0 && !loading && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textLight} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Abas */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'restaurants' && styles.activeTab]}
            onPress={() => {
              setActiveTab('restaurants');
              setResults([]);
            }}
          >
            <Ionicons 
              name="storefront" 
              size={20} 
              color={activeTab === 'restaurants' ? colors.surface : colors.textSecondary} 
            />
            <Text style={[
              styles.tabText, 
              activeTab === 'restaurants' && styles.activeTabText
            ]}>
              Restaurantes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'dishes' && styles.activeTab]}
            onPress={() => {
              setActiveTab('dishes');
              setResults([]);
            }}
          >
            <Ionicons 
              name="restaurant" 
              size={20} 
              color={activeTab === 'dishes' ? colors.surface : colors.textSecondary} 
            />
            <Text style={[
              styles.tabText, 
              activeTab === 'dishes' && styles.activeTabText
            ]}>
              Pratos
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Conteúdo */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {searchQuery.length >= 2 ? (
          // Resultados da busca
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>
                Buscando {activeTab === 'restaurants' ? 'restaurantes' : 'pratos'}...
              </Text>
            </View>
          ) : results.length > 0 ? (
            <>
              <Text style={styles.resultsTitle}>
                {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
              </Text>
              {results.map(renderResult)}
            </>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={64} color={colors.textLight} />
              <Text style={styles.emptyTitle}>Nenhum resultado</Text>
              <Text style={styles.emptySubtitle}>
                Tente outro termo de busca para {activeTab === 'restaurants' ? 'restaurantes' : 'pratos'}
              </Text>
            </View>
          )
        ) : searchQuery.length > 0 ? (
          // Buscando enquanto digita
          <View style={styles.searching}>
            <Text style={styles.searchingText}>Digite pelo menos 2 caracteres para buscar</Text>
          </View>
        ) : (
          // Estado inicial
          <View style={styles.initial}>
            <Ionicons 
              name={activeTab === 'restaurants' ? "storefront-outline" : "restaurant-outline"} 
              size={80} 
              color={colors.textLight} 
            />
            <Text style={styles.welcomeTitle}>
              {activeTab === 'restaurants' ? 'Buscar Restaurantes' : 'Buscar Pratos'}
            </Text>
            <Text style={styles.welcomeSubtitle}>
              {activeTab === 'restaurants' 
                ? 'Digite o nome do restaurante que procura' 
                : 'Digite o nome do prato que deseja'
              }
            </Text>
            
            {/* Buscas recentes */}
            {recentSearches.length > 0 && (
              <View style={styles.recentSection}>
                <View style={styles.recentHeader}>
                  <Text style={styles.recentTitle}>Buscas Recentes</Text>
                  <TouchableOpacity onPress={clearRecentSearches}>
                    <Text style={styles.clearButton}>Limpar</Text>
                  </TouchableOpacity>
                </View>
                
                {recentSearches.slice(0, 5).map(renderRecentSearch)}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal do Produto */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Adicionar ao carrinho</Text>
            <View style={styles.spacer} />
          </View>

          {selectedItem && (
            <ScrollView style={styles.modalContent}>
              <Image
                source={{
                  uri: selectedItem.image
                    ? `${API_BASE_STORAGE}${selectedItem.image}`
                    : 'https://via.placeholder.com/300x200'
                }}
                style={styles.modalImage}
                resizeMode="cover"
              />
              
              <View style={styles.modalInfo}>
                <Text style={styles.modalName}>{selectedItem.name}</Text>
                <Text style={styles.modalRestaurant}>{selectedItem.restaurant?.name}</Text>
                {selectedItem.description && (
                  <Text style={styles.modalDescription}>{selectedItem.description}</Text>
                )}
                <Text style={styles.modalPrice}>
                  {parseFloat(selectedItem.price || 0).toFixed(2)} MT
                </Text>
              </View>

              <View style={styles.quantitySection}>
                <Text style={styles.sectionTitle}>Quantidade</Text>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Ionicons name="remove" size={20} color={colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.quantityValue}>{quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => setQuantity(quantity + 1)}
                  >
                    <Ionicons name="add" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.notesSection}>
                <Text style={styles.sectionTitle}>Observações (opcional)</Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Ex: sem cebola, molho à parte..."
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  maxLength={100}
                />
              </View>
            </ScrollView>
          )}

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
              <Text style={styles.addToCartText}>
                Adicionar • {selectedItem ? (selectedItem.price * quantity).toFixed(2) : '0.00'} MT
              </Text>
            </TouchableOpacity>
          </View>
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
  headerContainer: {
    backgroundColor: colors.surface,
    elevation: 2,
    paddingTop: 50,
    paddingBottom: 0,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: colors.text,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.primary,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 8,
  },
  activeTabText: {
    color: colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 20,
  },
  searching: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  searchingText: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    borderRadius: 12,
  },
  typeBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  restaurantBadge: {
    backgroundColor: colors.accent,
  },
  productBadge: {
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary + '20',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 3,
  },
  restaurantInfo: {
    flex: 1,
  },
  category: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: 8,
  },
  freeDelivery: {
    color: colors.success,
    fontWeight: '600',
  },
  productInfo: {
    flex: 1,
  },
  restaurant: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  actionContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  quantityBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    backgroundColor: colors.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  quantityText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: '700',
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  arrowContainer: {
    justifyContent: 'center',
    paddingLeft: 16,
  },
  initial: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  recentItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
  },
  recentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  recentText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
  recentType: {
    fontSize: 12,
    color: colors.textLight,
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modal: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  spacer: {
    width: 24,
  },
  modalContent: {
    flex: 1,
  },
  modalImage: {
    width: '100%',
    height: 200,
  },
  modalInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  modalRestaurant: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  modalPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  quantitySection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    marginHorizontal: 24,
    minWidth: 40,
    textAlign: 'center',
  },
  notesSection: {
    padding: 20,
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
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addToCartButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addToCartText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.surface,
  },
});