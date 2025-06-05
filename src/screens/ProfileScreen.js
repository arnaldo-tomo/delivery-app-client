import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';

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
  error: '#EF4444',
};

export default function ProfileScreen({ navigation }) {
  const { user, signOut } = useAuth();

  function handleSignOut() {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', onPress: signOut, style: 'destructive' },
      ]
    );
  }
  const profileOptions = [
    {
      icon: 'person-outline',
      title: 'Dados Pessoais',
      subtitle: 'Editar informações do perfil',
      onPress: () => {}, // Implementar depois
    },
    {
      icon: 'location-outline',
      title: 'Endereços',
      subtitle: 'Gerenciar endereços de entrega',
      onPress: () => {}, // Implementar depois
    },
    {
      icon: 'heart-outline',
      title: 'Favoritos',
      subtitle: 'Restaurantes e pratos salvos',
      onPress: () => {}, // Implementar depois
    },
    {
      icon: 'card-outline',
      title: 'Métodos de Pagamento',
      subtitle: 'Gerenciar formas de pagamento',
      onPress: () => {}, // Implementar depois
    },
    {
      icon: 'notifications-outline',
      title: 'Notificações',
      subtitle: 'Configurar alertas e avisos',
      onPress: () => {}, // Implementar depois
    },
    {
      icon: 'help-circle-outline',
      title: 'Ajuda e Suporte',
      subtitle: 'Central de ajuda e contato',
      onPress: () => {}, // Implementar depois
    },
    {
      icon: 'log-out-outline',
      title: 'Sair',
      subtitle: 'Fazer logout da conta',
      onPress: handleSignOut,
      isDangerous: true,
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.header}
      >
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: user?.avatar || 'https://via.placeholder.com/80x80' }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={16} color={colors.surface} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'email@exemplo.com'}</Text>
            <View style={styles.userStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>12</Text>
                <Text style={styles.statLabel}>Pedidos</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>4.8</Text>
                <Text style={styles.statLabel}>Avaliação</Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Options */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {profileOptions.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionCard,
              option.isDangerous && styles.optionCardDangerous
            ]}
            onPress={option.onPress}
          >
            <View style={[
              styles.optionIcon,
              option.isDangerous && styles.optionIconDangerous
            ]}>
              <Ionicons 
                name={option.icon} 
                size={24} 
                color={option.isDangerous ? colors.error : colors.primary} 
              />
            </View>
            
            <View style={styles.optionContent}>
              <Text style={[
                styles.optionTitle,
                option.isDangerous && styles.optionTitleDangerous
              ]}>
                {option.title}
              </Text>
              <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
            </View>
            
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={colors.textLight} 
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: colors.surface,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.surface,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: colors.surface,
    opacity: 0.9,
    marginBottom: 16,
  },
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.surface,
  },
  statLabel: {
    fontSize: 12,
    color: colors.surface,
    opacity: 0.8,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.surface,
    opacity: 0.3,
    marginHorizontal: 20,
  },
  content: {
    flex: 1,
    marginTop: -20,
    marginBottom: 89,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  optionCardDangerous: {
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionIconDangerous: {
    backgroundColor: colors.error + '10',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  optionTitleDangerous: {
    color: colors.error,
  },
  optionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});