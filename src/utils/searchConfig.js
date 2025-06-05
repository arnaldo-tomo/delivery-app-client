// src/utils/searchConfig.js
import * as api from '../services/api';

// Configurações de busca
export const SEARCH_CONFIG = {
  // Timeout para busca (em ms)
  TIMEOUT: 5000,
  
  // Número mínimo de caracteres para buscar
  MIN_SEARCH_LENGTH: 2,
  
  // Delay para busca automática enquanto digita (debounce)
  SEARCH_DELAY: 500,
  
  // Número máximo de resultados por página
  MAX_RESULTS_PER_PAGE: 20,
  
  // Endpoints de busca para tentar (em ordem de preferência)
  SEARCH_ENDPOINTS: [
    '/products/search',
    '/search/products', 
    '/search',
    '/api/search',
    '/v1/search'
  ],
  
  // Campos de busca para produtos
  PRODUCT_SEARCH_FIELDS: ['name', 'description', 'category'],
  
  // Campos de busca para restaurantes  
  RESTAURANT_SEARCH_FIELDS: ['name', 'category', 'description', 'cuisine_type'],
  
  // Pesos para ordenação por relevância
  RELEVANCE_WEIGHTS: {
    exact_match: 100,
    starts_with: 50,
    contains: 25,
    description_match: 10
  }
};

// Função para testar conectividade da API
export const testAPIConnection = async () => {
  console.log('🔍 Testando conexão com API...');
  
  try {
    // Testar endpoint básico
    await api.testConnection();
    
    // Testar endpoints principais
    const tests = [
      { name: 'Restaurantes', fn: () => api.getRestaurants() },
      { name: 'Produtos', fn: () => api.getProducts() },
      { name: 'Categorias', fn: () => api.getCategories() },
    ];
    
    const results = {};
    
    for (const test of tests) {
      try {
        const response = await test.fn();
        results[test.name] = {
          success: true,
          count: response.data?.data?.length || 0
        };
        console.log(`✅ ${test.name}: ${results[test.name].count} items`);
      } catch (error) {
        results[test.name] = {
          success: false,
          error: error.message
        };
        console.log(`❌ ${test.name}: ${error.message}`);
      }
    }
    
    return results;
    
  } catch (error) {
    console.log('❌ Erro geral na API:', error.message);
    return { error: error.message };
  }
};

// Função para testar busca
export const testSearchFunctionality = async () => {
  console.log('🔍 Testando funcionalidade de busca...');
  
  const testQueries = ['pizza', 'hamburguer', 'frango', 'bebida'];
  const results = {};
  
  for (const query of testQueries) {
    try {
      console.log(`Testando busca por: "${query}"`);
      const response = await api.searchProducts(query);
      
      results[query] = {
        success: true,
        count: response.data?.data?.length || 0,
        results: response.data?.data?.slice(0, 3) || [] // Primeiros 3 resultados
      };
      
      console.log(`✅ "${query}": ${results[query].count} resultados`);
      
    } catch (error) {
      results[query] = {
        success: false,
        error: error.message
      };
      console.log(`❌ "${query}": ${error.message}`);
    }
  }
  
  return results;
};

// Função para calcular relevância de busca
export const calculateSearchRelevance = (item, query) => {
  const queryLower = query.toLowerCase();
  let score = 0;
  
  // Verificar nome
  if (item.name) {
    const nameLower = item.name.toLowerCase();
    if (nameLower === queryLower) {
      score += SEARCH_CONFIG.RELEVANCE_WEIGHTS.exact_match;
    } else if (nameLower.startsWith(queryLower)) {
      score += SEARCH_CONFIG.RELEVANCE_WEIGHTS.starts_with;
    } else if (nameLower.includes(queryLower)) {
      score += SEARCH_CONFIG.RELEVANCE_WEIGHTS.contains;
    }
  }
  
  // Verificar descrição
  if (item.description) {
    const descLower = item.description.toLowerCase();
    if (descLower.includes(queryLower)) {
      score += SEARCH_CONFIG.RELEVANCE_WEIGHTS.description_match;
    }
  }
  
  // Verificar categoria
  if (item.category) {
    const categoryLower = item.category.toLowerCase();
    if (categoryLower.includes(queryLower)) {
      score += SEARCH_CONFIG.RELEVANCE_WEIGHTS.contains;
    }
  }
  
  return score;
};

// Função para ordenar resultados por relevância
export const sortByRelevance = (results, query) => {
  return results
    .map(item => ({
      ...item,
      relevanceScore: calculateSearchRelevance(item, query)
    }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .map(({ relevanceScore, ...item }) => item); // Remover score do resultado final
};

// Função para detectar endpoints disponíveis
export const detectAvailableEndpoints = async () => {
  console.log('🔍 Detectando endpoints de busca disponíveis...');
  
  const availableEndpoints = [];
  
  for (const endpoint of SEARCH_CONFIG.SEARCH_ENDPOINTS) {
    try {
      // Fazer uma busca simples para testar
      const response = await api.searchProducts('test', { endpoint });
      
      if (response.status === 200) {
        availableEndpoints.push({
          endpoint,
          available: true,
          responseFormat: response.data
        });
        console.log(`✅ Endpoint disponível: ${endpoint}`);
      }
      
    } catch (error) {
      availableEndpoints.push({
        endpoint,
        available: false,
        error: error.response?.status || error.message
      });
      console.log(`❌ Endpoint indisponível: ${endpoint} - ${error.message}`);
    }
  }
  
  return availableEndpoints;
};

// Função para limpar e normalizar query de busca
export const normalizeSearchQuery = (query) => {
  if (!query) return '';
  
  return query
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/gi, '') // Remover caracteres especiais
    .replace(/\s+/g, ' '); // Normalizar espaços
};

// Função para gerar sugestões de busca
export const generateSearchSuggestions = (query, allData) => {
  if (!query || query.length < SEARCH_CONFIG.MIN_SEARCH_LENGTH) {
    return [];
  }
  
  const queryLower = query.toLowerCase();
  const suggestions = new Set();
  
  // Sugestões baseadas em produtos
  allData.products?.forEach(product => {
    if (product.name?.toLowerCase().includes(queryLower)) {
      suggestions.add(product.name);
    }
  });
  
  // Sugestões baseadas em restaurantes
  allData.restaurants?.forEach(restaurant => {
    if (restaurant.name?.toLowerCase().includes(queryLower)) {
      suggestions.add(restaurant.name);
    }
  });
  
  // Sugestões baseadas em categorias
  allData.categories?.forEach(category => {
    if (category.name?.toLowerCase().includes(queryLower)) {
      suggestions.add(category.name);
    }
  });
  
  return Array.from(suggestions).slice(0, 8);
};

// Função de debug para busca
export const debugSearch = async (query) => {
  console.log(`🐛 Debug da busca para: "${query}"`);
  
  const startTime = Date.now();
  
  try {
    // Testar busca normal
    const result = await api.searchProducts(query);
    const endTime = Date.now();
    
    console.log('📊 Resultados do debug:');
    console.log(`⏱️  Tempo de resposta: ${endTime - startTime}ms`);
    console.log(`📝 Query original: "${query}"`);
    console.log(`📝 Query normalizada: "${normalizeSearchQuery(query)}"`);
    console.log(`🔢 Número de resultados: ${result.data?.data?.length || 0}`);
    console.log(`📋 Dados retornados:`, result.data);
    
    return {
      success: true,
      responseTime: endTime - startTime,
      query: query,
      normalizedQuery: normalizeSearchQuery(query),
      resultCount: result.data?.data?.length || 0,
      results: result.data?.data || []
    };
    
  } catch (error) {
    const endTime = Date.now();
    
    console.log('❌ Erro no debug da busca:');
    console.log(`⏱️  Tempo até erro: ${endTime - startTime}ms`);
    console.log(`🐛 Erro:`, error.message);
    console.log(`📡 Status:`, error.response?.status);
    console.log(`📋 Resposta:`, error.response?.data);
    
    return {
      success: false,
      responseTime: endTime - startTime,
      query: query,
      error: error.message,
      status: error.response?.status,
      response: error.response?.data
    };
  }
};

// Função para executar diagnóstico completo
export const runSearchDiagnostic = async () => {
  console.log('🏥 Executando diagnóstico completo da busca...');
  
  const diagnostic = {
    timestamp: new Date().toISOString(),
    tests: {}
  };
  
  // Teste 1: Conexão com API
  console.log('1️⃣ Testando conexão...');
  diagnostic.tests.connection = await testAPIConnection();
  
  // Teste 2: Endpoints disponíveis
  console.log('2️⃣ Detectando endpoints...');
  diagnostic.tests.endpoints = await detectAvailableEndpoints();
  
  // Teste 3: Funcionalidade de busca
  console.log('3️⃣ Testando busca...');
  diagnostic.tests.search = await testSearchFunctionality();
  
  // Teste 4: Debug de queries específicas
  console.log('4️⃣ Debug de queries...');
  diagnostic.tests.debug = {};
  
  const debugQueries = ['a', 'pizza', 'restaurante inexistente'];
  for (const query of debugQueries) {
    diagnostic.tests.debug[query] = await debugSearch(query);
  }
  
  console.log('✅ Diagnóstico completo:', diagnostic);
  return diagnostic;
};

export default {
  SEARCH_CONFIG,
  testAPIConnection,
  testSearchFunctionality,
  calculateSearchRelevance,
  sortByRelevance,
  detectAvailableEndpoints,
  normalizeSearchQuery,
  generateSearchSuggestions,
  debugSearch,
  runSearchDiagnostic
};