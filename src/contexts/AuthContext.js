// src/contexts/AuthContext.js - Versão melhorada
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
      console.log('🔍 Carregando usuário salvo...');
      const storedUser = await AsyncStorage.getItem('@deliveryapp:user');
      const storedToken = await AsyncStorage.getItem('@deliveryapp:token');
      
      console.log('📱 Dados encontrados:', {
        user: !!storedUser,
        token: !!storedToken
      });
      
      if (storedUser && storedToken) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        api.setAuthToken(storedToken);
        console.log('✅ Usuário restaurado:', userData.name);
      } else {
        console.log('ℹ️ Nenhum usuário salvo');
      }
    } catch (error) {
      console.log('❌ Erro ao carregar usuário:', error);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email, password) {
    try {
      console.log('🔑 Fazendo login para:', email);
      const response = await api.login(email, password);
      
      // Verificar se a resposta tem a estrutura correta do Laravel
      if (response.data.status === 'success' && response.data.data) {
        const { user, access_token } = response.data.data;
        
        await AsyncStorage.setItem('@deliveryapp:user', JSON.stringify(user));
        await AsyncStorage.setItem('@deliveryapp:token', access_token);
        
        api.setAuthToken(access_token);
        setUser(user);
        
        console.log('✅ Login realizado:', user.name);
        return { success: true };
      } else {
        console.log('❌ Resposta de login inválida:', response.data);
        return { 
          success: false, 
          error: response.data.message || 'Erro ao fazer login' 
        };
      }
    } catch (error) {
      console.log('❌ Erro no login:', error.response?.data);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao fazer login' 
      };
    }
  }

  async function signUp(userData) {
    try {
      console.log('📝 Criando conta...');
      const response = await api.register(userData);
      
      // Verificar se o registro foi bem-sucedido
      if (response.data.status === 'success') {
        console.log('✅ Conta criada com sucesso');
        return { success: true, data: response.data };
      } else {
        console.log('❌ Erro no registro:', response.data);
        return { 
          success: false, 
          error: response.data.message || 'Erro ao criar conta' 
        };
      }
    } catch (error) {
      console.log('❌ Erro no registro:', error.response?.data);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao criar conta' 
      };
    }
  }

  // FUNÇÃO DE LOGOUT MELHORADA COM LOGS
  async function signOut() {
    console.log('🚪 === INICIANDO LOGOUT ===');
    console.log('👤 Usuário antes do logout:', user?.name || 'null');
    
    try {
      // 1. Verificar o que temos no storage antes
      const userBefore = await AsyncStorage.getItem('@deliveryapp:user');
      const tokenBefore = await AsyncStorage.getItem('@deliveryapp:token');
      console.log('📱 Storage antes:', {
        user: !!userBefore,
        token: !!tokenBefore
      });

      // 2. Tentar fazer logout no backend (opcional)
      try {
        console.log('🌐 Tentando logout no backend...');
        await api.logout();
        console.log('✅ Logout no backend OK');
      } catch (backendError) {
        console.log('⚠️ Falha no backend (continuando):', backendError.message);
        // Continuar mesmo se backend falhar
      }

      // 3. Limpar AsyncStorage (CRÍTICO)
      console.log('🧹 Limpando storage...');
      await AsyncStorage.removeItem('@deliveryapp:user');
      await AsyncStorage.removeItem('@deliveryapp:token');
      console.log('✅ Storage limpo');

      // 4. Verificar se realmente foi limpo
      const userAfter = await AsyncStorage.getItem('@deliveryapp:user');
      const tokenAfter = await AsyncStorage.getItem('@deliveryapp:token');
      console.log('📱 Storage depois:', {
        user: userAfter ? '❌ AINDA EXISTE' : '✅ Removido',
        token: tokenAfter ? '❌ AINDA EXISTE' : '✅ Removido'
      });

      // 5. Remover token da API
      console.log('🔑 Removendo token da API...');
      api.removeAuthToken();
      console.log('✅ Token removido da API');

      // 6. Limpar estado do React (CRÍTICO)
      console.log('⚡ Atualizando estado...');
      setUser(null);
      console.log('✅ Estado atualizado');

      // 7. Verificação final
      console.log('🔍 Verificação final:');
      console.log('   Estado user:', user);
      console.log('   Deve ser null após re-render');

      console.log('🎉 === LOGOUT CONCLUÍDO ===');
      return { success: true };

    } catch (error) {
      console.log('❌ === ERRO NO LOGOUT ===');
      console.log('Erro:', error);
      
      // LOGOUT FORÇADO em caso de erro
      try {
        console.log('🔧 Tentando logout forçado...');
        await AsyncStorage.multiRemove(['@deliveryapp:user', '@deliveryapp:token']);
        api.removeAuthToken();
        setUser(null);
        console.log('✅ Logout forçado realizado');
        return { success: true };
      } catch (forceError) {
        console.log('❌ Falha no logout forçado:', forceError);
        return { success: false, error: 'Erro ao fazer logout' };
      }
    }
  }

  // FUNÇÃO DE DEBUG (adicionar temporariamente)
  async function debugAuth() {
    console.log('🔍 === DEBUG AUTH ===');
    
    try {
      // Estado atual
      console.log('Estado atual:');
      console.log('  user:', user?.name || 'null');
      console.log('  loading:', loading);
      
      // AsyncStorage
      const storedUser = await AsyncStorage.getItem('@deliveryapp:user');
      const storedToken = await AsyncStorage.getItem('@deliveryapp:token');
      console.log('AsyncStorage:');
      console.log('  user:', storedUser ? 'Existe' : 'null');
      console.log('  token:', storedToken ? 'Existe' : 'null');
      
      // Todas as chaves
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('Todas as chaves:', allKeys);
      
    } catch (error) {
      console.log('Erro no debug:', error);
    }
    
    console.log('🔍 === FIM DEBUG ===');
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signOut,
      debugAuth, // Adicionar temporariamente
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
