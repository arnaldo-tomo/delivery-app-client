// src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  FlatList,
  Alert,
  StatusBar,
  Dimensions,
  RefreshControl,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';
import { API_BASE_STORAGE } from '../config/config';
import { useSimpleNotifications } from '../hooks/useNotifications';

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

export default function HomeScreen({ navigation }) {
  const { showTest } = useSimpleNotifications();
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [location, setLocation] = useState({
    street: 'Carregando...',
    city: '',
    country: 'Moçambique',
    loading: true
  });

  useEffect(() => {
    loadData();
    setGreetingMessage();
    getCurrentLocation();
  }, []);

  const setGreetingMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Bom dia');
    } else if (hour < 18) {
      setGreeting('Boa tarde');
    } else {
      setGreeting('Boa noite');
    }
  };

  async function loadData() {
    try {
      const [restaurantsResponse, categoriesResponse] = await Promise.all([
        api.getRestaurants(),
        api.getCategories(),
      ]);
      
      setRestaurants(restaurantsResponse.data.data);
      setCategories(categoriesResponse.data.data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os dados');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
    getCurrentLocation();
  };

  // Função para obter localização atual
  const getCurrentLocation = async () => {
    try {
      // Solicitar permissão de localização
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setLocation({
          street: 'Permissão negada',
          city: 'Beira',
          country: 'Moçambique',
          loading: false
        });
        return;
      }

      // Obter localização atual
      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Fazer geocodificação reversa para obter endereço
      let reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        setLocation({
          street: address.street || address.name || 'Rua não identificada',
          city: address.city || address.subregion || 'Beira',
          country: address.country || 'Moçambique',
          district: address.district || address.region,
          loading: false
        });
      } else {
        setLocation({
          street: 'Endereço não encontrado',
          city: 'Beira',
          country: 'Moçambique',
          loading: false
        });
      }
    } catch (error) {
      console.log('Erro ao obter localização:', error);
      setLocation({
        street: 'Erro ao obter localização',
        city: 'Beira',
        country: 'Moçambique',
        loading: false
      });
    }
  };

  function renderCategory({ item, index }) {
    const categoryIcons = {
      'Pizza': 'pizza-outline',
      'Burger': 'fast-food-outline',
      'Sushi': 'fish-outline',
      'Bebidas': 'wine-outline',
      'Sobremesas': 'ice-cream-outline',
      'Saladas': 'leaf-outline',
    };

    const iconName = categoryIcons[item.name] || 'restaurant-outline';

    return (
      <TouchableOpacity 
        style={[styles.categoryCard, { marginLeft: index === 0 ? 20 : 0 }]}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          style={styles.categoryIconGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={iconName} size={28} color={colors.surface} />
        </LinearGradient>
        <Text style={styles.categoryName}>{item.name}</Text>
      </TouchableOpacity>
    );
  }

  function renderRestaurant({ item, index }) {
    return (
      <TouchableOpacity 
        style={[styles.restaurantCard, { marginLeft: index === 0 ? 20 : 12 }]}
        onPress={() => navigation.navigate('Restaurant', { restaurant: item })}
        activeOpacity={0.9}
      >
        <View style={styles.restaurantImageContainer}>
          <Image 
            source={{ uri: `${API_BASE_STORAGE}${item.image}` || 'https://via.placeholder.com/280x160' }} 
            style={styles.restaurantImage} 
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.imageOverlay}
          />
          <View style={styles.favoriteButton}>
            <Ionicons name="heart-outline" size={20} color={colors.surface} />
          </View>
          <View style={styles.deliveryBadge}>
            <Text style={styles.deliveryText}>30-45 min</Text>
          </View>
        </View>
        
        <View style={styles.restaurantInfo}>
          <View style={styles.restaurantHeader}>
            <Text style={styles.restaurantName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color={colors.secondary} />
              <Text style={styles.ratingText}>4.8</Text>
            </View>
          </View>
          
          <Text style={styles.restaurantCategory} numberOfLines={1}>{item.category}</Text>
          
          <View style={styles.restaurantFooter}>
            <View style={styles.deliveryInfo}>
              <Ionicons name="bicycle-outline" size={16} color={colors.accent} />
              <Text style={styles.deliveryFeeText}>Grátis</Text>
            </View>
            <Text style={styles.priceRange}>••• MT</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  function renderFeaturedRestaurant({ item }) {
    return (
      <TouchableOpacity 
        style={styles.featuredCard}
        onPress={() => navigation.navigate('Restaurant', { restaurant: item })}
        activeOpacity={0.9}
      >
        <Image 
          source={{ uri: `${API_BASE_STORAGE}${item.image}` || 'https://via.placeholder.com/350x200' }} 
          style={styles.featuredImage} 
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.featuredOverlay}
        />
        <View style={styles.featuredContent}>
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>Em Destaque</Text>
          </View>
          <Text style={styles.featuredName}>{item.name}</Text>
          <Text style={styles.featuredDescription}>Entrega gratuita • 25-30 min</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{greeting}, {user?.name?.split(' ')[0]}! 👋</Text>
            <TouchableOpacity 
              style={styles.locationContainer}
              onPress={getCurrentLocation}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={location.loading ? "sync-outline" : "location-outline"} 
                size={16} 
                color={colors.accent} 
                style={location.loading ? { transform: [{ rotate: '360deg' }] } : {}}
              />
              <View style={styles.locationTextContainer}>
                {location.loading ? (
                  <Text style={styles.location}>Obtendo localização...</Text>
                ) : (
                  <>
                    <Text style={styles.locationMain} numberOfLines={1}>
                      {location.street}
                    </Text>
                    <Text style={styles.locationSub} numberOfLines={1}>
                      {location.city}, {location.country}
                    </Text>
                  </>
                )}
              </View>
              <Ionicons name="chevron-down-outline" size={16} color={colors.textLight} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.profileButton}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.profileGradient}
            >
              <Ionicons name="person" size={24} color={colors.surface} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TouchableOpacity 
          style={styles.searchContainer}
          onPress={() => navigation.navigate('Search')}
          activeOpacity={0.8}
        >
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color={colors.textLight} />
            <Text style={styles.searchPlaceholder}>O que você está procurando?</Text>
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </TouchableOpacity>
        <TouchableOpacity onPress={showTest}>

  </TouchableOpacity>
        {/* Promotional Banner */}
        <View style={styles.bannerContainer}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.banner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.bannerContent}>
              <View style={styles.bannerIcon}>
                <Ionicons name="flash" size={24} color={colors.surface} />
              </View>
              <View style={styles.bannerText}>
                <Text style={styles.bannerTitle}>Entrega Grátis!</Text>
                <Text style={styles.bannerSubtitle}>Em pedidos acima de 500 MT</Text>
              </View>
            </View>
            <View style={styles.bannerIllustration}>
              <Ionicons name="bicycle" size={40} color={colors.surface} />
            </View>
          </LinearGradient>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categorias</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={categories}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        {/* Featured Restaurants */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Em Destaque</Text>
          </View>
          
          <FlatList
            data={restaurants.slice(0, 3)}
            renderItem={renderFeaturedRestaurant}
            keyExtractor={(item) => `featured-${item.id.toString()}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
          />
        </View>

        {/* Popular Restaurants */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Populares perto de você</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={restaurants}
            renderItem={renderRestaurant}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.restaurantsList}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionCard}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="time-outline" size={24} color={colors.primary} />
            </View>
            <Text style={styles.quickActionTitle}>Pedidos Rápidos</Text>
            <Text style={styles.quickActionSubtitle}>Menos de 20 min</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionCard}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="gift-outline" size={24} color={colors.secondary} />
            </View>
            <Text style={styles.quickActionTitle}>Ofertas</Text>
            <Text style={styles.quickActionSubtitle}>Até 50% off</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 24,
    backgroundColor: colors.background,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    maxWidth: '90%',
  },
  locationTextContainer: {
    flex: 1,
    marginLeft: 6,
    marginRight: 6,
  },
  locationMain: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  locationSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  location: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
    marginRight: 4,
    fontWeight: '500',
  },
  profileButton: {
    marginLeft: 16,
  },
  profileGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  searchPlaceholder: {
    marginLeft: 12,
    fontSize: 16,
    color: colors.textLight,
    flex: 1,
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.surface,
    marginLeft: 12,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  bannerContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  banner: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bannerIcon: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.surface,
    letterSpacing: -0.3,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: colors.surface,
    marginTop: 2,
    opacity: 0.9,
  },
  bannerIllustration: {
    opacity: 0.8,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  categoriesList: {
    paddingRight: 20,
  },
  categoryCard: {
    alignItems: 'center',
    marginRight: 20,
    width: 80,
  },
  categoryIconGradient: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 3,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  categoryName: {
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  featuredList: {
    paddingHorizontal: 20,
  },
  featuredCard: {
    width: width * 0.85,
    marginRight: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  featuredImage: {
    width: '100%',
    height: 200,
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  featuredContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  featuredBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  featuredBadgeText: {
    fontSize: 12,
    color: colors.surface,
    fontWeight: '600',
  },
  featuredName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.surface,
    marginBottom: 4,
  },
  featuredDescription: {
    fontSize: 14,
    color: colors.surface,
    opacity: 0.9,
  },
  restaurantsList: {
    paddingRight: 20,
  },
  restaurantCard: {
    width: 280,
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginRight: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  restaurantImageContainer: {
    position: 'relative',
  },
  restaurantImage: {
    width: '100%',
    height: 160,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deliveryBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  deliveryText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
  },
  restaurantInfo: {
    padding: 16,
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginRight: 8,
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
    fontSize: 14,
    color: colors.text,
    marginLeft: 4,
    fontWeight: '600',
  },
  restaurantCategory: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  restaurantFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryFeeText: {
    fontSize: 14,
    color: colors.accent,
    marginLeft: 4,
    fontWeight: '600',
  },
  priceRange: {
    fontSize: 14,
    color: colors.textLight,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 16,
    marginRight: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    backgroundColor: colors.background,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 32,
  },
});