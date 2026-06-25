import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, PackageSearch, Plus, Tag, MapPin, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import api from '../lib/api';
import { qk } from '../lib/queryClient';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Skeleton } from '../components/ui/Skeleton';
import { Modal } from '../components/ui/Modal';
import { Input, Textarea } from '../components/ui/Input';

const TYPES = [
  { id: 'all',  label: 'All' },
  { id: 'lost', label: 'Lost' },
  { id: 'found',label: 'Found' },
];

function ItemCard({ item }) {
  const isLost = item.type === 'lost';
  const author = item.user || {};
  return (
    <div className="card" style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden', transition: 'all var(--t-fast)' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
    >
      {/* Image */}
      <div style={{ width: '100%', height: '160px', background: 'var(--bg-surface)', position: 'relative', overflow: 'hidden' }}>
        {item.image_url
          ? <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PackageSearch size={40} style={{ color: 'var(--border-medium)', opacity: 0.5 }} />
            </div>
          )
        }
        <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
          <Badge variant={isLost ? 'danger' : 'success'}>{isLost ? 'LOST' : 'FOUND'}</Badge>
        </div>
        {item.status === 'resolved' && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: '14px', background: 'var(--success)', padding: '4px 14px', borderRadius: 'var(--r-full)' }}>Resolved ✓</span>
          </div>
        )}
      </div>

      <div style={{ padding: '14px 16px' }}>
        <h4 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>{item.title}</h4>
        {item.location_hint && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }} className="caption">
            <MapPin size={12} style={{ color: 'var(--brand)' }} />
            {item.location_hint}
          </div>
        )}
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {item.description}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Avatar src={author.avatar_url} name={author.name} userId={author.id} size={26} />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{author.name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }} className="mono-sm">
            <Clock size={11} style={{ color: 'var(--text-tertiary)' }} />
            {item.created_at ? format(parseISO(item.created_at), 'MMM d') : ''}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LostFound() {
  const [type, setType] = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type: 'lost', title: '', description: '', location_hint: '' });
  const [loading, setLoading] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: qk.lostFound(type),
    queryFn: () => api.get(`/api/lost-found?type=${type}&search=${search}&limit=24`),
  });

  const items = (data?.data?.items || data?.items || []);

  const handleReport = async () => {
    setLoading(true);
    try {
      await api.post('/api/lost-found', form);
      setShowModal(false);
      setForm({ type: 'lost', title: '', description: '', location_hint: '' });
      refetch();
    } catch {}
    setLoading(false);
  };

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 className="h2">Lost & Found</h2>
          <p className="caption" style={{ marginTop: '4px' }}>Help reunite lost items with their owners</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowModal(true)}>Report Item</Button>
      </div>

      {/* Search + type filter */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-full)', padding: '0 16px' }}>
          <Search size={15} style={{ color: 'var(--text-tertiary)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..." style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: '14px', padding: '11px 0' }} />
        </div>
        <div className="tab-bar">
          {TYPES.map(t => (
            <button key={t.id} className={`tab-item${type === t.id ? ' active' : ''}`} onClick={() => setType(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '18px' }}>
        {isLoading
          ? [1,2,3,4,5,6].map(i => <Skeleton key={i} height={280} />)
          : items.map(item => <ItemCard key={item.id} item={item} />)
        }
      </div>

      {/* Report Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Report an item">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px 0' }}>
          {/* Lost / Found toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-surface)', borderRadius: 'var(--r-full)', padding: '4px', border: '1px solid var(--border)' }}>
            {['lost', 'found'].map(t => (
              <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))} style={{
                flex: 1, padding: '8px', borderRadius: 'var(--r-full)',
                background: form.type === t ? (t === 'lost' ? 'var(--danger)' : 'var(--success)') : 'transparent',
                color: form.type === t ? 'white' : 'var(--text-secondary)',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, textTransform: 'capitalize', transition: 'all var(--t-fast)',
              }}>{t}</button>
            ))}
          </div>
          <Input label="Item name" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <Textarea label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
          <Input label="Last seen / Found at location" value={form.location_hint} onChange={e => setForm(f => ({ ...f, location_hint: e.target.value }))} icon={MapPin} />
          <Button fullWidth loading={loading} onClick={handleReport}>Submit Report</Button>
        </div>
      </Modal>
    </div>
  );
}
