// src/components/SearchResultsStats.js
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

const SearchResultsStats = ({ 
  totalResults, 
  productCount, 
  restaurantCount, 
  searchQuery,
  searchTime 
}) => {
  if (totalResults === 0) return null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary + '08', colors.accent + '08']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Header com total */}
          <View style={styles.header}>
            <View style={styles.totalSection}>
              <Text style={styles.totalNumber}>{totalResults}</Text>
              <Text style={styles.totalLabel}>
                resultado{totalResults !== 1 ? 's' : ''} encontrado{totalResults !== 1 ? 's' : ''}
              </Text>
            </View>
            
            {searchTime && (
              <View style={styles.timeSection}>
                <Ionicons name="flash" size={14} color={colors.accent} />
                <Text style={styles.timeText}>{searchTime}ms</Text>
              </View>
            )}
          </View>

          {/* Query */}
          <View style={styles.querySection}>
            <Ionicons name="search" size={16} color={colors.textSecondary} />
            <Text style={styles.queryText} numberOfLines={1}>
              "{searchQuery}"
            </Text>
          </View>

          {/* Breakdown */}
          {(productCount > 0 || restaurantCount > 0) && (
            <View style={styles.breakdown}>
              {productCount > 0 && (
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, styles.productIcon]}>
                    <Ionicons name="restaurant" size={12} color={colors.surface} />
                  </View>
                  <Text style={styles.statText}>
                    {productCount} prato{productCount !== 1 ? 's' : ''}
                  </Text>
                </View>
              )}

              {restaurantCount > 0 && (
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, styles.restaurantIcon]}>
                    <Ionicons name="storefront" size={12} color={colors.surface} />
                  </View>
                  <Text style={styles.statText}>
                    {restaurantCount} restaurante{restaurantCount !== 1 ? 's' : ''}
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

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    padding: 1,
  },
  content: {
    backgroundColor: colors.surface,
    borderRadius: 15,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalSection: {
    flex: 1,
  },
  totalNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -1,
  },
  totalLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '600',
    marginLeft: 4,
  },
  querySection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  queryText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
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
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
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
});

export default SearchResultsStats;