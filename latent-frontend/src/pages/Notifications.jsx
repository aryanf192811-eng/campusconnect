import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { CheckCheck, Bell, Heart, UserPlus, CalendarDays, MessageCircle, ShoppingBag, Trophy } from 'lucide-react';
import api from '../lib/api';
import { qk } from '../lib/queryClient';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';

const NOTIF_ICONS = {
  like:       { icon: Heart,        color: '#EF4444' },
  follow:     { icon: UserPlus,     color: '#2563EB' },
  comment:    { icon: MessageCircle,color: '#10B981' },
  event:      { icon: CalendarDays, color: '#F59E0B' },
  market:     { icon: ShoppingBag,  color: '#A855F7' },
  mention:    { icon: Bell,         color: '#F97316' },
  achievement:{ icon: Trophy,       color: '#F59E0B' },
};

function NotifItem({ notif }) {
  const config = NOTIF_ICONS[notif.type] || NOTIF_ICONS.mention;
  const Icon = config.icon;

  return (
    <div style={{
      display: 'flex', gap: '14px', padding: '14px 16px',
      background: notif.is_read ? 'transparent' : 'var(--brand-light)',
      borderBottom: '1px solid var(--border)',
      borderLeftWidth: '3px',
      borderLeftStyle: 'solid',
      borderLeftColor: notif.is_read ? 'transparent' : 'var(--brand)',
      transition: 'background var(--t-base)',
    }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Avatar src={notif.actor?.avatar_url} name={notif.actor?.full_name} userId={notif.actor?.id} size={42} />
        <div style={{
          position: 'absolute', bottom: -2, right: -2,
          width: 20, height: 20, borderRadius: '50%',
          background: config.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid var(--bg-card)',
        }}>
          <Icon size={10} color="white" strokeWidth={2.5} />
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '14px', color: 'var(--text-body)', lineHeight: 1.5, marginBottom: '4px' }}>
          <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            {notif.actor?.full_name || 'Someone'}
          </strong>{' '}
          {notif.message}
        </p>
        {notif.preview && (
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontStyle: 'italic', marginBottom: '4px', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            "{notif.preview}"
          </p>
        )}
        <p className="mono-sm" style={{ color: 'var(--text-tertiary)' }}>
          {notif.created_at ? formatDistanceToNow(parseISO(notif.created_at), { addSuffix: true }) : ''}
        </p>
      </div>

      {notif.thumbnail && (
        <img src={notif.thumbnail} alt="" style={{ width: 44, height: 44, borderRadius: 'var(--r-sm)', objectFit: 'cover', flexShrink: 0 }} />
      )}
    </div>
  );
}

export default function Notifications() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: qk.notifs(),
    queryFn: () => api.get('/api/notifications'),
    refetchInterval: 60_000,
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.post('/api/notifications/mark-all-read'),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notifs() }),
  });

  const notifs = data?.data?.items || data?.items || [];
  const unread = notifs.filter(n => !n.is_read).length;

  return (
    <div style={{ padding: '32px 40px', maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h2 className="h2" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            Notifications
            {unread > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: 'var(--brand)', color: 'white', fontSize: '12px', fontWeight: 700 }}>
                {unread}
              </span>
            )}
          </h2>
          <p className="caption" style={{ marginTop: '4px' }}>Stay up to date with campus activity</p>
        </div>
        {unread > 0 && (
          <Button variant="ghost" size="sm" icon={<CheckCheck size={15} />} loading={markAllMutation.isPending} onClick={() => markAllMutation.mutate()}>
            Mark all read
          </Button>
        )}
      </div>

      <div className="card" style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden', padding: 0 }}>
        {isLoading ? (
          [1,2,3,4,5].map(i => (
            <div key={i} style={{ display: 'flex', gap: '14px', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
              <Skeleton width={42} height={42} style={{ borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <Skeleton height={14} style={{ marginBottom: '6px' }} />
                <Skeleton height={12} width={120} />
              </div>
            </div>
          ))
        ) : notifs.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Bell size={36} style={{ color: 'var(--border-medium)', margin: '0 auto 12px' }} />
            <p className="body" style={{ color: 'var(--text-secondary)' }}>All caught up!</p>
            <p className="caption">No new notifications</p>
          </div>
        ) : notifs.map(n => <NotifItem key={n.id} notif={n} />)
        }
      </div>
    </div>
  );
}
