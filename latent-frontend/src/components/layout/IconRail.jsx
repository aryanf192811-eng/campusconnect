import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Rss, Map, UtensilsCrossed, CalendarDays,
  Users, Building2, UserCheck, ShoppingBag, Search, Car, BookOpen,
  Bell, LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Avatar } from '../ui/Avatar';

const NAV_ITEMS_TOP = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/feed',      icon: Rss,             label: 'Feed' },
  { to: '/map',       icon: Map,             label: 'Campus Map' },
  { to: '/mess',      icon: UtensilsCrossed, label: 'Mess' },
  { to: '/events',    icon: CalendarDays,    label: 'Events' },
];

const NAV_ITEMS_MID = [
  { to: '/people',  icon: Users,     label: 'People' },
  { to: '/clubs',   icon: Building2, label: 'Clubs' },
  { to: '/seniors', icon: UserCheck, label: 'Seniors' },
];

const NAV_ITEMS_BOT = [
  { to: '/market',       icon: ShoppingBag, label: 'Market' },
  { to: '/lost-found',   icon: Search,      label: 'Lost & Found' },
  { to: '/study-groups', icon: BookOpen,    label: 'Study Groups' },
];

function Separator() {
  return (
    <div style={{
      height: '1px',
      background: 'var(--border)',
      margin: '8px 12px',
      flexShrink: 0,
    }} />
  );
}

function NavItem({ to, icon: Icon, label, expanded }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        height: '44px',
        padding: '0 0 0 18px',
        borderRadius: 'var(--r-md)',
        margin: '1px 8px',
        color: isActive ? 'var(--brand)' : 'var(--text-tertiary)',
        background: isActive ? 'var(--brand-light)' : 'transparent',
        textDecoration: 'none',
        position: 'relative',
        transition: 'background var(--t-fast), color var(--t-fast)',
        overflow: 'hidden',
        flexShrink: 0,
        borderLeftWidth: '3px', borderLeftStyle: 'solid', borderLeftColor: isActive ? 'var(--brand)' : 'transparent',
        boxSizing: 'border-box',
      })}
      onMouseEnter={e => {
        if (!e.currentTarget.classList.contains('active')) {
          e.currentTarget.style.background = 'var(--bg-surface)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }
      }}
      onMouseLeave={e => {
        if (!e.currentTarget.classList.contains('active')) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text-tertiary)';
        }
      }}
    >
      {({ isActive }) => (
        <>
          <Icon size={20} style={{ flexShrink: 0 }} />
          <span style={{
            marginLeft: '12px',
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter Variable, Inter, sans-serif',
            color: isActive ? 'var(--brand-text)' : 'var(--text-primary)',
            opacity: expanded ? 1 : 0,
            whiteSpace: 'nowrap',
            transition: 'opacity var(--t-fast)',
            pointerEvents: 'none',
          }}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}

export function IconRail() {
  const [expanded, setExpanded] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{
        position: 'fixed',
        left: 0, top: 0, bottom: 0,
        zIndex: 100,
        width: expanded ? 'var(--nav-w-open)' : 'var(--nav-w)',
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        transition: 'width var(--t-base)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: expanded ? 'var(--shadow-lg)' : 'none',
      }}
    >
      {/* Logo */}
      <div style={{
        height: 'var(--header-h)',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '16px',
        flexShrink: 0,
        borderBottom: '1px solid var(--border)',
        gap: '10px',
      }}>
        {/* L-mark logo */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="7" fill="var(--brand-light)" />
            <text x="7" y="21" fontFamily="Space Grotesk, sans-serif" fontWeight="800" fontSize="18" fill="var(--brand)">L</text>
            {/* Brand-blue L-angle underline */}
            <path d="M7 22 L15 22" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" />
            <path d="M15 22 L15 19" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <span style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 800,
          fontSize: '18px',
          letterSpacing: '-0.04em',
          color: 'var(--text-primary)',
          opacity: expanded ? 1 : 0,
          transition: 'opacity var(--t-fast)',
          whiteSpace: 'nowrap',
        }}>
          LATENT
        </span>
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 0' }}>
        {NAV_ITEMS_TOP.map(item => (
          <NavItem key={item.to} {...item} expanded={expanded} />
        ))}
        <Separator />
        {NAV_ITEMS_MID.map(item => (
          <NavItem key={item.to} {...item} expanded={expanded} />
        ))}
        <Separator />
        {NAV_ITEMS_BOT.map(item => (
          <NavItem key={item.to} {...item} expanded={expanded} />
        ))}
      </div>

      {/* Bottom: User + Notifications + Logout */}
      <div style={{
        borderTop: '1px solid var(--border)',
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        flexShrink: 0,
      }}>
        <NavItem to="/notifications" icon={Bell} label="Notifications" expanded={expanded} />

        {/* User row */}
        <NavLink
          to={`/profile/${user?.id}`}
          style={{
            display: 'flex', alignItems: 'center', height: '44px',
            padding: '0 0 0 11px', borderRadius: 'var(--r-md)',
            gap: '10px', textDecoration: 'none',
            transition: 'background var(--t-fast)',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Avatar
            src={user?.avatar_url}
            name={user?.full_name || user?.name}
            userId={user?.id}
            size={30}
            status={user?.status}
          />
          <div style={{
            opacity: expanded ? 1 : 0,
            transition: 'opacity var(--t-fast)',
            overflow: 'hidden',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
              {user?.full_name || user?.name || 'You'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
              {user?.department || 'Student'}
            </div>
          </div>
        </NavLink>

        {expanded && (
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              height: '40px', paddingLeft: '11px',
              borderRadius: 'var(--r-md)',
              color: 'var(--danger)', fontSize: '13px', fontWeight: 500,
              transition: 'background var(--t-fast)',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-bg)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        )}
      </div>
    </div>
  );
}
