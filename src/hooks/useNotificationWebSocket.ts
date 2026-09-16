import { useEffect, useState } from "react";

export interface RealtimeNotification {
  id?: number;
  title: string;
  message: string;
  createdAt?: string;
}

export function useNotificationWebSocket(username?: string) {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (!username) return;

    // SockJS / STOMP Realtime Notification Hook Placeholder
    // Endpoint: http://localhost:8080/ws-notification
    // Topic: /topic/notifications/{username}
    console.log(`[WebSocket] Initialized STOMP notification listener for user: ${username}`);
  }, [username]);

  return { notifications, unreadCount, setUnreadCount };
}

