import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { CalendarDays, MapPin, Users, Grid, Calendar as CalIcon } from 'lucide-react';
import api from '../lib/api';
import { qk } from '../lib/queryClient';
import { Button } from '../components/ui/Button';
import { Avatar, AvatarStack } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { EventCardSkeleton } from '../components/ui/Skeleton';
import { EmptyEvents } from '../components/empty/EmptyState';

const TABS = ['All', 'Today', 'This Week', 'My Clubs'];
const TAB_VALS = ['all', 'today', 'this_week', 'my_clubs'];

function EventCard({ event }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const rsvp = event.user_rsvp;

  const rsvpMutation = useMutation({
    mutationFn: (status) => api.post(`/api/events/${event.id}/rsvp`, { status }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });

  const statusStyle = {
    going:    { bg: 'var(--success-bg)', color: 'var(--success)', label: 'Going ✓' },
    interested: { bg: 'var(--accent-light)', color: 'var(--accent-text)', label: 'Interested' },
    null:     { bg: 'var(--brand)', color: 'white', label: 'RSVP' },
    undefined:{ bg: 'var(--brand)', color: 'white', label: 'RSVP' },
  };
  const st = statusStyle[rsvp] || statusStyle[null];

  return (
    <div className="card card-interactive" onClick={() => navigate(`/events/${event.id}`)}
      style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
      {/* Banner */}
      <div style={{ width: '100%', height: '160px', position: 'relative', background: 'var(--brand-light)' }}>
        {event.banner_url && (
          <img src={event.banner_url} alt={event.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        {/* Club logo overlap */}
        {event.club?.logo_url && (
          <img src={event.club.logo_url} alt={event.club.name}
            style={{
              position: 'absolute', bottom: '-16px', left: '16px',
              width: 32, height: 32, borderRadius: 'var(--r-sm)',
              border: '2px solid white', objectFit: 'cover',
              boxShadow: 'var(--shadow-sm)',
            }} />
        )}
        {/* Live badge */}
        {event.is_live && (
          <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
            <Badge variant="danger" dot>Live</Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '22px 18px 16px' }}>
        <p className="caption" style={{ marginBottom: '6px' }}>{event.club?.name}</p>
        <h3 className="h3 truncate-2" style={{ marginBottom: '8px', fontSize: '16px' }}>{event.title}</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} className="caption">
            <CalendarDays size={13} style={{ color: 'var(--brand)' }} />
            {event.start_time ? format(parseISO(event.start_time), 'MMM d · h:mm a') : ''}
          </div>
          {event.location_name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} className="caption">
              <MapPin size={13} style={{ color: 'var(--brand)' }} />
              {event.location_name}
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AvatarStack users={event.attendee_avatars || []} size={24} max={3} />
            {event.going_count > 0 && (
              <span className="caption">+{event.going_count} going</span>
            )}
          </div>
          <button
            onClick={e => { e.stopPropagation(); rsvpMutation.mutate(rsvp === 'going' ? 'not_going' : 'going'); }}
            style={{
              padding: '6px 14px', borderRadius: 'var(--r-full)',
              background: st.bg, color: st.color, border: 'none',
              fontFamily: 'inherit', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            {rsvpMutation.isPending ? '...' : st.label}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Events() {
  const [activeTab, setActiveTab] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: qk.events(TAB_VALS[activeTab]),
    queryFn: () => api.get(`/api/events?filter=${TAB_VALS[activeTab]}&page=1&limit=12`),
  });

  const events = data?.data?.items || data?.items || [];

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <h2 className="h2">Events</h2>
      </div>

      {/* Floating tab bar */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
        <div className="tab-bar">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              className={`tab-item${activeTab === i ? ' active' : ''}`}
              onClick={() => setActiveTab(i)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {[1,2,3,4,5,6].map(i => <EventCardSkeleton key={i} />)}
        </div>
      ) : events.length === 0 ? (
        <EmptyEvents />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {events.map(ev => <EventCard key={ev.id} event={ev} />)}
        </div>
      )}
    </div>
  );
}
