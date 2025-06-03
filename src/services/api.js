import axios from 'axios';

const API_BASE_URL = 'http://192.168.100.6:2021/api/v1'; // Altere para sua URL da API

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

let authToken = null;

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

// Restaurants endpoints  
export const getRestaurants = () => 
  api.get('/restaurants');

export const getRestaurant = (id) => 
  api.get(`/restaurants/${id}`);

export const getRestaurantProducts = (restaurantId) => 
  api.get(`/restaurants/${restaurantId}/products`);

// Products endpoints
export const getProducts = () => 
  api.get('/products');

export const getProduct = (id) => 
  api.get(`/products/${id}`);

export const searchProducts = (query) => 
  api.get(`/products/search?q=${query}`);

// Orders endpoints
export const createOrder = (orderData) => 
  api.post('/orders', orderData);

export const getMyOrders = () => 
  api.get('/orders/my-orders');

export const getOrder = (id) => 
  api.get(`/orders/${id}`);

// Categories endpoints
export const getCategories = () => 
  api.get('/categories');

export default api;