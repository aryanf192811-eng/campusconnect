import React from 'react';
import { motion } from 'framer-motion';

const sizeMap = {
  sm: { height: '32px', fontSize: '12px', padding: '0 14px' },
  md: { height: '40px', fontSize: '14px', padding: '0 18px' },
  lg: { height: '48px', fontSize: '15px', padding: '0 24px' },
};

const variantStyles = {
  primary: {
    background: 'var(--brand)',
    color: 'white',
    border: 'none',
    boxShadow: '0 1px 2px rgba(37,99,235,0.3)',
  },
  secondary: {
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-medium)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border)',
  },
  danger: {
    background: 'var(--danger-bg)',
    color: 'var(--danger)',
    border: '1px solid var(--danger-border)',
  },
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconRight,
  fullWidth = false,
  onClick,
  type = 'button',
  style,
  className = '',
  ...props
}) {
  const sz = sizeMap[size];
  const vr = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      whileTap={{ scale: isDisabled ? 1 : 0.97 }}
      whileHover={
        !isDisabled
          ? variant === 'primary'
            ? { scale: 1.01, boxShadow: '0 4px 12px rgba(37,99,235,0.35)' }
            : { scale: 1.01 }
          : {}
      }
      style={{
        ...sz,
        ...vr,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        borderRadius: 'var(--r-full)',
        fontFamily: 'inherit',
        fontWeight: 500,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        transition: 'background var(--t-fast), border-color var(--t-fast)',
        width: fullWidth ? '100%' : undefined,
        textDecoration: 'none',
        flexShrink: 0,
        ...style,
      }}
      className={className}
      {...props}
    >
      {loading ? (
        <Spinner color={variant === 'primary' ? 'white' : 'var(--brand)'} />
      ) : (
        <>
          {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
          {children}
          {iconRight && <span style={{ display: 'flex', alignItems: 'center' }}>{iconRight}</span>}
        </>
      )}
    </motion.button>
  );
}

function Spinner({ color = 'currentColor' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" style={{ animation: 'spin 0.7s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="8" cy="8" r="6" fill="none" stroke={color} strokeWidth="2" strokeDasharray="25 15" strokeLinecap="round" />
    </svg>
  );
}
