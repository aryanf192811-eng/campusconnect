import React from 'react';

/**
 * EmptyState — used when a list returns 0 items.
 * Props: icon (ReactNode SVG), title, description, action { label, onClick }
 */
export function EmptyState({ icon, title, description, action }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 24px',
      textAlign: 'center',
      gap: '16px',
    }}>
      {icon && (
        <div style={{
          width: 80, height: 80,
          borderRadius: 'var(--r-xl)',
          background: 'var(--brand-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '4px',
        }}>
          {icon}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <h4 className="h4" style={{ fontSize: '17px' }}>{title}</h4>
        {description && <p className="caption">{description}</p>}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: '8px',
            padding: '8px 20px',
            borderRadius: 'var(--r-full)',
            background: 'var(--brand)',
            color: 'white',
            border: 'none',
            fontFamily: 'inherit',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/* Preset empty state illustrations (inline SVG line-art) */

export function EmptyFeed() {
  return <EmptyState
    icon={<svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 4C10.268 4 4 10.268 4 18s6.268 14 14 14 14-6.268 14-14S25.732 4 18 4z"/><path d="M18 12v6l4 2"/><path d="M12 18h1M23 18h1M18 8v1M18 27v1"/></svg>}
    title="The feed is quiet"
    description="No posts match this filter yet. Be the first to post!"
  />;
}

export function EmptyEvents() {
  return <EmptyState
    icon={<svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="7" width="26" height="24" rx="3"/><path d="M24 4v6M12 4v6M5 16h26"/><path d="M13 22l3 3 7-7"/></svg>}
    title="No events found"
    description="Check back soon — your clubs will post new events here."
  />;
}

export function EmptyNotifications() {
  return <EmptyState
    icon={<svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 4a3 3 0 0 0-3 3v1.5A8 8 0 0 0 10 16v6l-3 3h22l-3-3v-6a8 8 0 0 0-5-7.5V7a3 3 0 0 0-3-3z"/><path d="M16 29a2 2 0 0 0 4 0"/><text x="22" y="14" fontSize="10" fill="var(--brand)" fontWeight="bold">z</text></svg>}
    title="All caught up!"
    description="No notifications right now. Enjoy the quiet."
  />;
}

export function EmptySearch() {
  return <EmptyState
    icon={<svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="16" cy="16" r="10"/><path d="M26 26l6 6"/><path d="M13 13l6 6M19 13l-6 6"/></svg>}
    title="Nothing found"
    description="Try adjusting your filters or search term."
  />;
}

export function EmptyMarket() {
  return <EmptyState
    icon={<svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h24l-3 14H9L6 4z"/><circle cx="13" cy="30" r="2"/><circle cx="25" cy="30" r="2"/><path d="M1 4h5"/></svg>}
    title="No listings yet"
    description="Be the first to list something in this category."
  />;
}

export function EmptyClubs() {
  return <EmptyState
    icon={<svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="12" r="6"/><path d="M6 30c0-6 5-10 12-10s12 4 12 10"/></svg>}
    title="No clubs found"
    description="Try a different category or check back later."
  />;
}

export function EmptyLostFound() {
  return <EmptyState
    icon={<svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="16" cy="16" r="10"/><path d="M26 26l6 6"/><path d="M16 12v4l2 2"/></svg>}
    title="No items reported"
    description="Be the first to report a lost or found item."
  />;
}
