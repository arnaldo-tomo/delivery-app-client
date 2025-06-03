import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Linking,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
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

export default function OrderTrackingScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [region, setRegion] = useState({
    latitude: -25.9244,
    longitude: 32.5732,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    loadOrderDetails();
    getCurrentLocation();
    
    // Simular atualizações de localização do entregador
    const interval = setInterval(() => {
      updateDeliveryLocation();
    }, 10000); // Atualiza a cada 10 segundos

    return () => clearInterval(interval);
  }, []);

  async function loadOrderDetails() {
    try {
      const response = await api.getOrder(orderId);
      setOrder(response.data);
      
      if (response.data.delivery_person) {
        setDeliveryLocation({
          latitude: response.data.delivery_person.latitude || -25.9244,
          longitude: response.data.delivery_person.longitude || 32.5732,
        });
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os detalhes do pedido');
    }
  }

  async function getCurrentLocation() {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const userCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setUserLocation(userCoords);
      setRegion({
        ...userCoords,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    } catch (error) {
      console.log('Erro ao obter localização:', error);
    }
  }

  async function updateDeliveryLocation() {
    // Em um app real, isso viria de uma API ou WebSocket
    // Aqui vamos simular o movimento do entregador
    if (deliveryLocation && userLocation) {
      const newLat = deliveryLocation.latitude + (Math.random() - 0.5) * 0.001;
      const newLng = deliveryLocation.longitude + (Math.random() - 0.5) * 0.001;
      
      setDeliveryLocation({
        latitude: newLat,
        longitude: newLng,
      });
    }
  }

  function callDeliveryPerson() {
    if (order?.delivery_person?.phone) {
      Linking.openURL(`tel:${order.delivery_person.phone}`);
    } else {
      Alert.alert('Erro', 'Número do entregador não disponível');
    }
  }

  const statusInfo = {
    pending: { 
      icon: 'time-outline', 
      text: 'Aguardando confirmação', 
      color: colors.secondary 
    },
    confirmed: { 
      icon: 'checkmark-circle-outline', 
      text: 'Pedido confirmado', 
      color: colors.primary 
    },
    preparing: { 
      icon: 'restaurant-outline', 
      text: 'Preparando seu pedido', 
      color: '#3498db' 
    },
    on_way: { 
      icon: 'bicycle-outline', 
      text: 'Saiu para entrega', 
      color: '#9b59b6' 
    },
    delivered: { 
      icon: 'checkmark-done-outline', 
      text: 'Entregue', 
      color: '#27ae60' 
    },
  };

  const currentStatus = statusInfo[order?.status] || statusInfo.pending;

  return (
    <View style={styles.container}>
      {/* Mapa */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={region}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {/* Marcador do usuário */}
          {userLocation && (
            <Marker
              coordinate={userLocation}
              title="Sua localização"
              pinColor={colors.primary}
            />
          )}
          
          {/* Marcador do entregador */}
          {deliveryLocation && order?.status === 'on_way' && (
            <Marker
              coordinate={deliveryLocation}
              title="Entregador"
              description={order.delivery_person?.name || 'Entregador'}
            >
              <View style={styles.deliveryMarker}>
                <Ionicons name="bicycle" size={20} color={colors.white} />
              </View>
            </Marker>
          )}
          
          {/* Linha de rota */}
          {userLocation && deliveryLocation && order?.status === 'on_way' && (
            <Polyline
              coordinates={[deliveryLocation, userLocation]}
              strokeColor={colors.primary}
              strokeWidth={3}
              lineDashPattern={[1]}
            />
          )}
        </MapView>
      </View>

      {/* Informações do pedido */}
      <View style={styles.orderInfo}>
        <View style={styles.statusContainer}>
          <View style={styles.statusIcon}>
            <Ionicons 
              name={currentStatus.icon} 
              size={24} 
              color={currentStatus.color} 
            />
          </View>
          <View style={styles.statusText}>
            <Text style={styles.statusTitle}>{currentStatus.text}</Text>
            <Text style={styles.orderId}>Pedido #{order?.id}</Text>
          </View>
        </View>

        {/* Informações do entregador */}
        {order?.delivery_person && order?.status === 'on_way' && (
          <View style={styles.deliveryInfo}>
            <View style={styles.deliveryPersonInfo}>
              <View style={styles.deliveryPersonAvatar}>
                <Ionicons name="person" size={20} color={colors.primary} />
              </View>
              <View style={styles.deliveryPersonDetails}>
                <Text style={styles.deliveryPersonName}>
                  {order.delivery_person.name}
                </Text>
                <Text style={styles.deliveryPersonVehicle}>
                  🛵 Chegando em aproximadamente 15 min
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.callButton}
              onPress={callDeliveryPerson}
            >
              <Ionicons name="call" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
        )}

        {/* Resumo do pedido */}
        <View style={styles.orderSummary}>
          <Text style={styles.summaryTitle}>Resumo do pedido</Text>
          {order?.items?.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <Text style={styles.itemQuantity}>{item.quantity}x</Text>
              <Text style={styles.itemName}>{item.product?.name}</Text>
              <Text style={styles.itemPrice}>
                R$ {(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalPrice}>R$ {order?.total?.toFixed(2)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  deliveryMarker: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  orderInfo: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  statusIcon: {
    marginRight: 12,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  orderId: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: colors.grayLight,
    borderRadius: 12,
  },
  deliveryPersonInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deliveryPersonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deliveryPersonDetails: {
    flex: 1,
  },
  deliveryPersonName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  deliveryPersonVehicle: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  callButton: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderSummary: {
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemQuantity: {
    fontSize: 14,
    color: colors.textLight,
    width: 30,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
})