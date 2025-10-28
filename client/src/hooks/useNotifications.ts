import { useState, useEffect, useCallback, useRef } from 'react';

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

const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

export function useNotifications(userRole?: 'driver' | 'field' | 'office') {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isMountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!isMountedRef.current) return;

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      wsRef.current.onopen = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      const websocket = new WebSocket(wsUrl);
      wsRef.current = websocket;

      websocket.onopen = () => {
        console.log('WebSocket connected for notifications');
        reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
      };

      websocket.onmessage = (event) => {
        if (!isMountedRef.current) return;
        
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
        } catch (error) {
          console.error('Error parsing notification:', error);
        }
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      websocket.onclose = () => {
        if (!isMountedRef.current) return;
        
        console.log('WebSocket disconnected, attempting to reconnect...');
        
        // Clear existing reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }

        // Exponential backoff with jitter
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(
            INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current) + Math.random() * 1000,
            MAX_RECONNECT_DELAY
          );
          
          reconnectAttemptsRef.current += 1;
          console.log(`Reconnect attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS} in ${Math.round(delay)}ms`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.error('Max reconnection attempts reached');
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
    }
  }, [userRole]);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      
      // Clear reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      // Clean up WebSocket
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.onmessage = null;
        wsRef.current.onopen = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => {
        // Only mark as read if currently unread to prevent decrementing count multiple times
        if (n.id === notificationId && !n.read) {
          setUnreadCount(c => Math.max(0, c - 1));
          return { ...n, read: true };
        }
        return n;
      });
      return updated;
    });
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
