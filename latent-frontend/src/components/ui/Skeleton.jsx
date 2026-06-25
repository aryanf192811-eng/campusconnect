import React from 'react';

/** Generic skeleton block */
export function Skeleton({ width, height = 16, borderRadius, style, className = '' }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: borderRadius || 'var(--r-sm)', ...style }}
    />
  );
}

/** Skeleton circle (for avatars) */
export function SkeletonCircle({ size = 40 }) {
  return <Skeleton width={size} height={size} borderRadius="50%" />;
}

/** Skeleton text line */
export function SkeletonText({ width = '100%', lines = 1, gap = 8 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={typeof width === 'string' ? width : `${width}px`}
          height={14}
          style={{ opacity: 1 - i * 0.2 }}
        />
      ))}
    </div>
  );
}

/** Skeleton for PostCard */
export function PostCardSkeleton() {
  return (
    <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <SkeletonCircle size={44} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          <Skeleton width={140} height={14} />
          <Skeleton width={90} height={12} />
        </div>
      </div>
      {/* Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Skeleton width="100%" height={14} />
        <Skeleton width="85%" height={14} />
        <Skeleton width="70%" height={14} />
      </div>
      {/* Reactions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {[70, 60, 60, 60, 60].map((w, i) => (
          <Skeleton key={i} width={w} height={32} borderRadius="var(--r-full)" />
        ))}
      </div>
    </div>
  );
}

/** Skeleton for EventCard */
export function EventCardSkeleton() {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <Skeleton height={160} borderRadius="0" />
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Skeleton width={80} height={12} />
        <Skeleton width="80%" height={18} />
        <Skeleton width={120} height={12} />
        <Skeleton width={100} height={12} />
      </div>
    </div>
  );
}

/** Skeleton for PeopleCard */
export function PeopleCardSkeleton() {
  return (
    <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <SkeletonCircle size={64} />
      <Skeleton width={120} height={16} />
      <Skeleton width={80} height={12} />
      <Skeleton width={100} height={32} borderRadius="var(--r-full)" />
    </div>
  );
}

/** Skeleton for ClubCard */
export function ClubCardSkeleton() {
  return (
    <div className="card" style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
      <Skeleton height={100} borderRadius="0" />
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '28px' }}>
        <Skeleton width={140} height={16} />
        <Skeleton width={80} height={12} />
        <Skeleton width="100%" height={12} />
        <Skeleton width="80%" height={12} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
          <Skeleton width={80} height={12} />
          <Skeleton width={60} height={28} borderRadius="var(--r-full)" />
        </div>
      </div>
    </div>
  );
}

/** Skeleton for Market listing card */
export function MarketCardSkeleton() {
  return (
    <div className="card" style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
      <Skeleton height={160} borderRadius="0" />
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Skeleton width="80%" height={16} />
        <Skeleton width={60} height={22} borderRadius="var(--r-full)" />
        <Skeleton width="100%" height={12} />
        <Skeleton width="70%" height={12} />
      </div>
    </div>
  );
}
