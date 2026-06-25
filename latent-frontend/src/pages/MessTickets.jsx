import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, QrCode, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import api from '../lib/api';
import { qk } from '../lib/queryClient';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';

const MEAL_EMOJI = { Breakfast: '🌅', Lunch: '☀️', Dinner: '🌙' };
const STATUS_CONFIG = {
  active:  { variant: 'success', label: 'Active', icon: CheckCircle2 },
  used:    { variant: 'default', label: 'Used',   icon: CheckCircle2 },
  expired: { variant: 'danger',  label: 'Expired', icon: XCircle },
};

function TicketCard({ ticket }) {
  const [showQR, setShowQR] = useState(false);
  const config = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.active;
  const Icon = config.icon;

  return (
    <div className="card" style={{ padding: '0', borderRadius: 'var(--r-xl)', overflow: 'hidden', opacity: ticket.status === 'expired' ? 0.6 : 1 }}>
      {/* Ticket header stripe */}
      <div style={{
        padding: '14px 18px',
        background: ticket.status === 'active' ? 'var(--brand)' : ticket.status === 'used' ? 'var(--success)' : 'var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>{MEAL_EMOJI[ticket.meal_type] || '🍽️'}</span>
          <div>
            <p style={{ fontWeight: 700, fontSize: '15px', color: 'white', lineHeight: 1.2 }}>{ticket.meal_type}</p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)' }}>{ticket.mess_name}</p>
          </div>
        </div>
        <Badge variant={config.variant} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }}>
          {config.label}
        </Badge>
      </div>

      {/* Dashed separator (ticket punch line) */}
      <div style={{ display: 'flex', alignItems: 'center', margin: '0 -1px' }}>
        <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--bg-page)', flexShrink: 0, marginLeft: '-8px' }} />
        <div style={{ flex: 1, borderTop: '2px dashed var(--border)' }} />
        <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--bg-page)', flexShrink: 0, marginRight: '-8px' }} />
      </div>

      {/* Ticket body */}
      <div style={{ padding: '14px 18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
          <div>
            <p className="label">Date</p>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
              {ticket.date ? format(parseISO(ticket.date), 'EEE, MMM d') : 'N/A'}
            </p>
          </div>
          <div>
            <p className="label">Time</p>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
              {ticket.start_time ? `${ticket.start_time} – ${ticket.end_time}` : 'N/A'}
            </p>
          </div>
          <div>
            <p className="label">Persons</p>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{ticket.persons || 1}</p>
          </div>
          <div>
            <p className="label">Amount</p>
            <p style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'Space Grotesk', color: 'var(--brand)', marginTop: '2px' }}>₹{ticket.amount}</p>
          </div>
        </div>

        {/* Ticket ID */}
        <p style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: 'var(--text-tertiary)', letterSpacing: '0.06em', marginBottom: '12px' }}>
          #{ticket.ticket_id || ticket.id}
        </p>

        {ticket.status === 'active' && (
          <button
            onClick={() => setShowQR(s => !s)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '10px', borderRadius: 'var(--r-md)',
              border: '1px solid var(--border)', background: 'var(--bg-surface)',
              color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <QrCode size={16} />
            {showQR ? 'Hide QR Code' : 'Show QR Code'}
          </button>
        )}

        {showQR && ticket.status === 'active' && (
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center', padding: '16px', background: 'white', borderRadius: 'var(--r-md)' }}>
            {/* QR placeholder — in production use a QR library */}
            <div style={{ width: 120, height: 120, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
              {Array.from({ length: 49 }, (_, i) => (
                <div key={i} style={{ background: (i * 7 + i + ticket.id) % 3 === 0 ? '#000' : '#fff', borderRadius: '1px' }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessTickets() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('active');

  const { data, isLoading } = useQuery({
    queryKey: qk.tickets(status),
    queryFn: () => api.get(`/api/mess/tickets?status=${status}&limit=20`),
  });

  const tickets = data?.data?.items || data?.items || [];

  return (
    <div style={{ padding: '32px 40px', maxWidth: '680px', margin: '0 auto' }}>
      <button onClick={() => navigate('/mess')} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', marginBottom: '24px' }}>
        <ArrowLeft size={16} /> Back to Mess
      </button>

      <h2 className="h2" style={{ marginBottom: '24px' }}>My Tickets</h2>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
        <div className="tab-bar">
          {[['active','Active'],['used','Used'],['expired','Expired']].map(([val, label]) => (
            <button key={val} className={`tab-item${status === val ? ' active' : ''}`} onClick={() => setStatus(val)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {isLoading ? (
          [1,2,3].map(i => <Skeleton key={i} height={260} />)
        ) : tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <QrCode size={48} style={{ color: 'var(--border-medium)', margin: '0 auto 12px' }} />
            <p className="body" style={{ color: 'var(--text-secondary)' }}>No {status} tickets</p>
            {status === 'active' && (
              <button onClick={() => navigate('/mess/book')} style={{ marginTop: '12px', color: 'var(--brand)', fontSize: '14px', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>
                Book your first meal →
              </button>
            )}
          </div>
        ) : tickets.map(t => <TicketCard key={t.id} ticket={t} />)
        }
      </div>
    </div>
  );
}
