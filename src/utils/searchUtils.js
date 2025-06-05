// src/utils/searchUtils.js

/**
 * Normaliza texto para busca (remove acentos, converte para minúscula)
 */
export function normalizeText(text) {
    if (!text) return '';
    
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s]/gi, '') // Remove caracteres especiais
      .trim();
  }
  
  /**
   * Calcula score de relevância para um item
   */
  export function calculateRelevanceScore(item, searchTerm, isRestaurant = false) {
    const normalizedQuery = normalizeText(searchTerm);
    let score = 0;
    
    if (isRestaurant) {
      // Score para restaurantes
      const name = normalizeText(item.name || '');
      const category = normalizeText(item.category || item.cuisine_type || '');
      const description = normalizeText(item.description || '');
      
      // Nome exato = maior score
      if (name === normalizedQuery) score += 100;
      else if (name.startsWith(normalizedQuery)) score += 80;
      else if (name.includes(normalizedQuery)) score += 60;
      
      // Categoria
      if (category.includes(normalizedQuery)) score += 40;
      
      // Descrição
      if (description.includes(normalizedQuery)) score += 20;
      
      // Bonus para rating alto
      if (item.rating && item.rating >= 4.5) score += 10;
      
    } else {
      // Score para produtos
      const name = normalizeText(item.name || '');
      const description = normalizeText(item.description || '');
      const category = normalizeText(item.category || '');
      const restaurantName = normalizeText(item.restaurant?.name || '');
      
      // Nome do produto
      if (name === normalizedQuery) score += 100;
      else if (name.startsWith(normalizedQuery)) score += 80;
      else if (name.includes(normalizedQuery)) score += 60;
      
      // Descrição
      if (description.includes(normalizedQuery)) score += 30;
      
      // Categoria do produto
      if (category.includes(normalizedQuery)) score += 25;
      
      // Nome do restaurante
      if (restaurantName.includes(normalizedQuery)) score += 15;
      
      // Bonus para produtos com desconto
      if (item.discount && item.discount > 0) score += 5;
      
      // Bonus para produtos disponíveis
      if (item.available !== false) score += 5;
    }
    
    return score;
  }
  
  /**
   * Ordena resultados por relevância
   */
  export function sortByRelevance(results, searchTerm) {
    return results
      .map(item => ({
        ...item,
        relevanceScore: calculateRelevanceScore(item, searchTerm, item.type === 'restaurant')
      }))
      .sort((a, b) => {
        // Primeiro por score de relevância
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
        
        // Depois por tipo (produtos primeiro)
        if (a.type !== b.type) {
          return a.type === 'product' ? -1 : 1;
        }
        
        // Por último por nome alfabético
        return (a.name || '').localeCompare(b.name || '');
      });
  }
  
  /**
   * Filtra resultados por disponibilidade e qualidade
   */
  export function filterQualityResults(results) {
    return results.filter(item => {
      // Para restaurantes
      if (item.type === 'restaurant') {
        return item.status !== 'closed' && item.name && item.name.trim() !== '';
      }
      
      // Para produtos
      return (
        item.available !== false &&
        item.name && 
        item.name.trim() !== '' &&
        item.price && 
        item.price > 0
      );
    });
  }
  
  /**
   * Agrupa resultados por categoria
   */
  export function groupResultsByType(results) {
    const grouped = {
      products: [],
      restaurants: [],
      featured: []
    };
    
    results.forEach(item => {
      if (item.type === 'restaurant') {
        grouped.restaurants.push(item);
      } else {
        grouped.products.push(item);
      }
      
      // Adiciona itens destacados (alta relevância)
      if (item.relevanceScore && item.relevanceScore >= 80) {
        grouped.featured.push(item);
      }
    });
    
    return grouped;
  }
  
  /**
   * Gera sugestões baseadas na busca
   */
  export function generateSearchSuggestions(query, allProducts, restaurants) {
    const suggestions = new Set();
    const normalizedQuery = normalizeText(query);
    
    if (normalizedQuery.length < 2) return [];
    
    // Sugestões de produtos
    allProducts.forEach(product => {
      const name = normalizeText(product.name || '');
      if (name.includes(normalizedQuery) && name !== normalizedQuery) {
        suggestions.add(product.name);
      }
    });
    
    // Sugestões de restaurantes
    restaurants.forEach(restaurant => {
      const name = normalizeText(restaurant.name || '');
      if (name.includes(normalizedQuery) && name !== normalizedQuery) {
        suggestions.add(restaurant.name);
      }
    });
    
    return Array.from(suggestions).slice(0, 5);
  }
  
  /**
   * Busca fuzzy (tolerante a erros de digitação)
   */
  export function fuzzySearch(query, items, field = 'name') {
    const normalizedQuery = normalizeText(query);
    
    if (normalizedQuery.length < 3) return [];
    
    return items.filter(item => {
      const text = normalizeText(item[field] || '');
      
      // Busca por subsequência
      let queryIndex = 0;
      for (let i = 0; i < text.length && queryIndex < normalizedQuery.length; i++) {
        if (text[i] === normalizedQuery[queryIndex]) {
          queryIndex++;
        }
      }
      
      // Se encontrou pelo menos 70% dos caracteres da busca
      return queryIndex / normalizedQuery.length >= 0.7;
    });
  }
  
  /**
   * Destaca texto da busca nos resultados
   */
  export function highlightSearchTerm(text, searchTerm) {
    if (!text || !searchTerm) return text;
    
    const normalizedText = text.toLowerCase();
    const normalizedTerm = searchTerm.toLowerCase();
    
    const index = normalizedText.indexOf(normalizedTerm);
    if (index === -1) return text;
    
    return {
      before: text.substring(0, index),
      highlight: text.substring(index, index + searchTerm.length),
      after: text.substring(index + searchTerm.length)
    };
  }
  
  /**
   * Cache simples para resultados de busca
   */
  class SearchCache {
    constructor(maxSize = 50) {
      this.cache = new Map();
      this.maxSize = maxSize;
    }
    
    get(key) {
      const item = this.cache.get(key);
      if (item) {
        // Move para o final (LRU)
        this.cache.delete(key);
        this.cache.set(key, item);
        return item;
      }
      return null;
    }
    
    set(key, value) {
      if (this.cache.size >= this.maxSize) {
        // Remove o mais antigo
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
      this.cache.set(key, value);
    }
    
    clear() {
      this.cache.clear();
    }
  }
  
  export const searchCache = new SearchCache();
  
  /**
   * Debounce para busca em tempo real
   */
  export function createSearchDebounce(callback, delay = 300) {
    let timeoutId;
    
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => callback.apply(this, args), delay);
    };
  }
  
  /**
   * Valida termo de busca
   */
  export function validateSearchTerm(term) {
    if (!term || typeof term !== 'string') return false;
    
    const cleaned = term.trim();
    
    // Muito curto
    if (cleaned.length < 1) return false;
    
    // Muito longo
    if (cleaned.length > 100) return false;
    
    // Apenas números ou caracteres especiais
    if (!/[a-zA-ZÀ-ÿ]/.test(cleaned)) return false;
    
    return true;
  }