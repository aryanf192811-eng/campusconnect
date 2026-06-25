import { useEffect } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '../stores/authStore';
import { queryClient } from '../lib/queryClient';
import { qk } from '../lib/queryClient';

export function useSSE() {
  const token = useAuthStore(s => s.token);

  useEffect(() => {
    if (!token) return;
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notifications/stream?token=${token}`;
    const es = new EventSource(url);

    es.addEventListener('notification', e => {
      try {
        const notif = JSON.parse(e.data);
        toast.info(notif.message || 'New notification', {
          description: notif.type,
          duration: 4000,
        });
        queryClient.invalidateQueries({ queryKey: qk.notifs() });
      } catch {}
    });

    es.addEventListener('unread_count', e => {
      try {
        const { count } = JSON.parse(e.data);
        useAuthStore.getState().updateUser({ unreadCount: count });
      } catch {}
    });

    es.onerror = () => {
      // SSE will auto-reconnect; no action needed
    };

    return () => es.close();
  }, [token]);
}
