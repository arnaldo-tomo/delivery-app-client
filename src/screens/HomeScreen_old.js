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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';
import { API_BASE_STORAGE } from '../config/config';

const colors = {
  primary: '#FE3801',
  primaryLight: '#F94234',
  secondary: '#FE8800',
  text: '#0B0C17',
  textLight: '#32354E',
  gray: '#A4A5B0',
  grayLight: '#EDEDEF',
  white: '#FFFFFF',
};

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

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
    }
  }

  function renderCategory({ item }) {
    return (
      <TouchableOpacity style={styles.categoryCard} >
        <View style={styles.categoryIcon}>
          <Ionicons name="restaurant-outline" size={24} color={colors.primary} />
        </View>
        <Text style={styles.categoryName}>{item.name}</Text>
      </TouchableOpacity>
    );
  }

  function renderRestaurant({ item }) {
    // console.log("Yoo",item);
    return (
      <TouchableOpacity 
        style={styles.restaurantCard}
        onPress={() => navigation.navigate('Restaurant', { restaurant: item })}
      >
        <Image 
          source={{ uri: `${API_BASE_STORAGE}${item.image}` || 'https://via.placeholder.com/100x100' }} 
          style={styles.restaurantImage} 
        />
        <View style={styles.restaurantInfo}>
          <Text style={styles.restaurantName}>{item.name}</Text>
          <Text style={styles.restaurantCategory}>{item.category}</Text>
          <View style={styles.restaurantMeta}>
            <View style={styles.rating}>
              <Ionicons name="star" size={16} color={colors.secondary} />
              <Text style={styles.ratingText}>4.5</Text>
            </View>
            <Text style={styles.deliveryTime}>30-45 min</Text>
            <Text style={styles.deliveryFee}>Taxa: {item.delivery_fee}MT</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]}!</Text>
          <Text style={styles.location}>📍 Sua localização</Text>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <Ionicons name="person-circle-outline" size={32} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <TouchableOpacity 
        style={styles.searchBar}
        onPress={() => navigation.navigate('Search')}
      >
        <Ionicons name="search-outline" size={20} color={colors.gray} />
        <Text style={styles.searchPlaceholder}>Buscar restaurantes ou pratos...</Text>
      </TouchableOpacity>

      {/* Banner Promocional */}
      <View style={styles.banner}>
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle}>Entrega Grátis!</Text>
          <Text style={styles.bannerSubtitle}>Em pedidos acima de 30,00 MT</Text>
        </View>
        <Ionicons name="bicycle-outline" size={48} color={colors.white} />
      </View>

      {/* Categories */}
      <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Categorias</Text>
        <TouchableOpacity>
            <Text style={styles.seeAll}></Text>
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

      {/* Restaurants */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Restaurantes próximos </Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>Ver todos</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={restaurants}
          renderItem={renderRestaurant}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  location: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 4,
  },
  profileButton: {
    padding: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.grayLight,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchPlaceholder: {
    marginLeft: 12,
    fontSize: 16,
    color: colors.gray,
  },banner: {
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: colors.white,
    marginTop: 4,
    opacity: 0.9,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    // marginLeft:20
  },
  seeAll: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  categoryCard: {
    alignItems: 'center',
    // marginRight: 16,
    width: 80,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    backgroundColor: colors.white,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation:1
  },
  categoryName: {
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  restaurantCard: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  restaurantImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  restaurantInfo: {
    padding: 16,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  restaurantCategory: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 8,
  },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  ratingText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 4,
    fontWeight: '600',
  },
  deliveryTime: {
    fontSize: 12,
    color: colors.textLight,
    marginRight: 16,
  },
  deliveryFee: {
    fontSize: 12,
    color: colors.textLight,
  },
});
