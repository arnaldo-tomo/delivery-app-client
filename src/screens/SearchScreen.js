
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  FlatList,
  Alert,
  TextInput,
} from 'react-native';
import { useCart } from '../contexts/CartContext';


const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const AuthStack = createStackNavigator();

const colors = {
  primary: '#FE3801',
  primaryLight: '#F94234',
  secondary: '#FE8800',
  secondaryLight: '#FEA033',
  text: '#0B0C17',
  textLight: '#32354E',
  gray: '#A4A5B0',
  grayLight: '#EDEDEF',
  white: '#FFFFFF',
};

export default function SearchScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { addItem } = useCart();

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await api.searchProducts(searchQuery);
      setSearchResults(response.data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível realizar a busca');
    } finally {
      setLoading(false);
    }
  }

  function handleAddToCart(product) {
    addItem(product);
    Alert.alert('Sucesso', `${product.name} adicionado ao carrinho!`);
  }

  function renderProduct({ item }) {
    return (
      <View style={styles.productCard}>
        <Image 
          source={{ uri: item.image || 'https://via.placeholder.com/80x80' }} 
          style={styles.productImage} 
        />
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.restaurantName}>{item.restaurant?.name}</Text>
          <Text style={styles.productDescription} numberOfLines={1}>
            {item.description}
          </Text>
          <Text style={styles.productPrice}>R$ {item.price.toFixed(2)}</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => handleAddToCart(item)}
        >
          <Ionicons name="add" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={colors.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar pratos ou restaurantes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.gray} />
            </TouchableOpacity>
          )}
        </View>
        
        {searchQuery.length > 0 && (
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>
              {loading ? 'Buscando...' : 'Buscar'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {searchResults.length > 0 ? (
        <FlatList
          data={searchResults}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={64} color={colors.gray} />
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'Nenhum resultado encontrado' : 'Faça sua busca'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery 
              ? 'Tente buscar por outro termo' 
              : 'Digite o nome do prato ou restaurante'
            }
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  searchContainer: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.grayLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  searchButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  resultsList: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  restaurantName: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    color: colors.gray,
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
  },
});