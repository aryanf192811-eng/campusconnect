import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import api from '../lib/api';
import { qk } from '../lib/queryClient';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { DEPARTMENTS } from '../lib/constants';
import { Skeleton } from '../components/ui/Skeleton';

const YEARS = ['All Years', '1st Year', '2nd Year', '3rd Year', '4th Year'];

function PersonCard({ person }) {
  const navigate = useNavigate();
  return (
    <div
      className="card"
      style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', transition: 'all var(--t-fast)', borderRadius: 'var(--r-lg)' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
      onClick={() => navigate(`/profile/${person.id}`)}
    >
      <Avatar src={person.avatar_url} name={person.full_name} userId={person.id} size={52} status={person.status} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{person.full_name}</p>
        </div>
        <p className="caption" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {person.department} · {person.year}
        </p>
        {person.bio && (
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {person.bio}
          </p>
        )}
      </div>
      <Badge variant={person.status === 'free' ? 'success' : 'default'} style={{ flexShrink: 0, fontSize: '11px' }}>
        {person.status === 'free' ? 'Free' : person.status === 'studying' ? 'Studying' : 'Busy'}
      </Badge>
    </div>
  );
}

export default function People() {
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('');
  const [year, setYear] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filters = { search, department: dept, year };

  const { data, isLoading } = useQuery({
    queryKey: qk.people(filters),
    queryFn: () => api.get(`/api/users?search=${search}&department=${dept}&year=${year}&limit=40`),
    keepPreviousData: true,
  });

  const people = data?.data?.items || data?.items || [];

  return (
    <div style={{ padding: '32px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 className="h2">People</h2>
          <p className="caption" style={{ marginTop: '4px' }}>Find and connect with fellow students</p>
        </div>
      </div>

      {/* Search + filter bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-full)', padding: '0 16px', boxShadow: 'var(--shadow-sm)' }}>
          <Search size={15} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or enrollment..."
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: '14px', color: 'var(--text-primary)', padding: '12px 0' }}
          />
        </div>
        <button onClick={() => setShowFilters(f => !f)} style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px',
          background: showFilters ? 'var(--brand-light)' : 'var(--bg-card)',
          border: `1px solid ${showFilters ? 'var(--brand-border)' : 'var(--border)'}`,
          color: showFilters ? 'var(--brand)' : 'var(--text-secondary)',
          borderRadius: 'var(--r-full)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 500,
        }}>
          <SlidersHorizontal size={15} />
          Filters
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', padding: '16px', background: 'var(--bg-card)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)' }}>
          <div style={{ flex: 1 }}>
            <p className="label" style={{ marginBottom: '8px' }}>Department</p>
            <select value={dept} onChange={e => setDept(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', background: 'var(--bg-surface)', fontFamily: 'inherit', fontSize: '13px', outline: 'none' }}>
              <option value="">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <p className="label" style={{ marginBottom: '8px' }}>Year</p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {YEARS.map(y => (
                <button key={y} onClick={() => setYear(y === 'All Years' ? '' : y)} style={{
                  padding: '5px 12px', borderRadius: 'var(--r-full)', fontFamily: 'inherit', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                  background: (y === 'All Years' && !year) || year === y ? 'var(--brand)' : 'var(--bg-surface)',
                  color: (y === 'All Years' && !year) || year === y ? 'white' : 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                }}>
                  {y}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <p className="caption" style={{ marginBottom: '16px' }}>
        {isLoading ? 'Searching...' : `${people.length} students found`}
      </p>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
        {isLoading
          ? [1,2,3,4,5,6].map(i => <Skeleton key={i} height={80} />)
          : people.map(p => <PersonCard key={p.id} person={p} />)
        }
      </div>
    </div>
  );
}
