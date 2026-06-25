import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Briefcase, MessageCircle, ExternalLink, Search } from 'lucide-react';
import api from '../lib/api';
import { qk } from '../lib/queryClient';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { DEPARTMENTS } from '../lib/constants';
import { Skeleton } from '../components/ui/Skeleton';

function SeniorCard({ senior }) {
  return (
    <div className="card" style={{ padding: '20px', borderRadius: 'var(--r-xl)', transition: 'all var(--t-fast)', display: 'flex', flexDirection: 'column', gap: '14px' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
    >
      {/* Header */}
      <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
        <Avatar src={senior.avatar_url} name={senior.full_name} userId={senior.id} size={56} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>{senior.full_name}</h4>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <Badge style={{ fontSize: '11px' }}>{senior.department}</Badge>
            {senior.batch && <Badge variant="default" style={{ fontSize: '11px' }}>Batch {senior.batch}</Badge>}
          </div>
        </div>
      </div>

      {/* Company / Role */}
      {(senior.company || senior.role) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: 'var(--r-md)' }}>
          <Briefcase size={14} style={{ color: 'var(--brand)', flexShrink: 0 }} />
          <span style={{ fontSize: '13px', color: 'var(--text-body)', fontWeight: 500 }}>
            {senior.role ? `${senior.role} at ` : ''}{senior.company || senior.role}
          </span>
        </div>
      )}

      {/* Bio */}
      {senior.bio && (
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {senior.bio}
        </p>
      )}

      {/* Tags / skills */}
      {senior.skills?.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {senior.skills.slice(0, 4).map(s => (
            <span key={s} style={{ padding: '2px 10px', borderRadius: 'var(--r-full)', background: 'var(--brand-light)', color: 'var(--brand-text)', fontSize: '11px', fontWeight: 500 }}>{s}</span>
          ))}
        </div>
      )}

      {/* CTA */}
      <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
        <Button variant="primary" size="sm" icon={<MessageCircle size={13} />} style={{ flex: 1 }}>
          Connect
        </Button>
        {senior.linkedin_url && (
          <a href={senior.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 10px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'transparent', display: 'flex', alignItems: 'center', color: 'var(--brand)' }}>
            <ExternalLink size={15} />
          </a>
        )}
      </div>
    </div>
  );
}

export default function Seniors() {
  const [dept, setDept] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: qk.seniors(dept),
    queryFn: () => api.get(`/api/seniors?department=${dept}&search=${search}&limit=24`),
  });

  const seniors = data?.data?.items || data?.items || [];

  return (
    <div style={{ padding: '32px 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={22} style={{ color: 'var(--brand)' }} />
          </div>
          <h2 className="h2">Seniors & Alumni</h2>
        </div>
        <p className="caption">Learn from those who walked this campus before you</p>
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-full)', padding: '0 16px' }}>
          <Search size={15} style={{ color: 'var(--text-tertiary)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, company, or skill..." style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: '14px', padding: '11px 0' }} />
        </div>
      </div>

      {/* Dept filter pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px' }}>
        {['', ...DEPARTMENTS].map(d => (
          <button key={d || 'all'} onClick={() => setDept(d)} style={{
            padding: '6px 16px', borderRadius: 'var(--r-full)',
            border: `1px solid ${dept === d ? 'var(--brand)' : 'var(--border)'}`,
            background: dept === d ? 'var(--brand)' : 'var(--bg-card)',
            color: dept === d ? 'white' : 'var(--text-secondary)',
            fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {d || 'All Departments'}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
        {isLoading
          ? [1,2,3,4,5,6].map(i => <Skeleton key={i} height={260} />)
          : seniors.length === 0 ? (
            <p className="caption" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 0' }}>No seniors found. Be the first to register!</p>
          ) : seniors.map(s => <SeniorCard key={s.id} senior={s} />)
        }
      </div>
    </div>
  );
}
