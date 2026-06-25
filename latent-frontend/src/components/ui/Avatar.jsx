import React from 'react';
import { userColor } from '../../lib/constants';

const STATUS_COLORS = {
  free:      '#10B981',
  studying:  '#2563EB',
  at_mess:   '#F59E0B',
  at_gym:    '#F97316',
  in_class:  '#94A3B8',
  in_hostel: '#A855F7',
};

const SIZES = [24, 32, 40, 44, 48, 64, 80, 88, 96];

/**
 * Avatar component — shows image or seeded initials fallback.
 * Props: src, name, userId, size (number, default 40), status, ring, onClick
 */
export function Avatar({ src, name, userId, size = 40, status, ring = false, onClick, style }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';
  const bg = userColor(userId || name?.charCodeAt(0) || 0);

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
    >
      {src ? (
        <img
          src={src}
          alt={name || 'avatar'}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            objectFit: 'cover',
            border: ring ? '3px solid white' : undefined,
            display: 'block',
          }}
          onError={e => { e.target.style.display = 'none'; }}
        />
      ) : (
        <div style={{
          width: size, height: size,
          borderRadius: '50%',
          background: bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white',
          fontSize: size * 0.36,
          fontWeight: 700,
          fontFamily: 'Space Grotesk, sans-serif',
          border: ring ? '3px solid white' : undefined,
          flexShrink: 0,
          userSelect: 'none',
        }}>
          {initials}
        </div>
      )}

      {status && (
        <span style={{
          position: 'absolute',
          bottom: ring ? 1 : 0,
          right: ring ? 1 : 0,
          width: Math.max(10, size * 0.22),
          height: Math.max(10, size * 0.22),
          borderRadius: '50%',
          background: STATUS_COLORS[status] || '#94A3B8',
          border: '2px solid white',
        }} />
      )}
    </div>
  );
}

/**
 * Avatar stack for showing multiple users
 */
export function AvatarStack({ users = [], size = 28, max = 4 }) {
  const shown = users.slice(0, max);
  const rest = users.length - max;

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {shown.map((u, i) => (
        <div key={u.id || i} style={{ marginLeft: i > 0 ? -size * 0.3 : 0, zIndex: shown.length - i }}>
          <Avatar src={u.avatar_url} name={u.name || u.full_name} userId={u.id} size={size} ring />
        </div>
      ))}
      {rest > 0 && (
        <div style={{
          marginLeft: -size * 0.3,
          width: size, height: size,
          borderRadius: '50%',
          background: 'var(--bg-surface)',
          border: '2px solid white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.32,
          fontWeight: 600,
          color: 'var(--text-secondary)',
        }}>
          +{rest}
        </div>
      )}
    </div>
  );
}
