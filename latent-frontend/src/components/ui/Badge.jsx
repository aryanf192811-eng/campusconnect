import React from 'react';

const variantMap = {
  default: { bg: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' },
  brand:   { bg: 'var(--brand-light)', color: 'var(--brand-text)', border: 'none' },
  success: { bg: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success-border)' },
  warning: { bg: 'var(--warning-bg)', color: 'var(--accent-text)', border: 'none' },
  danger:  { bg: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger-border)' },
  accent:  { bg: 'var(--accent-light)', color: 'var(--accent-text)', border: 'none' },
};

export function Badge({ children, variant = 'default', dot, style, className = '' }) {
  const v = variantMap[variant] || variantMap.default;
  return (
    <span
      className={`badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 10px',
        borderRadius: 'var(--r-full)',
        fontSize: '12px',
        fontWeight: 500,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        ...v,
        ...style,
      }}
    >
      {dot && (
        <span style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: 'currentColor', flexShrink: 0,
        }} />
      )}
      {children}
    </span>
  );
}

export function LiveBadge() {
  return (
    <Badge variant="success" dot style={{ animation: 'none' }}>
      Live
    </Badge>
  );
}
