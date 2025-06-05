// src/hooks/useSimpleNotifications.js
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';


export const useSimpleNotifications = () => {
  const { user, token } = useAuth();

  useEffect(() => {
    if (user && token) {
      // Inicializar notificações quando user estiver logado
      SimpleNotificationService.init();
    }
  }, [user, token]);

  return {
    showTest: () => SimpleNotificationService.showLocalNotification(
      '🧪 Teste', 
      'Notificação funcionando!'
    )
  };
};