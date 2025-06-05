
// src/services/api.js - Versão com melhor tratamento de erros
import axios from 'axios';

const API_BASE_URL = 'http://192.168.100.6:2021/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
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

// Interceptor melhorado para respostas
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  (error) => {
    console.log(`❌ API Error: ${error.config?.url} - ${error.message}`);
    
    // Log detalhado do erro 500
    if (error.response?.status === 500) {
      console.log('🔍 Erro 500 detalhes:', {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data,
        headers: error.config?.headers,
        response: error.response?.data
      });
    }
    
    if (error.response?.status === 401) {
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

// APIs com tratamento melhorado
export const getRestaurants = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/restaurants${queryString ? `?${queryString}` : ''}`);
    return response;
  } catch (error) {
    console.log('❌ Erro ao buscar restaurantes:', error.response?.data || error.message);
    throw error;
  }
};

// Categories endpoints
export const getCategories = async () => {
  try {
    const response = await api.get('/categories');
    return response;
  } catch (error) {
    console.log('❌ Erro ao buscar categorias:', error.response?.data || error.message);
    throw error;
  }
};


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

export const getProduct = (id) => api.get(`/products/${id}`);
export const getRestaurant = (id) => api.get(`/restaurants/${id}`);
export const getRestaurantProducts = (restaurantId) => api.get(`/restaurants/${restaurantId}/products`);

// Products endpoints
export const getProducts = (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return api.get(`/products${queryString ? `?${queryString}` : ''}`);
};

// Auth
export const login = (email, password) => api.post('/auth/login', { email, password });
export const register = (userData) => api.post('/auth/register', userData);

// Orders
export const createOrder = (orderData) => api.post('/orders', orderData);
export const getMyOrders = () => api.get('/orders');
export const getOrder = (id) => api.get(`/orders/${id}`);

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
// Payment APIs (só adicionar se não existirem)
export const initiateMpesaPayment = (orderId, paymentData) =>
  api.post(`/orders/${orderId}/payment/mpesa`, paymentData);

export const initiateMolaPayment = (orderId, paymentData) =>
  api.post(`/orders/${orderId}/payment/emola`, paymentData);

export const confirmCashPayment = (orderId) =>
  api.post(`/orders/${orderId}/payment/cash`);

export const checkPaymentStatus = (orderId) =>
  api.get(`/orders/${orderId}/payment/status`);

// Push Notifications APIs (só adicionar se não existirem)
export const registerPushToken = (token) =>
  api.post('/user/push-token', { token });

export const unregisterPushToken = () =>
  api.delete('/user/push-token');

export const getNotifications = () =>
  api.get('/notifications');

export const markNotificationAsRead = (notificationId) =>
  api.patch(`/notifications/${notificationId}/read`);

export const markAllNotificationsAsRead = () =>
  api.patch('/notifications/mark-all-read');



export const savePushToken = async (pushToken) => {
  const response = await api.post('/user/push-token', {
    push_token: pushToken,
    platform: Platform.OS
  });
  return response;
};

export const getOrderDetails = async (orderId) => {
  try {
    const response = await api.get(`/orders/${orderId}`);
    return response;
  } catch (error) {
    console.error('Erro ao obter detalhes do pedido:', error);
    throw error;
  }
};

// Função para atualizar status do pedido (para admin/restaurante)
export const updateOrderStatus = async (orderId, status) => {
  try {
    const response = await api.put(`/orders/${orderId}/status`, {
      status: status
    });
    return response;
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    throw error;
  }
};

// Função para cancelar pedido
export const cancelOrder = async (orderId, reason = '') => {
  try {
    const response = await api.post(`/orders/${orderId}/cancel`, {
      reason: reason
    });
    return response;
  } catch (error) {
    console.error('Erro ao cancelar pedido:', error);
    throw error;
  }
};

// Opção 2: Se você só tem a lista de pedidos (substitua 'orders' pelo seu endpoint)
export const getOrderDetailsFromList = async (orderId) => {
  try {
    // Substitua '/orders' pelo seu endpoint de listagem
    // Exemplos comuns: '/user/orders', '/orders', '/my-orders', '/user-orders'
    const response = await api.get('/orders'); // ← AJUSTE AQUI PARA SEU ENDPOINT
    
    const orders = response.data?.data?.data || response.data?.data || response.data || [];
    const order = orders.find(o => o.id == orderId);
    
    if (!order) {
      throw new Error('Pedido não encontrado');
    }
    
    return { data: order };
  } catch (error) {
    console.error('Erro ao obter detalhes do pedido:', error);
    throw error;
  }



  
};


export default api;