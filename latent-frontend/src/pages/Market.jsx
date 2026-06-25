import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Tag, Package, ShoppingBag } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import api from '../lib/api';
import { qk } from '../lib/queryClient';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { Modal } from '../components/ui/Modal';
import { Input, Textarea } from '../components/ui/Input';

const CATEGORIES = [
  { id: 'all',       label: 'All' },
  { id: 'books',     label: 'Books' },
  { id: 'gadgets',   label: 'Gadgets' },
  { id: 'clothing',  label: 'Clothing' },
  { id: 'notes',     label: 'Notes' },
  { id: 'services',  label: 'Services' },
  { id: 'other',     label: 'Other' },
];

function ListingCard({ item }) {
  const seller = item.seller || {};
  return (
    <div className="card" style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden', transition: 'all var(--t-fast)' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
    >
      {/* Image */}
      <div style={{ width: '100%', height: '160px', background: 'var(--bg-surface)', overflow: 'hidden', position: 'relative' }}>
        {item.image_urls?.[0]
          ? <img src={item.image_urls[0]} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={40} style={{ color: 'var(--border-medium)', opacity: 0.4 }} />
            </div>
          )
        }
        {item.status === 'sold' && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: '14px' }}>SOLD</span>
          </div>
        )}
      </div>

      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
          <h4 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.3, flex: 1, marginRight: '8px' }}>{item.title}</h4>
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '18px', color: 'var(--brand)', flexShrink: 0 }}>
            {item.price === 0 ? 'Free' : `₹${item.price}`}
          </span>
        </div>
        <Badge style={{ marginBottom: '8px' }}>{item.category}</Badge>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {item.description}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Avatar src={seller.avatar_url} name={seller.name} userId={seller.id} size={26} />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{seller.name}</span>
          </div>
          <button style={{ padding: '5px 14px', borderRadius: 'var(--r-full)', border: '1px solid var(--brand)', background: 'var(--brand)', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Contact
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Market() {
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', price: '', category: 'other' });
  const [loading, setLoading] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: qk.market(category),
    queryFn: () => api.get(`/api/market?category=${category}&search=${search}&limit=24`),
  });

  const items = data?.data?.items || data?.items || [];

  const handleList = async () => {
    setLoading(true);
    try {
      await api.post('/api/market', { ...form, price: Number(form.price) || 0 });
      setShowModal(false);
      setForm({ title: '', description: '', price: '', category: 'other' });
      refetch();
    } catch {}
    setLoading(false);
  };

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 className="h2">Campus Market</h2>
          <p className="caption" style={{ marginTop: '4px' }}>Buy, sell, and trade within Parul</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowModal(true)}>List Item</Button>
      </div>

      {/* Search + category filter */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-full)', padding: '0 16px' }}>
          <Search size={15} style={{ color: 'var(--text-tertiary)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search listings..." style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: '14px', padding: '11px 0' }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
        <div className="tab-bar">
          {CATEGORIES.map(cat => (
            <button key={cat.id} className={`tab-item${category === cat.id ? ' active' : ''}`} onClick={() => setCategory(cat.id)}>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '18px' }}>
        {isLoading
          ? [1,2,3,4,5,6].map(i => <Skeleton key={i} height={300} />)
          : items.map(item => <ListingCard key={item.id} item={item} />)
        }
      </div>

      {/* List Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="List an Item">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px 0' }}>
          <Input label="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <Textarea label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input label="Price (₹)" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} hint="Enter 0 for free" />
            <div>
              <p className="label" style={{ marginBottom: '8px' }}>Category</p>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ width: '100%', padding: '11px 12px', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', background: 'var(--bg-surface)', fontFamily: 'inherit', fontSize: '14px', outline: 'none' }}>
                {CATEGORIES.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <Button fullWidth loading={loading} onClick={handleList}>List Item</Button>
        </div>
      </Modal>
    </div>
  );
}
