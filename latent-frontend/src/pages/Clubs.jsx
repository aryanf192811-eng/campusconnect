import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Sparkles } from 'lucide-react';
import api from '../lib/api';
import { qk } from '../lib/queryClient';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ClubCardSkeleton } from '../components/ui/Skeleton';
import { EmptyClubs } from '../components/empty/EmptyState';

const CLUB_CATEGORIES = [
  { id: 'all',        label: 'All' },
  { id: 'technical',  label: 'Technical' },
  { id: 'cultural',   label: 'Cultural' },
  { id: 'sports',     label: 'Sports' },
  { id: 'social',     label: 'Social' },
  { id: 'academic',   label: 'Academic' },
  { id: 'media',      label: 'Media' },
];

function ClubCard({ club }) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const joinMutation = useMutation({
    mutationFn: () => club.is_member
      ? api.delete(`/api/clubs/${club.id}/leave`)
      : api.post(`/api/clubs/${club.id}/join`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clubs'] }),
  });

  return (
    <div
      className="card"
      style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden', cursor: 'pointer', transition: 'all var(--t-base)' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
      onClick={() => navigate(`/clubs/${club.id}`)}
    >
      {/* Cover */}
      <div style={{
        width: '100%', height: '100px', position: 'relative',
        background: club.cover_gradient || `linear-gradient(135deg, var(--brand-light), var(--accent-light))`,
        overflow: 'hidden',
      }}>
        {club.banner_url && (
          <img src={club.banner_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
        )}
      </div>

      <div style={{ padding: '14px 16px 16px', position: 'relative' }}>
        {/* Logo overlapping cover */}
        <div style={{
          position: 'absolute', top: '-22px', left: '16px',
          width: 44, height: 44, borderRadius: 'var(--r-md)',
          border: '3px solid var(--bg-card)', overflow: 'hidden',
          background: 'var(--bg-card)', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--shadow-sm)',
        }}>
          {club.logo_url
            ? <img src={club.logo_url} alt={club.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontWeight: 800, fontSize: '18px', color: 'var(--brand)' }}>{club.name?.[0]}</span>
          }
        </div>

        <div style={{ marginTop: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
            <h4 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.3, flex: 1, marginRight: '8px' }}>
              {club.name}
            </h4>
            {club.is_recruiting && (
              <Badge variant="success" style={{ flexShrink: 0 }}>Recruiting</Badge>
            )}
          </div>

          <p className="caption" style={{ marginBottom: '10px' }}>{club.category}</p>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {club.description}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-tertiary)' }}>
              <Users size={13} />
              <span style={{ fontSize: '12px' }}>{club.member_count || 0} members</span>
            </div>
            <button
              onClick={e => { e.stopPropagation(); joinMutation.mutate(); }}
              style={{
                padding: '5px 14px', borderRadius: 'var(--r-full)',
                border: `1px solid ${club.is_member ? 'var(--border)' : 'var(--brand)'}`,
                background: club.is_member ? 'transparent' : 'var(--brand)',
                color: club.is_member ? 'var(--text-secondary)' : 'white',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all var(--t-fast)',
              }}
            >
              {joinMutation.isPending ? '...' : club.is_member ? 'Joined' : 'Join'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Clubs() {
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: qk.clubs(category),
    queryFn: () => api.get(`/api/clubs?category=${category}&limit=30`),
  });

  const clubs = (data?.data?.items || data?.items || [])
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ padding: '32px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h2 className="h2">Clubs</h2>
          <p className="caption" style={{ marginTop: '4px' }}>Join communities that match your passion</p>
        </div>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-full)', padding: '0 14px', boxShadow: 'var(--shadow-sm)' }}>
          <Search size={15} style={{ color: 'var(--text-tertiary)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clubs..."
            style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: '14px', color: 'var(--text-primary)', padding: '10px 0', width: '200px' }}
          />
        </div>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
        <div className="tab-bar">
          {CLUB_CATEGORIES.map(cat => (
            <button key={cat.id} className={`tab-item${category === cat.id ? ' active' : ''}`} onClick={() => setCategory(cat.id)}>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
          {[1,2,3,4,5,6].map(i => <ClubCardSkeleton key={i} />)}
        </div>
      ) : clubs.length === 0 ? (
        <EmptyClubs />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
          {clubs.map(club => <ClubCard key={club.id} club={club} />)}
        </div>
      )}
    </div>
  );
}
