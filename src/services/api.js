// src/services/api.js - Versão corrigida
import axios from 'axios';
import { Platform } from 'react-native';

// ALTERE AQUI para o IP do seu computador/servidor
const API_BASE_URL = 'http://192.168.58.104:8000/api/v1';

console.log('🌐 API Base URL configurada para:', API_BASE_URL);

// Criar instância do axios com configurações padrão
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 segundos
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
    console.log('📝 Request data:', config.data);
    
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
    console.log('📦 Response data:', response.data);
    return response;
  },
  (error) => {
    console.log(`❌ API Error: ${error.config?.url}`);
    console.log('🔍 Error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      code: error.code
    });
    
    // Token expirado ou inválido
    if (error.response?.status === 401) {
      console.log('🔑 Token inválido - removendo...');
      removeAuthToken();
    }
    
    return Promise.reject(error);
  }
);

// Funções de gerenciamento de token
export function setAuthToken(token) {
  console.log('🔐 Definindo token de autenticação');
  authToken = token;
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export function removeAuthToken() {
  console.log('🗑️ Removendo token de autenticação');
  authToken = null;
  delete api.defaults.headers.common['Authorization'];
}

// ===== AUTH ENDPOINTS =====
export const login = (email, password) => {
  console.log('🔓 Tentando fazer login...');
  return api.post('/auth/login', { email, password });
};

export const register = (userData) => {
  console.log('📝 Tentando registrar usuário...');
  return api.post('/auth/register', userData);
};

export const logout = () => {
  console.log('🚪 Fazendo logout...');
  return api.post('/auth/logout');
};

// ===== RESTAURANT ENDPOINTS =====
export const getRestaurants = async (params = {}) => {
  try {
    console.log('🏪 Buscando restaurantes...');
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/restaurants${queryString ? `?${queryString}` : ''}`);
    return response;
  } catch (error) {
    console.log('❌ Erro ao buscar restaurantes:', error.response?.data || error.message);
    throw error;
  }
};

export const getRestaurant = (id) => {
  console.log('🏪 Buscando restaurante:', id);
  return api.get(`/restaurants/${id}`);
};

export const getRestaurantProducts = (restaurantId) => {
  console.log('🍕 Buscando produtos do restaurante:', restaurantId);
  return api.get(`/restaurants/${restaurantId}/products`);
};

// ===== PRODUCT ENDPOINTS =====
export const getProducts = async (params = {}) => {
  try {
    console.log('🛒 Buscando produtos...');
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/products${queryString ? `?${queryString}` : ''}`);
    return response;
  } catch (error) {
    console.log('❌ Erro ao buscar produtos:', error.response?.data || error.message);
    throw error;
  }
};

export const getProduct = (id) => {
  console.log('🛒 Buscando produto:', id);
  return api.get(`/products/${id}`);
};

// ===== CATEGORY ENDPOINTS =====
export const getCategories = async () => {
  try {
    console.log('📂 Buscando categorias...');
    const response = await api.get('/categories');
    return response;
  } catch (error) {
    console.log('❌ Erro ao buscar categorias:', error.response?.data || error.message);
    throw error;
  }
};

export const getCategory = (id) => {
  console.log('📂 Buscando categoria:', id);
  return api.get(`/categories/${id}`);
};

// ===== ORDER ENDPOINTS =====
export const createOrder = async (orderData) => {
  try {
    console.log('📦 Criando pedido...');
    console.log('📝 Dados do pedido:', orderData);
    
    const response = await api.post('/orders', orderData);
    console.log('✅ Pedido criado com sucesso:', response.data);
    
    return response;
  } catch (error) {
    console.log('❌ Erro ao criar pedido:', error.response?.data || error.message);
    console.log('🔍 Error completo:', error);
    throw error;
  }
};

export const getMyOrders = async () => {
  try {
    console.log('📋 Buscando meus pedidos...');
    const response = await api.get('/orders');
    return response;
  } catch (error) {
    console.log('❌ Erro ao buscar pedidos:', error.response?.data || error.message);
    throw error;
  }
};

export const getOrder = (id) => {
  console.log('📦 Buscando pedido:', id);
  return api.get(`/orders/${id}`);
};

export const cancelOrder = (orderId, reason = '') => {
  console.log('❌ Cancelando pedido:', orderId);
  return api.patch(`/orders/${orderId}/cancel`, { reason });
};

export const trackOrder = (orderId) => {
  console.log('🔍 Rastreando pedido:', orderId);
  return api.get(`/orders/${orderId}/track`);
};

// ===== PAYMENT ENDPOINTS =====
export const initiateMpesaPayment = async (orderId, paymentData) => {
  try {
    console.log('💳 Iniciando pagamento M-Pesa para pedido:', orderId);
    const response = await api.post(`/orders/${orderId}/payment/mpesa`, paymentData);
    console.log('✅ Pagamento M-Pesa iniciado:', response.data);
    return response;
  } catch (error) {
    console.log('❌ Erro no pagamento M-Pesa:', error.response?.data || error.message);
    throw error;
  }
};

export const initiateMolaPayment = async (orderId, paymentData) => {
  try {
    console.log('💳 Iniciando pagamento eMola para pedido:', orderId);
    const response = await api.post(`/orders/${orderId}/payment/emola`, paymentData);
    console.log('✅ Pagamento eMola iniciado:', response.data);
    return response;
  } catch (error) {
    console.log('❌ Erro no pagamento eMola:', error.response?.data || error.message);
    throw error;
  }
};

export const confirmCashPayment = async (orderId) => {
  try {
    console.log('💵 Confirmando pagamento em dinheiro para pedido:', orderId);
    const response = await api.post(`/orders/${orderId}/payment/cash`);
    console.log('✅ Pagamento em dinheiro confirmado:', response.data);
    return response;
  } catch (error) {
    console.log('❌ Erro no pagamento em dinheiro:', error.response?.data || error.message);
    throw error;
  }
};

export const confirmPayment = (orderId, confirmationData) => {
  console.log('✅ Confirmando pagamento para pedido:', orderId);
  return api.post(`/orders/${orderId}/payment/confirm`, confirmationData);
};

export const checkPaymentStatus = (orderId) => {
  console.log('🔍 Verificando status do pagamento:', orderId);
  return api.get(`/orders/${orderId}/payment/status`);
};

export const getPaymentMethods = async () => {
  try {
    console.log('💳 Buscando métodos de pagamento...');
    const response = await api.get('/payment/methods');
    return response;
  } catch (error) {
    console.log('❌ Erro ao buscar métodos de pagamento:', error.response?.data || error.message);
    throw error;
  }
};

// ===== SEARCH ENDPOINTS =====
export const searchProducts = async (query, options = {}) => {
  console.log('🔍 Buscando produtos:', query);
  
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
    
    // Filtrar produtos
    const filteredProducts = products.filter(product => 
      product.name.toLowerCase().includes(queryLower) ||
      product.description?.toLowerCase().includes(queryLower)
    );
    
    // Filtrar restaurantes
    const filteredRestaurants = restaurants.filter(restaurant =>
      restaurant.name.toLowerCase().includes(queryLower) ||
      restaurant.description?.toLowerCase().includes(queryLower)
    );
    
    return {
      data: {
        data: [...filteredProducts, ...filteredRestaurants]
      }
    };
  } catch (error) {
    console.log('❌ Erro na busca manual:', error);
    return { data: { data: [] } };
  }
};

// ===== USER/PROFILE ENDPOINTS =====
export const getProfile = () => {
  console.log('👤 Buscando perfil do usuário...');
  return api.get('/user/profile');
};

export const updateProfile = (userData) => {
  console.log('✏️ Atualizando perfil...');
  return api.put('/user/profile', userData);
};

export const updatePassword = (passwordData) => {
  console.log('🔒 Atualizando senha...');
  return api.put('/user/password', passwordData);
};

// ===== ADDRESS ENDPOINTS =====
export const getAddresses = () => {
  console.log('📍 Buscando endereços...');
  return api.get('/user/addresses');
};

export const createAddress = (addressData) => {
  console.log('📍 Criando endereço...');
  return api.post('/user/addresses', addressData);
};

export const updateAddress = (id, addressData) => {
  console.log('✏️ Atualizando endereço:', id);
  return api.put(`/user/addresses/${id}`, addressData);
};

export const deleteAddress = (id) => {
  console.log('🗑️ Removendo endereço:', id);
  return api.delete(`/user/addresses/${id}`);
};

// ===== NOTIFICATION ENDPOINTS =====
export const registerPushToken = async (pushToken) => {
  try {
    console.log('🔔 Registrando token push...');
    const response = await api.post('/user/push-token', {
      push_token: pushToken,
      platform: Platform.OS
    });
    return response;
  } catch (error) {
    console.log('❌ Erro ao registrar token push:', error.response?.data || error.message);
    throw error;
  }
};

export const getNotifications = () => {
  console.log('🔔 Buscando notificações...');
  return api.get('/notifications');
};

export const markNotificationAsRead = (id) => {
  console.log('✅ Marcando notificação como lida:', id);
  return api.patch(`/notifications/${id}/read`);
};

// ===== ORDER DETAILS ENDPOINTS =====
export const getOrderDetails = async (orderId) => {
  try {
    console.log('📦 Buscando detalhes do pedido:', orderId);
    const response = await api.get(`/orders/${orderId}`);
    console.log('✅ Detalhes do pedido obtidos:', response.data);
    return response;
  } catch (error) {
    console.log('❌ Erro ao obter detalhes do pedido:', error.response?.data || error.message);
    throw error;
  }
};

export const updateOrderStatus = async (orderId, status) => {
  try {
    console.log('🔄 Atualizando status do pedido:', orderId, 'para:', status);
    const response = await api.put(`/orders/${orderId}/status`, {
      status: status
    });
    return response;
  } catch (error) {
    console.log('❌ Erro ao atualizar status do pedido:', error.response?.data || error.message);
    throw error;
  }
};

// ===== UTILITY FUNCTIONS =====

// Função para testar conexão com a API
export const testConnection = async () => {
  try {
    console.log('🔍 Testando conexão com a API...');
    const response = await api.get('/health');
    console.log('✅ Conexão com API funcionando:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.log('❌ Erro de conexão com API:', error.message);
    return { success: false, error: error.message };
  }
};

// Função para debug - verificar status da API
export const debugAPI = () => {
  console.log('🔍 === DEBUG API ===');
  console.log('Base URL:', API_BASE_URL);
  console.log('Auth Token:', authToken ? 'Definido' : 'Não definido');
  console.log('Headers padrão:', api.defaults.headers.common);
  console.log('==================');
};

// Exportar instância do axios também (para casos especiais)
export { api as axiosInstance };

// Exportar como default para manter compatibilidade
export default api;