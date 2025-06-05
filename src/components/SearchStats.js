// src/components/SearchStats.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const colors = {
  primary: '#FF6B35',
  primaryDark: '#FF4500',
  secondary: '#FFB800',
  accent: '#00C896',
  background: '#FAFBFC',
  surface: '#FFFFFF',
  text: '#1A1D23',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  shadowColor: '#000000',
};

const SearchStats = ({ 
  totalProducts, 
  totalRestaurants, 
  searchQuery, 
  searchTime,
  showDetailed = false 
}) => {
  const total = totalProducts + totalRestaurants;
  
  if (total === 0) return null;
  
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary + '10', colors.accent + '10']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.mainStats}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalNumber}>{total}</Text>
              <Text style={styles.totalLabel}>
                resultado{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
              </Text>
            </View>
            
            {searchTime && (
              <Text style={styles.searchTime}>
                em {searchTime}ms
              </Text>
            )}
          </View>
          
          {showDetailed && (
            <View style={styles.breakdown}>
              {totalProducts > 0 && (
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, styles.productIcon]}>
                    <Ionicons name="restaurant" size={12} color={colors.surface} />
                  </View>
                  <Text style={styles.statText}>
                    {totalProducts} prato{totalProducts !== 1 ? 's' : ''}
                  </Text>
                </View>
              )}
              
              {totalRestaurants > 0 && (
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, styles.restaurantIcon]}>
                    <Ionicons name="storefront" size={12} color={colors.surface} />
                  </View>
                  <Text style={styles.statText}>
                    {totalRestaurants} restaurante{totalRestaurants !== 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

const SearchStatsCompact = ({ results, searchQuery }) => {
  const products = results.filter(r => r.type === 'product').length;
  const restaurants = results.filter(r => r.type === 'restaurant').length;
  const total = products + restaurants;
  
  if (total === 0) return null;
  
  return (
    <View style={styles.compactContainer}>
      <View style={styles.compactContent}>
        <Ionicons name="search" size={14} color={colors.textSecondary} />
        <Text style={styles.compactText}>
          {total} resultado{total !== 1 ? 's' : ''} para "{searchQuery}"
        </Text>
      </View>
      
      {products > 0 && restaurants > 0 && (
        <View style={styles.compactBreakdown}>
          <Text style={styles.compactBreakdownText}>
            {products} prato{products !== 1 ? 's' : ''} • {restaurants} restaurante{restaurants !== 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </View>
  );
};

// Componente para mostrar filtros ativos
const ActiveFilters = ({ activeFilter, searchQuery, onClearFilter, onClearSearch }) => {
  const hasFilters = activeFilter !== 'all' || searchQuery;
  
  if (!hasFilters) return null;
  
  return (
    <View style={styles.filtersContainer}>
      <Text style={styles.filtersLabel}>Filtros ativos:</Text>
      
      <View style={styles.filterTags}>
        {searchQuery && (
          <View style={styles.filterTag}>
            <Text style={styles.filterTagText}>"{searchQuery}"</Text>
            <TouchableOpacity 
              style={styles.filterTagClose}
              onPress={onClearSearch}
            >
              <Ionicons name="close" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
        
        {activeFilter !== 'all' && (
          <View style={styles.filterTag}>
            <Text style={styles.filterTagText}>
              {activeFilter === 'products' ? 'Pratos' : 
               activeFilter === 'restaurants' ? 'Restaurantes' : 
               activeFilter === 'offers' ? 'Ofertas' : activeFilter}
            </Text>
            <TouchableOpacity 
              style={styles.filterTagClose}
              onPress={onClearFilter}
            >
              <Ionicons name="close" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradient: {
    padding: 1,
  },
  content: {
    backgroundColor: colors.surface,
    borderRadius: 11,
    padding: 16,
  },
  mainStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalContainer: {
    flex: 1,
  },
  totalNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  totalLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  searchTime: {
    fontSize: 12,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  breakdown: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  productIcon: {
    backgroundColor: colors.primary,
  },
  restaurantIcon: {
    backgroundColor: colors.accent,
  },
  statText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  
  // Compact version
  compactContainer: {
    backgroundColor: colors.background,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 8,
    padding: 12,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
    fontWeight: '500',
  },
  compactBreakdown: {
    marginTop: 4,
    marginLeft: 22,
  },
  compactBreakdownText: {
    fontSize: 12,
    color: colors.textLight,
  },
  
  // Active filters
  filtersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  filtersLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  filterTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTagText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
    marginRight: 6,
  },
  filterTagClose: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

