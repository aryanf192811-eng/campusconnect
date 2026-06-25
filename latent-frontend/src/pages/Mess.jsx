import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Wallet, QrCode, Ticket, UtensilsCrossed, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import api from '../lib/api';
import { qk } from '../lib/queryClient';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { toast } from 'sonner';

const MEAL_ICONS = { Breakfast: '🌅', Lunch: '☀️', Dinner: '🌙' };

function MealRow({ meal, messId }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const bookMutation = useMutation({
    mutationFn: () => api.post('/api/mess/book-quick', {
      mess_id: messId,
      meal_type: meal.meal_type,
      date: format(new Date(), 'yyyy-MM-dd'),
      persons: 1,
    }),
    onSuccess: () => {
      toast.success(`${meal.meal_type} booked!`);
      qc.invalidateQueries({ queryKey: qk.mess() });
    },
    onError: e => toast.error(e.message),
  });

  const statusVariant = meal.is_booked ? 'success' : meal.is_closed ? 'default' : 'brand';
  const statusLabel = meal.is_booked ? 'Booked ✓' : meal.is_closed ? 'Closed' : `Book — ₹${meal.price}`;

  return (
    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '22px', flexShrink: 0 }}>{MEAL_ICONS[meal.meal_type] || '🍽️'}</span>
        <div style={{ flex: 1 }}>
          <h4 className="h4">{meal.meal_type}</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <Clock size={12} style={{ color: 'var(--text-tertiary)' }} />
            <span className="mono-sm" style={{ color: 'var(--text-tertiary)' }}>
              {meal.start_time} – {meal.end_time}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>
            ₹{meal.price}
          </span>
          <Button
            size="sm"
            variant={meal.is_booked ? 'ghost' : 'primary'}
            disabled={meal.is_booked || meal.is_closed}
            loading={bookMutation.isPending}
            onClick={() => bookMutation.mutate()}
          >
            {statusLabel}
          </Button>
        </div>
        <button onClick={() => setOpen(o => !o)} style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {open && meal.menu_items && (
        <div style={{ marginTop: '10px', paddingLeft: '40px' }}>
          <p className="label" style={{ marginBottom: '6px' }}>Today's menu</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {meal.menu_items.map((item, i) => (
              <span key={i} style={{
                padding: '3px 10px', borderRadius: 'var(--r-full)',
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                fontSize: '12px', color: 'var(--text-body)',
              }}>{item}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Mess() {
  const navigate = useNavigate();

  const { data: messData, isLoading } = useQuery({
    queryKey: qk.mess(),
    queryFn: () => api.get('/api/mess/today'),
  });

  const { data: walletData } = useQuery({
    queryKey: qk.wallet(),
    queryFn: () => api.get('/api/mess/wallet'),
  });

  const mess = messData?.data || messData;
  const wallet = walletData?.data || walletData;
  const meals = mess?.meals || [];

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <h2 className="h2">Mess</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: '24px' }}>
        {/* Left: Today's meals */}
        <div>
          <div className="card" style={{ padding: '24px', borderLeftWidth: '4px', borderLeftStyle: 'solid', borderLeftColor: 'var(--brand)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 className="h3">{mess?.name || 'Campus Mess'}</h3>
              <button onClick={() => navigate('/mess/book')} style={{ fontSize: '13px', color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                Change mess
              </button>
            </div>

            {isLoading ? (
              [1,2,3].map(i => <Skeleton key={i} height={60} style={{ marginBottom: '12px' }} />)
            ) : meals.length === 0 ? (
              <p className="caption">No meal data for today</p>
            ) : meals.map((meal, i) => (
              <MealRow key={i} meal={meal} messId={mess?.id} />
            ))}
          </div>
        </div>

        {/* Right: Wallet + Quick actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Wallet card */}
          <div className="card" style={{ padding: '20px', borderLeftWidth: '4px', borderLeftStyle: 'solid', borderLeftColor: 'var(--accent)' }}>
            <p className="label" style={{ marginBottom: '12px' }}>Campus Wallet</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>₹</span>
              <span style={{
                fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '44px',
                letterSpacing: '-0.03em', color: 'var(--text-primary)', lineHeight: 1,
              }}>
                {wallet?.balance?.toLocaleString() || '0'}
              </span>
            </div>
            {(wallet?.transactions || []).slice(0, 3).map((t, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', padding: '6px 0',
                borderTop: '1px solid var(--border)', fontSize: '13px',
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>{t.description}</span>
                <span style={{
                  fontFamily: 'JetBrains Mono', fontWeight: 600,
                  color: t.type === 'debit' ? 'var(--danger)' : 'var(--success)',
                }}>
                  {t.type === 'debit' ? '-' : '+'}₹{t.amount}
                </span>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'Book a meal', icon: UtensilsCrossed, to: '/mess/book' },
              { label: 'My tickets', icon: Ticket, to: '/mess/tickets' },
            ].map(({ label, icon: Icon, to }) => (
              <button
                key={label}
                onClick={() => navigate(to)}
                style={{
                  padding: '16px', borderRadius: 'var(--r-lg)',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)', cursor: 'pointer', textAlign: 'left',
                  display: 'flex', flexDirection: 'column', gap: '10px',
                  fontFamily: 'inherit', transition: 'all var(--t-fast)',
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
              >
                <Icon size={20} style={{ color: 'var(--brand)' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
