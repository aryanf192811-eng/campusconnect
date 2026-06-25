import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useAuthStore } from '../stores/authStore';
import { qk } from '../lib/queryClient';
import api from '../lib/api';
import { HeartbeatLine } from '../components/pulse/HeartbeatLine';
import { LiveBadge } from '../components/ui/Badge';
import { PostCardSkeleton, Skeleton } from '../components/ui/Skeleton';

/* ─── Animated Counter ─────────────────────────────────────── */
function AnimatedCount({ target = 0, duration = 1200 }) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    if (target === 0) { setDisplay(0); return; }
    const start = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return (
    <span style={{
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '40px', fontWeight: 800,
      letterSpacing: '-0.03em',
      color: 'var(--text-primary)',
      lineHeight: 1,
    }}>
      {display.toLocaleString()}
    </span>
  );
}

/* ─── Stat Column ──────────────────────────────────────────── */
function StatCol({ label, value, sub, loading }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '4px',
      flex: 1, padding: '0 24px', borderRight: '1px solid var(--border)',
    }}>
      <p className="label">{label}</p>
      {loading ? (
        <Skeleton width={80} height={40} style={{ marginTop: '4px' }} />
      ) : (
        <AnimatedCount target={value || 0} />
      )}
      <p className="caption">{sub}</p>
    </div>
  );
}

/* ─── Announcement Ticker ──────────────────────────────────── */
function Ticker({ announcements }) {
  if (!announcements?.length) return null;
  const text = announcements.map(a => a.message).join('    ·    ');

  return (
    <div style={{
      background: 'var(--brand-light)',
      border: '1px solid var(--brand-border)',
      borderRadius: 'var(--r-md)',
      padding: '8px 16px',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      fontSize: '13px',
      color: 'var(--brand-text)',
      fontWeight: 500,
    }}>
      <div className="marquee-track">
        <span>{text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
        <span>{text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
      </div>
    </div>
  );
}

/* ─── Mini Post Card (dashboard variant) ──────────────────── */
function MiniPost({ post }) {
  const author = post.user || {};
  return (
    <div style={{
      padding: '12px 0', borderBottom: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', gap: '6px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'var(--bg-surface)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)',
        }}>
          {author.name?.[0] || '?'}
        </div>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
          {post.is_anonymous ? 'Anonymous' : author.name || author.full_name}
        </span>
        <span className="mono-sm" style={{ marginLeft: 'auto', color: 'var(--text-tertiary)' }}>
          {post.created_at ? format(new Date(post.created_at), 'h:mm a') : ''}
        </span>
      </div>
      <p style={{
        fontSize: '14px', color: 'var(--text-body)', lineHeight: 1.55,
        display: '-webkit-box', WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {post.content}
      </p>
    </div>
  );
}

/* ─── Right Sidebar Widgets ────────────────────────────────── */
function MessWidget({ mess }) {
  if (!mess) return null;
  const meals = mess.meals || [];
  return (
    <div className="card" style={{ padding: '16px 18px' }}>
      <p className="label" style={{ marginBottom: '10px' }}>Today at mess</p>
      {meals.slice(0, 3).map((m, i) => (
        <div key={i} style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', padding: '6px 0',
          borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
        }}>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{m.meal_type}</p>
            <p className="caption">{m.start_time} – {m.end_time}</p>
          </div>
          <span style={{
            fontSize: '12px', fontWeight: 500, padding: '2px 8px',
            borderRadius: 'var(--r-full)',
            background: m.is_booked ? 'var(--success-bg)' : 'var(--bg-surface)',
            color: m.is_booked ? 'var(--success)' : 'var(--text-tertiary)',
          }}>
            {m.is_booked ? 'Booked ✓' : `₹${m.price}`}
          </span>
        </div>
      ))}
    </div>
  );
}

function EventsWidget({ events }) {
  return (
    <div className="card" style={{ padding: '16px 18px' }}>
      <p className="label" style={{ marginBottom: '10px' }}>Upcoming events</p>
      {(!events || events.length === 0) ? (
        <p className="caption">No events today</p>
      ) : events.slice(0, 3).map((ev, i) => (
        <div key={ev.id || i} style={{
          padding: '8px 0',
          borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
        }}>
          <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3 }}>{ev.title}</p>
          <p className="caption" style={{ marginTop: '2px' }}>
            {ev.start_time ? format(new Date(ev.start_time), 'MMM d · h:mm a') : ''}
          </p>
        </div>
      ))}
    </div>
  );
}

function WeatherWidget({ weather }) {
  if (!weather) return null;
  return (
    <div className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
      <div style={{ fontSize: '28px' }}>
        {weather.condition?.includes('Rain') ? '🌧️' : weather.condition?.includes('Cloud') ? '⛅' : '☀️'}
      </div>
      <div>
        <p style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
          {weather.temperature}°C
        </p>
        <p className="caption">{weather.condition || 'Vadodara, Gujarat'}</p>
      </div>
    </div>
  );
}

/* ─── Dashboard Page ────────────────────────────────────────── */
export default function Dashboard() {
  const user = useAuthStore(s => s.user);
  const firstName = user?.full_name?.split(' ')[0] || user?.name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const { data: pulseData, isLoading: pulseLoading } = useQuery({
    queryKey: qk.pulse(),
    queryFn: () => api.get('/api/pulse'),
    refetchInterval: 30_000,
  });

  const { data: feedData, isLoading: feedLoading } = useQuery({
    queryKey: qk.feed('for_you'),
    queryFn: () => api.get('/api/feed/posts?filter=for_you&page=1&limit=5'),
  });

  const { data: messData } = useQuery({
    queryKey: qk.mess(),
    queryFn: () => api.get('/api/mess/today'),
  });

  const { data: eventsData } = useQuery({
    queryKey: qk.events('today'),
    queryFn: () => api.get('/api/events?filter=today&limit=3'),
  });

  const { data: weatherData } = useQuery({
    queryKey: qk.weather(),
    queryFn: () => api.get('/api/weather'),
  });

  const pulse = pulseData?.data || pulseData || {};
  const posts = feedData?.data?.items || feedData?.items || [];
  const mess = messData?.data || messData;
  const events = eventsData?.data?.items || eventsData?.items || [];
  const weather = weatherData?.data || weatherData;
  const announcements = pulse?.announcements || [];

  // Activity level for heartbeat (0-100) based on online_count
  const activityLevel = Math.min(100, Math.round((pulse.online_count || 0) / 5));

  return (
    <div style={{ padding: '32px 40px', maxWidth: 'var(--content-max)', margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        <h2 className="h2">{greeting}, {firstName}</h2>
        <p className="mono-sm" style={{ color: 'var(--text-tertiary)', marginTop: '4px' }}>
          {format(new Date(), 'EEEE, MMMM d yyyy')}
        </p>
      </div>

      {/* Campus Pulse Widget */}
      <div className="card" style={{
        padding: '28px',
        borderLeftWidth: '4px', borderLeftStyle: 'solid', borderLeftColor: 'var(--brand)',
        boxShadow: 'var(--shadow-md)',
        borderRadius: 'var(--r-xl)',
        marginBottom: '16px',
      }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 className="h3">Campus Pulse</h3>
          <LiveBadge />
        </div>

        {/* Stat columns */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '24px', overflowX: 'auto' }}>
          <StatCol label="ONLINE NOW" value={pulse.online_count} sub="students" loading={pulseLoading} />
          <StatCol label="EVENTS TODAY" value={pulse.events_today} sub="happening" loading={pulseLoading} />
          <StatCol label="MEALS BOOKED" value={pulse.meals_booked} sub="today" loading={pulseLoading} />
          <div style={{ flex: 1, padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <p className="label">NEW POSTS</p>
            {pulseLoading ? <Skeleton width={80} height={40} style={{ marginTop: '4px' }} /> : <AnimatedCount target={pulse.new_posts || 0} />}
            <p className="caption">last hour</p>
          </div>
        </div>

        {/* THE HEARTBEAT LINE */}
        <HeartbeatLine activityLevel={activityLevel} />
      </div>

      {/* Announcement ticker */}
      <Ticker announcements={announcements} />

      {/* Two-column layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '65% 35%',
        gap: '24px',
        marginTop: '24px',
      }}>
        {/* Left: Recent feed */}
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '14px',
          }}>
            <h4 className="h4">Latest on campus</h4>
            <a href="/feed" style={{ fontSize: '13px', color: 'var(--brand)', fontWeight: 500 }}>
              Open feed →
            </a>
          </div>

          <div className="card" style={{ padding: '16px 20px' }}>
            {feedLoading ? (
              [1,2,3].map(i => <PostCardSkeleton key={i} />)
            ) : posts.length === 0 ? (
              <p className="caption" style={{ padding: '20px 0', textAlign: 'center' }}>No posts yet</p>
            ) : posts.map(p => <MiniPost key={p.id} post={p} />)}
          </div>
        </div>

        {/* Right: Widgets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <WeatherWidget weather={weather} />
          <MessWidget mess={mess} />
          <EventsWidget events={events} />
        </div>
      </div>
    </div>
  );
}
