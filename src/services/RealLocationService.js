// src/services/RealLocationService.js - SERVIÇO DE LOCALIZAÇÃO REAL
import * as Location from 'expo-location';
import { Alert } from 'react-native';

class RealLocationService {
  constructor() {
    this.watchId = null;
    this.currentLocation = null;
    this.lastKnownLocation = null;
  }

  /**
   * ✅ SOLICITAR PERMISSÃO DE LOCALIZAÇÃO
   */
  async requestLocationPermission() {
    try {
      console.log('📍 Verificando permissões de localização...');
      
      // Verificar permissão atual
      let { status } = await Location.getForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('🔐 Solicitando permissão...');
        const permissionResult = await Location.requestForegroundPermissionsAsync();
        status = permissionResult.status;
      }

      if (status !== 'granted') {
        throw new Error('Permissão de localização negada');
      }

      console.log('✅ Permissão de localização concedida');
      return true;
    } catch (error) {
      console.log('❌ Erro na permissão:', error);
      throw error;
    }
  }

  /**
   * ✅ OBTER LOCALIZAÇÃO ATUAL REAL DO DISPOSITIVO
   */
  async getCurrentRealLocation(options = {}) {
    try {
      await this.requestLocationPermission();
      
      console.log('🎯 Obtendo localização GPS atual...');
      
      const locationOptions = {
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
        distanceInterval: 1,
        ...options
      };

      // Tentar várias vezes se necessário
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          console.log(`📡 Tentativa ${attempts + 1} de obter GPS...`);
          
          const location = await Location.getCurrentPositionAsync(locationOptions);
          
          const coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp
          };

          this.currentLocation = coords;
          this.lastKnownLocation = coords;
          
          console.log('📍 Localização obtida:', {
            lat: coords.latitude.toFixed(6),
            lng: coords.longitude.toFixed(6),
            accuracy: `${coords.accuracy?.toFixed(0)}m`
          });

          return coords;
          
        } catch (attemptError) {
          attempts++;
          console.log(`⚠️ Tentativa ${attempts} falhou:`, attemptError.message);
          
          if (attempts >= maxAttempts) {
            throw attemptError;
          }
          
          // Esperar antes da próxima tentativa
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
    } catch (error) {
      console.log('❌ Erro ao obter localização:', error);
      
      // Retornar última localização conhecida se disponível
      if (this.lastKnownLocation) {
        console.log('🔄 Usando última localização conhecida');
        return this.lastKnownLocation;
      }
      
      throw error;
    }
  }

  /**
   * ✅ CONVERTER COORDENADAS EM ENDEREÇO REAL
   */
  async getRealAddressFromCoordinates(latitude, longitude) {
    try {
      console.log('🏠 Convertendo coordenadas em endereço...');
      console.log(`📍 Coords: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      
      // Usar reverse geocoding nativo do Expo
      const results = await Location.reverseGeocodeAsync(
        { latitude, longitude },
        { useGoogleMaps: false }
      );

      if (results && results.length > 0) {
        const address = results[0];
        console.log('🏘️ Dados do endereço encontrados:', address);
        
        // Construir endereço detalhado
        const addressComponents = this.buildDetailedAddress(address);
        
        return {
          fullAddress: addressComponents.full,
          street: addressComponents.street,
          neighborhood: addressComponents.neighborhood,
          city: addressComponents.city,
          state: addressComponents.state,
          country: addressComponents.country,
          postalCode: address.postalCode || null,
          raw: address
        };
      } else {
        console.log('⚠️ Nenhum endereço encontrado para essas coordenadas');
        return null;
      }
    } catch (error) {
      console.log('❌ Erro no reverse geocoding:', error);
      return null;
    }
  }

  /**
   * ✅ CONSTRUIR ENDEREÇO DETALHADO
   */
  buildDetailedAddress(addressData) {
    const parts = [];
    const streetParts = [];
    
    // Construir parte da rua
    if (addressData.street) streetParts.push(addressData.street);
    if (addressData.streetNumber) streetParts.push(addressData.streetNumber);
    
    // Montar endereço completo
    if (streetParts.length > 0) parts.push(streetParts.join(', '));
    if (addressData.district) parts.push(addressData.district);
    if (addressData.subregion && addressData.subregion !== addressData.district) {
      parts.push(addressData.subregion);
    }
    if (addressData.city) parts.push(addressData.city);
    if (addressData.region && addressData.region !== addressData.city) {
      parts.push(addressData.region);
    }
    if (addressData.country && addressData.country !== 'Mozambique') {
      parts.push(addressData.country);
    }

    return {
      full: parts.join(', '),
      street: streetParts.join(', ') || null,
      neighborhood: addressData.district || addressData.subregion || null,
      city: addressData.city || null,
      state: addressData.region || null,
      country: addressData.country || null
    };
  }

  /**
   * ✅ OBTER LOCALIZAÇÃO COMPLETA (COORDENADAS + ENDEREÇO)
   */
  async getCompleteRealLocation() {
    try {
      console.log('🌍 Obtendo localização completa...');
      
      // 1. Obter coordenadas GPS
      const coords = await this.getCurrentRealLocation();
      
      // 2. Converter em endereço
      const addressInfo = await this.getRealAddressFromCoordinates(
        coords.latitude, 
        coords.longitude
      );

      const result = {
        coordinates: coords,
        address: addressInfo,
        success: true,
        timestamp: Date.now()
      };

      console.log('✅ Localização completa obtida:', {
        coords: `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`,
        address: addressInfo?.fullAddress || 'Endereço não encontrado'
      });

      return result;
      
    } catch (error) {
      console.log('❌ Erro ao obter localização completa:', error);
      
      return {
        coordinates: null,
        address: null,
        success: false,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * ✅ VERIFICAR SE DEVICE SUPORTA GPS
   */
  async checkGPSAvailability() {
    try {
      const isLocationEnabled = await Location.hasServicesEnabledAsync();
      
      if (!isLocationEnabled) {
        throw new Error('GPS está desativado. Ative nas configurações do dispositivo.');
      }

      return true;
    } catch (error) {
      console.log('❌ GPS não disponível:', error);
      throw error;
    }
  }

  /**
   * ✅ MOSTRAR DIÁLOGO DE ERRO COM SUGESTÕES
   */
  showLocationErrorDialog(error) {
    let title = 'Erro de Localização';
    let message = 'Não foi possível obter sua localização';
    let suggestions = [];

    if (error.message.includes('denied')) {
      title = 'Permissão Negada';
      message = 'Para melhor experiência, permita o acesso à localização';
      suggestions = [
        '• Vá em Configurações > Privacidade > Localização',
        '• Ative a localização para este app',
        '• Tente novamente'
      ];
    } else if (error.message.includes('GPS')) {
      title = 'GPS Desativado';
      message = 'O GPS precisa estar ativado para obter sua localização';
      suggestions = [
        '• Ative o GPS nas configurações',
        '• Certifique-se de estar em local aberto',
        '• Tente novamente em alguns segundos'
      ];
    } else if (error.message.includes('network') || error.message.includes('timeout')) {
      title = 'Conexão';
      message = 'Verifique sua conexão com a internet';
      suggestions = [
        '• Verifique sua conexão Wi-Fi/dados móveis',
        '• Tente novamente'
      ];
    }

    const fullMessage = suggestions.length > 0 
      ? `${message}\n\n${suggestions.join('\n')}`
      : message;

    Alert.alert(title, fullMessage, [
      { text: 'OK', style: 'default' }
    ]);
  }

  /**
   * ✅ INICIAR MONITORAMENTO DE LOCALIZAÇÃO
   */
  async startLocationTracking(callback, options = {}) {
    try {
      await this.requestLocationPermission();
      
      const trackingOptions = {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000, // 5 segundos
        distanceInterval: 10, // 10 metros
        ...options
      };

      console.log('📍 Iniciando rastreamento de localização...');

      this.watchId = await Location.watchPositionAsync(
        trackingOptions,
        (location) => {
          const coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp
          };

          this.currentLocation = coords;
          this.lastKnownLocation = coords;

          if (callback) {
            callback(coords);
          }
        }
      );

      console.log('✅ Rastreamento iniciado');
      return this.watchId;
      
    } catch (error) {
      console.log('❌ Erro ao iniciar rastreamento:', error);
      throw error;
    }
  }

  /**
   * ✅ PARAR MONITORAMENTO
   */
  stopLocationTracking() {
    if (this.watchId) {
      this.watchId.remove();
      this.watchId = null;
      console.log('🛑 Rastreamento de localização parado');
    }
  }

  /**
   * ✅ CALCULAR DISTÂNCIA ENTRE DOIS PONTOS
   */
  calculateDistance(point1, point2) {
    const R = 6371; // Raio da Terra em km
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * ✅ LIMPAR CACHE
   */
  clearCache() {
    this.currentLocation = null;
    this.lastKnownLocation = null;
    console.log('🧹 Cache de localização limpo');
  }
}

// Export singleton instance
export default new RealLocationService();