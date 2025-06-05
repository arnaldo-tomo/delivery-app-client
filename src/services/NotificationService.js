import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import * as api from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  async init() {
    if (!Device.isDevice) return;

      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Pedidos',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF6B35',
        });
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' // SUBSTITUA PELO SEU PROJECT ID
      });

      await api.savePushToken(token.data);

    } catch (error) {
      // Silencioso - não mostrar erros
    }
  }
 
export default new NotificationService();
