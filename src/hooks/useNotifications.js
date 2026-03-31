// hooks/useNotifications.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/api';

const WS_BASE = 'wss://easypy-backend-430520813248.us-central1.run.app';
const PING_INTERVAL = 30000; // 30s para mantener viva la conexión

export const useNotifications = (user) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const wsRef                             = useRef(null);
  const pingRef                           = useRef(null);
  const reconnectRef                      = useRef(null);

  const addNotification = useCallback((notif) => {
    setNotifications(prev => {
      // Evitar duplicados
      if (prev.find(n => n.notification_id === notif.notification_id)) return prev;
      return [notif, ...prev];
    });
    if (!notif.is_read) setUnreadCount(prev => prev + 1);
  }, []);

  const connect = useCallback(() => {
    if (!user?.user_id) return;
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    const url = `${WS_BASE}/notifications/ws/${user.user_id}?token=${token}`;
    const ws  = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      // Ping periódico para mantener la conexión viva
      pingRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send('ping');
      }, PING_INTERVAL);
    };

    ws.onmessage = (event) => {
      if (event.data === 'pong') return;
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'notification') addNotification(data);
      } catch {}
    };

    ws.onclose = () => {
      clearInterval(pingRef.current);
      // Reconectar en 5 segundos si no fue cierre intencional
      reconnectRef.current = setTimeout(() => connect(), 5000);
    };

    ws.onerror = () => ws.close();
  }, [user, addNotification]);

  // Cargar historial al montar
  useEffect(() => {
    if (!user?.user_id) return;
    getNotifications().then(data => {
      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.is_read).length);
    }).catch(() => {});
  }, [user]);

  // Conectar WebSocket
  useEffect(() => {
    connect();
    return () => {
      clearInterval(pingRef.current);
      clearTimeout(reconnectRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // evitar reconexión al desmontar
        wsRef.current.close();
      }
    };
  }, [connect]);

  const markRead = async (notificationId) => {
    await markNotificationRead(notificationId);
    setNotifications(prev =>
      prev.map(n => n.notification_id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return { notifications, unreadCount, markRead, markAllRead };
};