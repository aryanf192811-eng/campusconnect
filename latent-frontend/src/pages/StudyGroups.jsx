import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Users, Plus, Clock, Lock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import api from '../lib/api';
import { qk } from '../lib/queryClient';
import { Avatar, AvatarStack } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { DEPARTMENTS } from '../lib/constants';

function GroupCard({ group }) {
  const qc = useQueryClient();
  const joinMutation = useMutation({
    mutationFn: () => group.is_member
      ? api.delete(`/api/study-groups/${group.id}/leave`)
      : api.post(`/api/study-groups/${group.id}/join`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['study-groups'] }),
  });

  return (
    <div className="card" style={{ padding: '20px', borderRadius: 'var(--r-xl)', transition: 'all var(--t-fast)' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--r-md)', background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={22} style={{ color: 'var(--brand)' }} />
          </div>
          <div>
            <h4 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.3 }}>{group.name}</h4>
            <p className="caption">{group.subject || group.department}</p>
          </div>
        </div>
        {group.is_private && <Lock size={14} style={{ color: 'var(--text-tertiary)', marginTop: '4px' }} />}
      </div>

      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {group.description}
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
        {(group.tags || []).slice(0, 3).map(tag => (
          <span key={tag} style={{ padding: '2px 10px', borderRadius: 'var(--r-full)', background: 'var(--bg-surface)', border: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-secondary)' }}>
            #{tag}
          </span>
        ))}
      </div>

      {group.next_session && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px', padding: '8px', background: 'var(--bg-surface)', borderRadius: 'var(--r-md)' }}>
          <Clock size={13} style={{ color: 'var(--brand)', flexShrink: 0 }} />
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Next: {format(parseISO(group.next_session), 'EEE, MMM d · h:mm a')}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AvatarStack users={group.members || []} size={24} max={4} />
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{group.member_count || 0}/{group.max_members || 10}</span>
        </div>
        <button
          onClick={e => { e.stopPropagation(); joinMutation.mutate(); }}
          style={{
            padding: '5px 14px', borderRadius: 'var(--r-full)',
            border: `1px solid ${group.is_member ? 'var(--border)' : 'var(--brand)'}`,
            background: group.is_member ? 'transparent' : 'var(--brand)',
            color: group.is_member ? 'var(--text-secondary)' : 'white',
            fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          {joinMutation.isPending ? '...' : group.is_member ? 'Joined' : 'Join'}
        </button>
      </div>
    </div>
  );
}

export default function StudyGroups() {
  const [dept, setDept] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', subject: '', description: '', department: '', max_members: 10, is_private: false });
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: qk.studyGroups({ dept }),
    queryFn: () => api.get(`/api/study-groups?department=${dept}&limit=24`),
  });

  const groups = data?.data?.items || data?.items || [];

  const handleCreate = async () => {
    setLoading(true);
    try {
      await api.post('/api/study-groups', form);
      setShowModal(false);
      refetch();
    } catch {}
    setLoading(false);
  };

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 className="h2">Study Groups</h2>
          <p className="caption" style={{ marginTop: '4px' }}>Find study partners and ace your exams</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowModal(true)}>Create Group</Button>
      </div>

      {/* Dept filter */}
      <div style={{ marginBottom: '28px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {['', ...DEPARTMENTS].map(d => (
          <button key={d || 'all'} onClick={() => setDept(d)} style={{
            padding: '6px 16px', borderRadius: 'var(--r-full)',
            border: `1px solid ${dept === d ? 'var(--brand)' : 'var(--border)'}`,
            background: dept === d ? 'var(--brand)' : 'var(--bg-card)',
            color: dept === d ? 'white' : 'var(--text-secondary)',
            fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {d || 'All'}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '18px' }}>
        {isLoading
          ? [1,2,3,4].map(i => <Skeleton key={i} height={240} />)
          : groups.map(g => <GroupCard key={g.id} group={g} />)
        }
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Study Group">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '4px 0' }}>
          <Input label="Group name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Input label="Subject / Topic" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
          <Input label="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div>
            <p className="label" style={{ marginBottom: '8px' }}>Department</p>
            <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} style={{ width: '100%', padding: '11px 12px', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', background: 'var(--bg-surface)', fontFamily: 'inherit', fontSize: '14px', outline: 'none' }}>
              <option value="">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <Input label="Max members" type="number" value={form.max_members} onChange={e => setForm(f => ({ ...f, max_members: Number(e.target.value) }))} />
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_private} onChange={e => setForm(f => ({ ...f, is_private: e.target.checked }))} />
            <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Private group (invite only)</span>
          </label>
          <Button fullWidth loading={loading} onClick={handleCreate}>Create Group</Button>
        </div>
      </Modal>
    </div>
  );
}
