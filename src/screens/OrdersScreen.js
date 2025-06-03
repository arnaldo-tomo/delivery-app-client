import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as api from '../services/api';

const colors = {
  primary: '#FE3801',
  secondary: '#FE8800',
  text: '#0B0C17',
  textLight: '#32354E',
  gray: '#A4A5B0',
  grayLight: '#EDEDEF',
  white: '#FFFFFF',
};

const statusColors = {
  pending: colors.secondary,
  confirmed: colors.primary,
  preparing: '#3498db',
  on_way: '#9b59b6',
  delivered: '#27ae60',
  cancelled: '#e74c3c',
};

const statusLabels = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  on_way: 'A caminho',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      const response = await api.getMyOrders();
      setOrders(response.data);
      // console.log(response.data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os pedidos');
    } finally {
      setLoading(false);
    }
  }

  function handleTrackOrder(order) {
    if (order.status === 'on_way' || order.status === 'preparing') {
      navigation.navigate('OrderTracking', { orderId: order.id });
    } else {
      Alert.alert(
        'Rastreamento',
        'O rastreamento estará disponível quando o pedido estiver sendo preparado ou a caminho.'
      );
    }
  }

  function renderOrder({ item }) {
    const statusColor = statusColors[item.status] || colors.gray;
    const statusLabel = statusLabels[item.status] || item.status;
    const canTrack = ['preparing', 'on_way'].includes(item.status);

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>Pedido #{item.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>
        
        <Text style={styles.orderDate}>
          {new Date(item.created_at).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
        
        <View style={styles.orderItems}>
          {item.items?.map((orderItem, index) => (
            <Text key={index} style={styles.itemText}>
              {orderItem.quantity}x {orderItem.product?.name || 'Produto'}
            </Text>
          ))}
        </View>
        
        <View style={styles.orderFooter}>
          <Text style={styles.orderTotal}>
            Total: R$ {item.total?.toFixed(2) || '0.00'}
          </Text>
          <TouchableOpacity 
            style={[
              styles.trackButton, 
              canTrack ? styles.trackButtonActive : styles.trackButtonInactive
            ]}
            onPress={() => handleTrackOrder(item)}
          >
            <Ionicons 
              name={canTrack ? "location-outline" : "eye-outline"} 
              size={16} 
              color={canTrack ? colors.white : colors.primary} 
            />
            <Text style={[
              styles.trackButtonText,
              canTrack ? styles.trackButtonTextActive : styles.trackButtonTextInactive
            ]}>
              {canTrack ? 'Rastrear' : 'Ver detalhes'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="receipt-outline" size={64} color={colors.gray} />
        <Text style={styles.emptyTitle}>Nenhum pedido encontrado</Text>
        <Text style={styles.emptySubtitle}>
          Seus pedidos aparecerão aqui após serem realizados
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meus pedidos</Text>
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ordersList}
        refreshing={loading}
        onRefresh={loadOrders}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 60,
    marginBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
  },
  ordersList: {
    paddingBottom: 20,
  },
  orderCard: {
    backgroundColor: colors.white,
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '600',
  },
  orderDate: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 12,
  },
  orderItems: {
    marginBottom: 12,
  },
  itemText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  trackButtonActive: {
    backgroundColor: colors.primary,
  },
  trackButtonInactive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  trackButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  trackButtonTextActive: {
    color: colors.white,
  },
  trackButtonTextInactive: {
    color: colors.primary,
  },
});
