import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, MapPin, Users, Share2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { AvatarStack } from '../components/ui/Avatar';
import api from '../lib/api';
import { qk } from '../lib/queryClient';
import { format, parseISO } from 'date-fns';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => api.get(`/api/events/${id}`),
    enabled: !!id,
  });

  const { data: attendeesData } = useQuery({
    queryKey: ['event', id, 'attendees'],
    queryFn: () => api.get(`/api/events/${id}/attendees`),
    enabled: !!id,
  });

  const event = data?.data?.event || data?.event || data?.data || data;
  const attendees = attendeesData?.data?.items || attendeesData?.items || [];

  if (isLoading) return <div style={{ padding: '40px' }}>Loading...</div>;
  if (!event) return <div style={{ padding: '40px' }}>Event not found</div>;

  return (
    <div style={{ padding: '0 0 80px 0' }}>
      {/* Banner */}
      <div style={{ width: '100%', height: '300px', position: 'relative', background: 'var(--bg-surface)' }}>
        {event.banner_url && (
          <img src={event.banner_url} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute', top: '24px', left: '40px',
            width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer',
          }}
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      <div style={{ maxWidth: '800px', margin: '-40px auto 0', position: 'relative', zIndex: 10 }}>
        <div className="card" style={{ padding: '40px', borderRadius: 'var(--r-2xl)', boxShadow: 'var(--shadow-xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <p className="caption" style={{ marginBottom: '8px' }}>{event.club?.name || 'Campus Event'}</p>
              <h1 className="h1" style={{ fontSize: '32px', marginBottom: '16px' }}>{event.title}</h1>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Badge>{event.category || 'Event'}</Badge>
                {event.is_live && <Badge variant="danger" dot>Live</Badge>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button variant="secondary" icon={<Share2 size={16} />}>Share</Button>
              <Button variant="primary">RSVP Now</Button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px', padding: '24px', background: 'var(--bg-surface)', borderRadius: 'var(--r-lg)' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CalendarDays style={{ color: 'var(--brand)', marginTop: '2px' }} size={20} />
              <div>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Date & Time</p>
                <p className="body" style={{ color: 'var(--text-secondary)' }}>
                  {event.start_time ? format(parseISO(event.start_time), 'EEEE, MMMM d, yyyy') : 'TBA'}<br />
                  {event.start_time ? format(parseISO(event.start_time), 'h:mm a') : 'TBA'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <MapPin style={{ color: 'var(--brand)', marginTop: '2px' }} size={20} />
              <div>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Location</p>
                <p className="body" style={{ color: 'var(--text-secondary)' }}>{event.location_name || 'TBA'}</p>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '40px' }}>
            <h3 className="h3" style={{ marginBottom: '16px' }}>About this event</h3>
            <p className="body" style={{ color: 'var(--text-body)', whiteSpace: 'pre-wrap' }}>{event.description || 'No description provided.'}</p>
          </div>

          <div>
            <h3 className="h3" style={{ marginBottom: '16px' }}>Attendees ({event.going_count || 0})</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <AvatarStack users={attendees} size={40} max={10} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
