import { useState, useEffect, useCallback } from 'react';

export interface Notification {
  id: string;
  type: 'report_submitted' | 'report_approved' | 'report_rejected' | 'report_completed';
  reportId: number;
  containerNo: string;
  status: string;
  targetRole?: 'driver' | 'field' | 'office';
  timestamp: Date;
  read: boolean;
}

export function useNotifications(userRole?: 'driver' | 'field' | 'office') {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    // Connect to WebSocket server
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log('WebSocket connected for notifications');
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Only show notifications for current user's role
        if (userRole && data.targetRole && data.targetRole !== userRole) {
          return;
        }

        const notification: Notification = {
          id: `${data.reportId}-${Date.now()}`,
          type: data.type,
          reportId: data.reportId,
          containerNo: data.containerNo,
          status: data.status,
          targetRole: data.targetRole,
          timestamp: new Date(),
          read: false,
        };

        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Play notification sound (optional)
        // const audio = new Audio('/notification.mp3');
        // audio.play().catch(() => {});
      } catch (error) {
        console.error('Error parsing notification:', error);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [userRole]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
}
