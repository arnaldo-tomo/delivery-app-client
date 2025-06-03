import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as api from '../services/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  async function loadStoredUser() {
    try {
      const storedUser = await AsyncStorage.getItem('@deliveryapp:user');
      const storedToken = await AsyncStorage.getItem('@deliveryapp:token');
      
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        api.setAuthToken(storedToken);
      }
    } catch (error) {
      console.log('Erro ao carregar usuário:', error);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email, password) {
    try {
      const response = await api.login(email, password);
      
      // Verificar se a resposta tem a estrutura correta do Laravel
      if (response.data.status === 'success' && response.data.data) {
        const { user, access_token } = response.data.data;
        
        await AsyncStorage.setItem('@deliveryapp:user', JSON.stringify(user));
        await AsyncStorage.setItem('@deliveryapp:token', access_token);
        
        api.setAuthToken(access_token);
        setUser(user);
        
        return { success: true };
      } else {
        return { 
          success: false, 
          error: response.data.message || 'Erro ao fazer login' 
        };
      }
    } catch (error) {
      console.log('Erro completo:', error.response?.data);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao fazer login' 
      };
    }
  }

  async function signUp(userData) {
    try {
      const response = await api.register(userData);
      
      // Verificar se o registro foi bem-sucedido
      if (response.data.status === 'success') {
        return { success: true, data: response.data };
      } else {
        return { 
          success: false, 
          error: response.data.message || 'Erro ao criar conta' 
        };
      }
    } catch (error) {
      console.log('Erro no registro:', error.response?.data);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao criar conta' 
      };
    }
  }

  async function signOut() {
    try {
      await AsyncStorage.removeItem('@deliveryapp:user');
      await AsyncStorage.removeItem('@deliveryapp:token');
      api.removeAuthToken();
      setUser(null);
    } catch (error) {
      console.log('Erro ao fazer logout:', error);
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}