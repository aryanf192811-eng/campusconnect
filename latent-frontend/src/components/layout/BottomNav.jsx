import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Rss, Map, UtensilsCrossed, User } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const BOTTOM_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/feed',      icon: Rss,             label: 'Feed' },
  { to: '/map',       icon: Map,             label: 'Map', center: true },
  { to: '/mess',      icon: UtensilsCrossed, label: 'Mess' },
];

export function BottomNav() {
  const { user } = useAuthStore();

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      zIndex: 100,
      background: 'var(--bg-card)',
      borderTop: '1px solid var(--border)',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {BOTTOM_ITEMS.map(({ to, icon: Icon, label, center }) => (
        <NavLink
          key={to}
          to={to}
          style={({ isActive }) => ({
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '3px', flex: 1, height: '100%',
            color: isActive ? 'var(--brand)' : 'var(--text-tertiary)',
            textDecoration: 'none',
            position: 'relative',
          })}
        >
          {({ isActive }) => (
            <>
              <Icon size={center ? 24 : 20} strokeWidth={isActive ? 2.5 : 1.8} />
              <span style={{ fontSize: '10px', fontWeight: isActive ? 600 : 400 }}>{label}</span>
              {isActive && (
                <span style={{
                  position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)',
                  width: '4px', height: '4px', borderRadius: '50%',
                  background: 'var(--brand)',
                }} />
              )}
            </>
          )}
        </NavLink>
      ))}

      {/* Profile tab */}
      <NavLink
        to={`/profile/${user?.id}`}
        style={({ isActive }) => ({
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '3px', flex: 1, height: '100%',
          color: isActive ? 'var(--brand)' : 'var(--text-tertiary)',
          textDecoration: 'none', position: 'relative',
        })}
      >
        {({ isActive }) => (
          <>
            <User size={20} strokeWidth={isActive ? 2.5 : 1.8} />
            <span style={{ fontSize: '10px', fontWeight: isActive ? 600 : 400 }}>Profile</span>
          </>
        )}
      </NavLink>
    </nav>
  );
}
