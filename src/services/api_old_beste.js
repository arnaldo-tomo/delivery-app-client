// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://192.168.100.6:2021/api/v1'; // Altere para sua URL da API

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Aumentar timeout para 15 segundos
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

let authToken = null;

// Interceptor para adicionar token automaticamente
api.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.log('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  (error) => {
    console.log(`❌ API Error: ${error.config?.url} - ${error.message}`);
    
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      removeAuthToken();
    }
    
    return Promise.reject(error);
  }
);

export function setAuthToken(token) {
  authToken = token;
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export function removeAuthToken() {
  authToken = null;
  delete api.defaults.headers.common['Authorization'];
}

// Auth endpoints
export const login = (email, password) =>
  api.post('/auth/login', { email, password });

export const register = (userData) =>
  api.post('/auth/register', userData);

export const logout = () =>
  api.post('/auth/logout');

// Restaurants endpoints
export const getRestaurants = (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return api.get(`/restaurants${queryString ? `?${queryString}` : ''}`);
};

export const getRestaurant = (id) =>
  api.get(`/restaurants/${id}`);

export const getRestaurantProducts = (restaurantId) =>
  api.get(`/restaurants/${restaurantId}/products`);

// Products endpoints
export const getProducts = (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return api.get(`/products${queryString ? `?${queryString}` : ''}`);
};

export const getProduct = (id) =>
  api.get(`/products/${id}`);

// Search endpoints - Múltiplas estratégias de busca
export const searchProducts = async (query, options = {}) => {
  const searchParams = {
    q: query,
    search: query,
    query: query,
    ...options
  };
  
  // Tentar diferentes endpoints de busca
  const searchEndpoints = [
    `/products/search`,
    `/search/products`,
    `/search`,
  ];
  
  for (const endpoint of searchEndpoints) {
    try {
      console.log(`🔍 Tentando busca em: ${endpoint}`);
      const response = await api.get(endpoint, { params: searchParams });
      
      if (response.data && (response.data.data || response.data.length > 0)) {
        console.log(`✅ Busca bem-sucedida em: ${endpoint}`);
        return response;
      }
    } catch (error) {
      console.log(`❌ Falha na busca em ${endpoint}:`, error.response?.status);
      continue;
    }
  }
  
  // Se nenhum endpoint específico funcionar, fazer busca manual
  console.log('🔄 Fazendo busca manual...');
  return performManualSearch(query);
};

// Busca manual como fallback
const performManualSearch = async (query) => {
  try {
    const [productsResponse, restaurantsResponse] = await Promise.all([
      getProducts().catch(() => ({ data: { data: [] } })),
      getRestaurants().catch(() => ({ data: { data: [] } }))
    ]);
    
    const products = productsResponse.data.data || [];
    const restaurants = restaurantsResponse.data.data || [];
    
    const queryLower = query.toLowerCase();
    
    // Buscar produtos
    const matchingProducts = products.filter(product => 
      product.name?.toLowerCase().includes(queryLower) ||
      product.description?.toLowerCase().includes(queryLower) ||
      product.category?.toLowerCase().includes(queryLower)
    );
    
    // Buscar restaurantes e seus produtos
    const matchingRestaurants = restaurants.filter(restaurant =>
      restaurant.name?.toLowerCase().includes(queryLower) ||
      restaurant.category?.toLowerCase().includes(queryLower) ||
      restaurant.description?.toLowerCase().includes(queryLower)
    );
    
    // Buscar produtos de restaurantes específicos
    let restaurantProducts = [];
    for (const restaurant of restaurants.slice(0, 10)) { // Limitar para performance
      try {
        const productsResponse = await getRestaurantProducts(restaurant.id);
        if (productsResponse?.data?.data) {
          const matchingRestaurantProducts = productsResponse.data.data
            .filter(product =>
              product.name?.toLowerCase().includes(queryLower) ||
              product.description?.toLowerCase().includes(queryLower)
            )
            .map(product => ({
              ...product,
              restaurant: restaurant
            }));
          
          restaurantProducts = [...restaurantProducts, ...matchingRestaurantProducts];
        }
      } catch (error) {
        console.log(`Erro ao buscar produtos do restaurante ${restaurant.id}:`, error);
      }
    }
    
    // Combinar todos os resultados
    const allResults = [
      ...matchingProducts,
      ...matchingRestaurants.map(r => ({ ...r, type: 'restaurant' })),
      ...restaurantProducts
    ];
    
    // Remover duplicatas baseado no ID
    const uniqueResults = allResults.filter((item, index, self) => 
      index === self.findIndex(t => t.id === item.id && t.type === item.type)
    );
    
    console.log(`🔍 Busca manual retornou ${uniqueResults.length} resultados`);
    
    return {
      data: {
        data: uniqueResults,
        total: uniqueResults.length,
        query: query
      }
    };
    
  } catch (error) {
    console.log('❌ Erro na busca manual:', error);
    throw error;
  }
};

// Busca avançada com filtros
export const advancedSearch = async (searchParams) => {
  const {
    query,
    category,
    restaurant_id,
    min_price,
    max_price,
    sort_by = 'relevance',
    limit = 20,
    offset = 0
  } = searchParams;
  
  try {
    return await api.get('/search/advanced', {
      params: {
        q: query,
        category,
        restaurant_id,
        min_price,
        max_price,
        sort_by,
        limit,
        offset
      }
    });
  } catch (error) {
    // Fallback para busca simples
    return searchProducts(query);
  }
};

// Busca por categoria
export const searchByCategory = async (categoryId) => {
  try {
    return await api.get(`/categories/${categoryId}/products`);
  } catch (error) {
    // Fallback: buscar produtos e filtrar por categoria
    const products = await getProducts();
    const filteredProducts = products.data.data.filter(
      product => product.category_id === categoryId
    );
    
    return {
      data: {
        data: filteredProducts
      }
    };
  }
};

// Suggestions/autocomplete
export const getSearchSuggestions = async (query) => {
  if (!query || query.length < 2) return { data: { data: [] } };
  
  try {
    return await api.get('/search/suggestions', {
      params: { q: query }
    });
  } catch (error) {
    // Fallback: gerar sugestões baseadas em dados existentes
    const [products, restaurants] = await Promise.all([
      getProducts().catch(() => ({ data: { data: [] } })),
      getRestaurants().catch(() => ({ data: { data: [] } }))
    ]);
    
    const queryLower = query.toLowerCase();
    const suggestions = [];
    
    // Sugestões de produtos
    products.data.data.forEach(product => {
      if (product.name.toLowerCase().includes(queryLower)) {
        suggestions.push({
          type: 'product',
          text: product.name,
          id: product.id
        });
      }
    });
    
    // Sugestões de restaurantes
    restaurants.data.data.forEach(restaurant => {
      if (restaurant.name.toLowerCase().includes(queryLower)) {
        suggestions.push({
          type: 'restaurant',
          text: restaurant.name,
          id: restaurant.id
        });
      }
    });
    
    return {
      data: {
        data: suggestions.slice(0, 8) // Limitar a 8 sugestões
      }
    };
  }
};

// Orders endpoints
export const createOrder = (orderData) =>
  api.post('/orders', orderData);

export const getMyOrders = () =>
  api.get('/orders');

export const getOrder = (id) =>
  api.get(`/orders/${id}`);

export const updateOrderStatus = (id, status) =>
  api.patch(`/orders/${id}/status`, { status });

// Categories endpoints
export const getCategories = () =>
  api.get('/categories');

export const getCategory = (id) =>
  api.get(`/categories/${id}`);

// User/Profile endpoints
export const getProfile = () =>
  api.get('/user/profile');

export const updateProfile = (userData) =>
  api.put('/user/profile', userData);

export const updatePassword = (passwordData) =>
  api.put('/user/password', passwordData);

// Address endpoints
export const getAddresses = () =>
  api.get('/user/addresses');

export const createAddress = (addressData) =>
  api.post('/user/addresses', addressData);

export const updateAddress = (id, addressData) =>
  api.put(`/user/addresses/${id}`, addressData);

export const deleteAddress = (id) =>
  api.delete(`/user/addresses/${id}`);

// Favorites endpoints
export const getFavorites = () =>
  api.get('/user/favorites');

export const addToFavorites = (restaurantId) =>
  api.post('/user/favorites', { restaurant_id: restaurantId });

export const removeFromFavorites = (restaurantId) =>
  api.delete(`/user/favorites/${restaurantId}`);

// Reviews endpoints
export const getRestaurantReviews = (restaurantId) =>
  api.get(`/restaurants/${restaurantId}/reviews`);

export const createReview = (reviewData) =>
  api.post('/reviews', reviewData);

// Notifications endpoints
export const getNotifications = () =>
  api.get('/notifications');

export const markNotificationAsRead = (id) =>
  api.patch(`/notifications/${id}/read`);

// Analytics/Tracking (opcional)
export const trackSearch = (query, resultsCount) =>
  api.post('/analytics/search', { 
    query, 
    results_count: resultsCount,
    timestamp: new Date().toISOString()
  }).catch(() => {}); // Falhar silenciosamente

export const trackProductView = (productId) =>
  api.post('/analytics/product-view', { 
    product_id: productId,
    timestamp: new Date().toISOString()
  }).catch(() => {}); // Falhar silenciosamente


  // Payment endpoints
export const initiateMpesaPayment = (orderId, paymentData) =>
  api.post(`/orders/${orderId}/payment/mpesa`, paymentData);

export const initiateMolaPayment = (orderId, paymentData) =>
  api.post(`/orders/${orderId}/payment/emola`, paymentData);

export const confirmCashPayment = (orderId) =>
  api.post(`/orders/${orderId}/payment/cash`);

export const confirmPayment = (orderId, confirmationData) =>
  api.post(`/orders/${orderId}/payment/confirm`, confirmationData);

export const checkPaymentStatus = (orderId) =>
  api.get(`/orders/${orderId}/payment/status`);

// Order status endpoints
export const cancelOrder = (orderId, reason = '') =>
  api.patch(`/orders/${orderId}/cancel`, { reason });

export const getOrderDetails = (orderId) =>
  api.get(`/orders/${orderId}/details`);

// Order tracking endpoints
export const trackOrder = (orderId) =>
  api.get(`/orders/${orderId}/track`);

export const getOrderUpdates = (orderId) =>
  api.get(`/orders/${orderId}/updates`);

// Delivery endpoints
export const getDeliveryEstimate = (orderId) =>
  api.get(`/orders/${orderId}/delivery/estimate`);

export const contactDelivery = (orderId, message) =>
  api.post(`/orders/${orderId}/delivery/contact`, { message });


// Payment endpoints
export const getPaymentMethods = () =>
  api.get('/payment/methods');


export const registerPushToken = (token) =>
  api.post('/user/push-token', { token });

export const unregisterPushToken = () =>
  api.delete('/user/push-token');


export const markAllNotificationsAsRead = () =>
  api.patch('/notifications/mark-all-read');
// Helper function para debug
export const testConnection = async () => {
  try {
    const response = await api.get('/health');
    console.log('✅ Conexão com API funcionando:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Erro de conexão com API:', error.message);
    return false;
  }
};

// Função para limpar cache (se usando)
export const clearCache = () => {
  // Implementar lógica de limpeza de cache se necessário
  console.log('🧹 Cache limpo');
};

export default api;