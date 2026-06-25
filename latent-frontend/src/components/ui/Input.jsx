import React, { useState, useId } from 'react';

/**
 * Floating label input — the label rises when focused or filled.
 * Props: label, type, value, onChange, error, hint, icon (left), iconRight, inputRef, ...rest
 */
export function Input({
  label,
  type = 'text',
  value,
  onChange,
  error,
  hint,
  icon: LeftIcon,
  iconRight: RightIcon,
  onRightIconClick,
  inputRef,
  className = '',
  style,
  ...rest
}) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const hasValue = value !== undefined ? String(value).length > 0 : false;
  const floated = focused || hasValue;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', ...style }} className={className}>
      <div style={{ position: 'relative' }}>
        {LeftIcon && (
          <span style={{
            position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
            color: focused ? 'var(--brand)' : 'var(--text-tertiary)',
            display: 'flex', alignItems: 'center', transition: 'color var(--t-fast)',
            pointerEvents: 'none', zIndex: 1,
          }}>
            <LeftIcon size={16} />
          </span>
        )}

        <input
          id={id}
          ref={inputRef}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder=" "
          style={{
            width: '100%',
            background: error ? 'var(--danger-bg)' : focused ? 'var(--bg-card)' : 'var(--bg-surface)',
            border: `1px solid ${error ? 'var(--danger)' : focused ? 'var(--brand)' : 'var(--border)'}`,
            borderRadius: 'var(--r-md)',
            padding: `${label ? '22px' : '12px'} ${RightIcon ? '44px' : '14px'} ${label ? '8px' : '12px'} ${LeftIcon ? '40px' : '14px'}`,
            fontFamily: 'inherit',
            fontSize: '15px',
            color: 'var(--text-primary)',
            outline: 'none',
            transition: 'border-color var(--t-fast), box-shadow var(--t-fast), background var(--t-fast)',
            boxShadow: focused ? '0 0 0 3px var(--brand-light)' : error ? '0 0 0 3px var(--danger-bg)' : 'none',
          }}
          {...rest}
        />

        {label && (
          <label
            htmlFor={id}
            style={{
              position: 'absolute',
              left: LeftIcon ? '40px' : '14px',
              top: floated ? '8px' : '50%',
              transform: floated ? 'none' : 'translateY(-50%)',
              fontSize: floated ? '11px' : '15px',
              color: error ? 'var(--danger)' : floated ? 'var(--brand)' : 'var(--text-tertiary)',
              fontWeight: floated ? 600 : 400,
              pointerEvents: 'none',
              transition: 'all var(--t-fast)',
              lineHeight: 1,
            }}
          >
            {label}
          </label>
        )}

        {RightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            style={{
              position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center',
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
            }}
          >
            <RightIcon size={16} />
          </button>
        )}
      </div>

      {error && (
        <span style={{ fontSize: '12px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {error}
        </span>
      )}
      {hint && !error && (
        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{hint}</span>
      )}
    </div>
  );
}

/**
 * Textarea with floating label + char counter
 */
export function Textarea({ label, value, onChange, maxLength, rows = 4, error, style, ...rest }) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const len = value?.length || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', ...style }}>
      <div style={{ position: 'relative' }}>
        <textarea
          id={id}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          maxLength={maxLength}
          rows={rows}
          placeholder=" "
          style={{
            width: '100%',
            background: focused ? 'var(--bg-card)' : 'var(--bg-surface)',
            border: `1px solid ${error ? 'var(--danger)' : focused ? 'var(--brand)' : 'var(--border)'}`,
            borderRadius: 'var(--r-md)',
            padding: label ? '22px 14px 8px' : '12px 14px',
            fontFamily: 'inherit',
            fontSize: '15px',
            color: 'var(--text-primary)',
            outline: 'none',
            resize: 'vertical',
            boxShadow: focused ? '0 0 0 3px var(--brand-light)' : 'none',
            transition: 'border-color var(--t-fast), box-shadow var(--t-fast)',
          }}
          {...rest}
        />
        {label && (
          <label
            htmlFor={id}
            style={{
              position: 'absolute', left: '14px', top: '8px',
              fontSize: '11px', color: focused ? 'var(--brand)' : 'var(--text-tertiary)',
              fontWeight: 600, pointerEvents: 'none',
            }}
          >
            {label}
          </label>
        )}
      </div>
      {maxLength && (
        <span style={{
          fontSize: '11px',
          fontFamily: 'JetBrains Mono, monospace',
          color: len >= maxLength * 0.9 ? 'var(--danger)' : 'var(--text-tertiary)',
          textAlign: 'right',
        }}>
          {len}/{maxLength}
        </span>
      )}
      {error && <span style={{ fontSize: '12px', color: 'var(--danger)' }}>{error}</span>}
    </div>
  );
}

/**
 * OTP Input — 6 individual inputs with auto-advance and paste support
 */
export function OTPInput({ value = '', onChange, length = 6, error }) {
  const inputs = Array.from({ length });
  const vals = value.split('');

  const handleChange = (i, e) => {
    const v = e.target.value.replace(/\D/g, '').slice(-1);
    const next = [...vals];
    next[i] = v;
    onChange(next.join(''));
    if (v && i < length - 1) {
      document.getElementById(`otp-${i + 1}`)?.focus();
    }
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !vals[i] && i > 0) {
      document.getElementById(`otp-${i - 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted);
    document.getElementById(`otp-${Math.min(pasted.length, length - 1)}`)?.focus();
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        {inputs.map((_, i) => (
          <input
            key={i}
            id={`otp-${i}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={vals[i] || ''}
            onChange={e => handleChange(i, e)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            style={{
              width: '52px', height: '60px',
              textAlign: 'center',
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '24px', fontWeight: 700,
              border: `2px solid ${vals[i] ? 'var(--brand)' : error ? 'var(--danger)' : 'var(--border)'}`,
              borderRadius: 'var(--r-md)',
              background: vals[i] ? 'var(--brand-light)' : 'var(--bg-surface)',
              color: 'var(--text-primary)',
              outline: 'none',
              transition: 'border-color var(--t-fast), background var(--t-fast)',
            }}
            onFocus={e => e.target.select()}
          />
        ))}
      </div>
      {error && <p style={{ textAlign: 'center', color: 'var(--danger)', fontSize: '13px', marginTop: '8px' }}>{error}</p>}
    </div>
  );
}
