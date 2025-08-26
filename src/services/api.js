import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// CONFIGURAÇÃO DA BASE URL - AJUSTE PARA SEU SERVIDOR
const API_BASE_URL ='http://192.168.58.104:8000/api/v1'; // Substitua pela sua URL
// this.baseURL = 'http://192.168.58.104:8000/api/v1'; // Substitua pela sua URL
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

let authToken = null;

// Interceptor para adicionar token automaticamente
api.interceptors.request.use(async (config) => {
  if (!authToken) {
    const token = await AsyncStorage.getItem('@deliveryapp:token');
    if (token) {
      authToken = token;
    }
  }
  
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  
  return config;
});

// Interceptor para tratar respostas
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('❌ API Error:', error.response?.data || error.message);
    
    // Token expirado - fazer logout
    if (error.response?.status === 401) {
      removeAuthToken();
      // Aqui você pode redirecionar para login se necessário
    }
    
    return Promise.reject(error);
  }
);

// === FUNÇÕES DE AUTENTICAÇÃO ===
export function setAuthToken(token) {
  authToken = token;
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export function removeAuthToken() {
  authToken = null;
  delete api.defaults.headers.common['Authorization'];
}

// === AUTH ENDPOINTS ===
export const login = (email, password) => 
  api.post('/auth/login', { email, password });

export const logout = () => 
  api.post('/auth/logout');

export const register = (userData) => 
  api.post('/auth/register', userData);

export const getProfile = () => 
  api.get('/auth/me');

// === PEDIDOS ENDPOINTS (PRINCIPAIS) ===

/**
 * Lista todos os pedidos do usuário
 * GET /api/v1/orders
 */
export const getMyOrders = (page = 1, perPage = 15) => 
  api.get('/orders', { params: { page, per_page: perPage } });

/**
 * Criar um novo pedido
 * POST /api/v1/orders
 */
export const createOrder = (orderData) => 
  api.post('/orders', orderData);

/**
 * Ver detalhes de um pedido específico
 * GET /api/v1/orders/{orderId}
 */
export const getOrderDetails = (orderId) => 
  api.get(`/orders/${orderId}`);

/**
 * Cancelar pedido
 * PATCH /api/v1/orders/{orderId}/cancel
 */
export const cancelOrder = (orderId, reason = '') => 
  api.patch(`/orders/${orderId}/cancel`, { reason });

/**
 * Rastrear pedido (informações de entrega em tempo real)
 * GET /api/v1/orders/{orderId}/track
 */
export const trackOrder = (orderId) => 
  api.get(`/orders/${orderId}/track`);

/**
 * Atualizar status do pedido (para admin/restaurante)
 * PUT /api/v1/orders/{orderId}/status
 */
export const updateOrderStatus = (orderId, status) => 
  api.put(`/orders/${orderId}/status`, { status });

// === PAGAMENTOS ENDPOINTS ===

/**
 * Iniciar pagamento M-Pesa
 * POST /api/v1/orders/{orderId}/payment/mpesa
 */
export const initiateMpesaPayment = (orderId, paymentData) =>
  api.post(`/orders/${orderId}/payment/mpesa`, paymentData);

/**
 * Iniciar pagamento eMola
 * POST /api/v1/orders/{orderId}/payment/emola
 */
export const initiateMolaPayment = (orderId, paymentData) =>
  api.post(`/orders/${orderId}/payment/emola`, paymentData);

/**
 * Confirmar pagamento em dinheiro
 * POST /api/v1/orders/{orderId}/payment/cash
 */
export const confirmCashPayment = (orderId) =>
  api.post(`/orders/${orderId}/payment/cash`);

/**
 * Confirmar pagamento (genérico)
 * POST /api/v1/orders/{orderId}/payment/confirm
 */
export const confirmPayment = (orderId, confirmationData) =>
  api.post(`/orders/${orderId}/payment/confirm`, confirmationData);

/**
 * Verificar status do pagamento
 * GET /api/v1/orders/{orderId}/payment/status
 */
export const checkPaymentStatus = (orderId) =>
  api.get(`/orders/${orderId}/payment/status`);

/**
 * Listar métodos de pagamento disponíveis
 * GET /api/v1/payment/methods
 */
export const getPaymentMethods = () =>
  api.get('/payment/methods');

// === RESTAURANTES ENDPOINTS ===

/**
 * Listar restaurantes
 * GET /api/v1/restaurants
 */
export const getRestaurants = (params = {}) => 
  api.get('/restaurants', { params });

/**
 * Obter detalhes de um restaurante
 * GET /api/v1/restaurants/{restaurantId}
 */
export const getRestaurant = (id) => 
  api.get(`/restaurants/${id}`);

/**
 * Buscar restaurantes
 * GET /api/v1/restaurants/search
 */
export const searchRestaurants = (query, params = {}) => 
  api.get('/restaurants/search', { params: { q: query, ...params } });

/**
 * Obter menu de um restaurante
 * GET /api/v1/restaurants/{restaurantId}/menu
 */
export const getRestaurantMenu = (restaurantId) => 
  api.get(`/restaurants/${restaurantId}/menu`);

/**
 * Obter produtos de um restaurante (alias)
 * GET /api/v1/restaurants/{restaurantId}/products
 */
export const getRestaurantProducts = (restaurantId) => 
  api.get(`/restaurants/${restaurantId}/products`);

/**
 * Restaurantes em destaque
 * GET /api/v1/restaurants/featured
 */
export const getFeaturedRestaurants = () => 
  api.get('/restaurants/featured');

/**
 * Restaurantes próximos
 * POST /api/v1/restaurants/nearby
 */
export const getNearbyRestaurants = (location) => 
  api.post('/restaurants/nearby', location);

// === CATEGORIAS ===

/**
 * Listar categorias
 * GET /api/v1/categories
 */
export const getCategories = () => 
  api.get('/categories');

// === USUÁRIO/PERFIL ENDPOINTS ===

/**
 * Salvar token de push notification
 * POST /api/v1/user/save-push-token
 */
export const savePushToken = (pushToken, platform = 'android') =>
  api.post('/user/save-push-token', {
    push_token: pushToken,
    platform: platform
  });

/**
 * Atualizar perfil
 * PATCH /api/v1/user/profile
 */
export const updateProfile = (userData) =>
  api.patch('/user/profile', userData);

/**
 * Listar endereços
 * GET /api/v1/user/addresses
 */
export const getAddresses = () =>
  api.get('/user/addresses');

/**
 * Adicionar endereço
 * POST /api/v1/user/addresses
 */
export const addAddress = (addressData) =>
  api.post('/user/addresses', addressData);

/**
 * Atualizar endereço
 * PUT /api/v1/user/addresses/{addressId}
 */
export const updateAddress = (addressId, addressData) =>
  api.put(`/user/addresses/${addressId}`, addressData);

/**
 * Remover endereço
 * DELETE /api/v1/user/addresses/{addressId}
 */
export const deleteAddress = (addressId) =>
  api.delete(`/user/addresses/${addressId}`);

// === ENTREGA (DELIVERY) ENDPOINTS ===

/**
 * Listar pedidos disponíveis para entrega
 * GET /api/v1/delivery/available-orders
 */
export const getAvailableDeliveryOrders = (page = 1) =>
  api.get('/delivery/available-orders', { params: { page } });

/**
 * Aceitar pedido para entrega
 * POST /api/v1/delivery/orders/{orderId}/accept
 */
export const acceptDeliveryOrder = (orderId) =>
  api.post(`/delivery/orders/${orderId}/accept`);

/**
 * Listar minhas entregas
 * GET /api/v1/delivery/my-deliveries
 */
export const getMyDeliveries = (page = 1) =>
  api.get('/delivery/my-deliveries', { params: { page } });

/**
 * Atualizar status de entrega
 * PATCH /api/v1/delivery/orders/{orderId}/status
 */
export const updateDeliveryStatus = (orderId, status, location = null) => {
  const data = { status };
  if (location) {
    data.latitude = location.latitude;
    data.longitude = location.longitude;
  }
  return api.patch(`/delivery/orders/${orderId}/status`, data);
};

/**
 * Atualizar localização do entregador
 * POST /api/v1/delivery/location
 */
export const updateDeliveryLocation = (location) =>
  api.post('/delivery/location', {
    latitude: location.latitude,
    longitude: location.longitude
  });

// === NOTIFICAÇÕES ===

/**
 * Listar notificações
 * GET /api/v1/notifications
 */
export const getNotifications = () =>
  api.get('/notifications');

/**
 * Marcar notificação como lida
 * PATCH /api/v1/notifications/{notificationId}/read
 */
export const markNotificationAsRead = (notificationId) =>
  api.patch(`/notifications/${notificationId}/read`);

/**
 * Marcar todas as notificações como lidas
 * PATCH /api/v1/notifications/mark-all-read
 */
export const markAllNotificationsAsRead = () =>
  api.patch('/notifications/mark-all-read');

// === FUNÇÕES DE DEBUG E TESTE ===

/**
 * Testar conexão com API
 * GET /api/v1/health
 */
export const testConnection = async () => {
  try {
    const response = await api.get('/health');
    console.log('✅ Conexão com API funcionando:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.log('❌ Erro de conexão com API:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Debug: verificar se token está configurado
 */
export const debugToken = async () => {
  const stored = await AsyncStorage.getItem('@deliveryapp:token');
  console.log('🔍 Debug Token:', {
    inMemory: !!authToken,
    inStorage: !!stored,
    tokenMatch: authToken === stored
  });
};

// === ALIASES PARA COMPATIBILIDADE ===
// (mantendo os nomes antigos que podem estar sendo usados)

export const getMyOrders_alias = getMyOrders;
export const getOrderDetails_alias = getOrderDetails;
export const getOrder = getOrderDetails; // Alias comum
export const createOrder_alias = createOrder;

// Exportar instância do axios para uso direto se necessário
export { api };

// Export default para compatibilidade
const apiService = {
  // Auth
  login,
  logout,
  register,
  getProfile,
  setAuthToken,
  removeAuthToken,
  
  // Orders
  getMyOrders,
  createOrder,
  getOrderDetails,
  cancelOrder,
  trackOrder,
  updateOrderStatus,
  
  // Payments
  initiateMpesaPayment,
  initiateMolaPayment,
  confirmCashPayment,
  confirmPayment,
  checkPaymentStatus,
  getPaymentMethods,
  
  // Restaurants
  getRestaurants,
  getRestaurant,
  searchRestaurants,
  getRestaurantMenu,
  getRestaurantProducts,
  getFeaturedRestaurants,
  getNearbyRestaurants,
  
  // Categories
  getCategories,
  
  // User
  savePushToken,
  updateProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  
  // Delivery
  getAvailableDeliveryOrders,
  acceptDeliveryOrder,
  getMyDeliveries,
  updateDeliveryStatus,
  updateDeliveryLocation,
  
  // Notifications
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  
  // Debug
  testConnection,
  debugToken
};

export default apiService;