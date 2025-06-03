// src/screens/RegisterScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/AuthContext';

const colors = {
  primary: '#FE3801',
  text: '#0B0C17',
  textLight: '#32354E',
  gray: '#A4A5B0',
  grayLight: '#EDEDEF',
  white: '#FFFFFF',
};

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    role: 'customer',
    address: '',
    latitude: null,
    longitude: null,
  });
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { signUp } = useAuth();

  function updateField(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  async function getCurrentLocation() {
    try {
      setLoadingLocation(true);
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Erro', 'Permissão de localização negada');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Usar reverse geocoding para obter o endereço
      let addressResponse = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addressResponse.length > 0) {
        const addr = addressResponse[0];
        const fullAddress = `${addr.street || ''} ${addr.streetNumber || ''}, ${addr.district || ''}, ${addr.city || ''} - ${addr.region || ''}`.trim();
        
        setFormData(prev => ({
          ...prev,
          address: fullAddress,
          latitude,
          longitude,
        }));
        
        Alert.alert('Sucesso', 'Localização obtida com sucesso!');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível obter sua localização');
    } finally {
      setLoadingLocation(false);
    }
  }

  async function handleRegister() {
    const { name, email, phone, password, password_confirmation, address } = formData;

    if (!name || !email || !phone || !password || !password_confirmation || !address) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    if (password !== password_confirmation) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 8 caracteres');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      Alert.alert('Erro', 'É necessário obter sua localização para continuar');
      return;
    }

    setLoading(true);
    const result = await signUp(formData);
    setLoading(false);

    if (result.success) {
      Alert.alert(
        'Sucesso', 
        'Conta criada com sucesso! Faça login para continuar.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } else {
      Alert.alert('Erro', result.error);
    }
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Criar conta</Text>
            <Text style={styles.subtitle}>Preencha seus dados para começar</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={colors.gray} />
              <TextInput
                style={styles.input}
                placeholder="Nome completo *"
                value={formData.name}
                onChangeText={(value) => updateField('name', value)}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={colors.gray} />
              <TextInput
                style={styles.input}
                placeholder="E-mail *"
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color={colors.gray} />
              <TextInput
                style={styles.input}
                placeholder="Telefone *"
                value={formData.phone}
                onChangeText={(value) => updateField('phone', value)}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.gray} />
              <TextInput
                style={styles.input}
                placeholder="Senha (min. 8 caracteres) *"
                value={formData.password}
                onChangeText={(value) => updateField('password', value)}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons 
                  name={showPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color={colors.gray} 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.gray} />
              <TextInput
                style={styles.input}
                placeholder="Confirmar senha *"
                value={formData.password_confirmation}
                onChangeText={(value) => updateField('password_confirmation', value)}
                secureTextEntry={!showPassword}
              />
            </View>

            {/* Campo de Endereço com botão de localização */}
            <View style={styles.addressContainer}>
              <View style={styles.inputContainer}>
                <Ionicons name="location-outline" size={20} color={colors.gray} />
                <TextInput
                  style={styles.input}
                  placeholder="Endereço completo *"
                  value={formData.address}
                  onChangeText={(value) => updateField('address', value)}
                  multiline
                />
              </View>
              
              <TouchableOpacity 
                style={styles.locationButton}
                onPress={getCurrentLocation}
                disabled={loadingLocation}
              >
                <Ionicons 
                  name={loadingLocation ? "hourglass-outline" : "locate-outline"} 
                  size={16} 
                  color={colors.white} 
                />
                <Text style={styles.locationButtonText}>
                  {loadingLocation ? 'Obtendo...' : 'Usar GPS'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Indicador de localização obtida */}
            {formData.latitude && formData.longitude && (
              <View style={styles.locationInfo}>
                <Ionicons name="checkmark-circle" size={16} color="#27ae60" />
                <Text style={styles.locationInfoText}>
                  Localização obtida com sucesso
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Criando conta...' : 'Criar conta'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Já tem uma conta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>Faça login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.grayLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    minHeight: 56,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
  },
  addressContainer: {
    marginBottom: 8,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  locationButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  locationInfoText: {
    fontSize: 12,
    color: '#27ae60',
    marginLeft: 4,
    fontWeight: '500',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.textLight,
  },
  linkText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
});