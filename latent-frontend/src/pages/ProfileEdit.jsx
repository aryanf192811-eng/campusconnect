import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Save, ArrowLeft } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { Avatar } from '../components/ui/Avatar';
import { Input, Textarea } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { DEPARTMENTS, INTERESTS, MESS_NAMES, CAMPUS_STATUSES } from '../lib/constants';
import { toast } from 'sonner';

export default function ProfileEdit() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();

  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    department: user?.department || '',
    year: user?.year || '',
    hostel: user?.hostel || '',
    default_mess: user?.default_mess || '',
    status: user?.status || 'free',
    interests: user?.interests || [],
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || '');
  const fileRef = useRef(null);

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));
  const toggleInterest = (i) =>
    setForm(p => ({
      ...p,
      interests: p.interests.includes(i) ? p.interests.filter(x => x !== i) : [...p.interests, i],
    }));

  const saveMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (Array.isArray(v)) fd.append(k, JSON.stringify(v));
        else fd.append(k, v);
      });
      if (avatarFile) fd.append('avatar', avatarFile);
      return api.patch('/api/auth/update-profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: (res) => {
      updateUser(res.data?.user || form);
      toast.success('Profile updated!');
      navigate(`/profile/${user?.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div style={{ padding: '32px 40px', maxWidth: '640px', margin: '0 auto', paddingBottom: '80px' }}>
      {/* Back */}
      <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', marginBottom: '24px' }}>
        <ArrowLeft size={16} /> Back
      </button>

      <h2 className="h2" style={{ marginBottom: '32px' }}>Edit Profile</h2>

      {/* Avatar */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileRef.current?.click()}>
          <Avatar src={avatarPreview} name={form.name} userId={user?.id} size={96} />
          <div style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--brand)', border: '3px solid var(--bg-page)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Camera size={14} color="white" />
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); }
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Basic info */}
        <div className="card" style={{ padding: '24px', borderRadius: 'var(--r-xl)' }}>
          <p className="label" style={{ marginBottom: '16px' }}>Basic Info</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Input label="Full name" value={form.name} onChange={set('name')} />
            <Textarea label="Bio" value={form.bio} onChange={set('bio')} rows={3} maxLength={160} />
          </div>
        </div>

        {/* Academic */}
        <div className="card" style={{ padding: '24px', borderRadius: 'var(--r-xl)' }}>
          <p className="label" style={{ marginBottom: '16px' }}>Academic</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <p className="label" style={{ fontSize: '12px', marginBottom: '8px' }}>Department</p>
              <select value={form.department} onChange={set('department')} style={{ width: '100%', padding: '11px 14px', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', background: 'var(--bg-surface)', fontFamily: 'inherit', fontSize: '14px', outline: 'none' }}>
                <option value="">Select...</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <p className="label" style={{ fontSize: '12px', marginBottom: '8px' }}>Year</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['1st Year','2nd Year','3rd Year','4th Year'].map(y => (
                  <button key={y} type="button" onClick={() => setForm(p => ({ ...p, year: y }))} style={{
                    flex: 1, padding: '8px', borderRadius: 'var(--r-md)',
                    border: `1px solid ${form.year === y ? 'var(--brand)' : 'var(--border)'}`,
                    background: form.year === y ? 'var(--brand)' : 'var(--bg-surface)',
                    color: form.year === y ? 'white' : 'var(--text-secondary)',
                    fontFamily: 'inherit', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                  }}>{y}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Campus preferences */}
        <div className="card" style={{ padding: '24px', borderRadius: 'var(--r-xl)' }}>
          <p className="label" style={{ marginBottom: '16px' }}>Campus Preferences</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <p className="label" style={{ fontSize: '12px', marginBottom: '8px' }}>Default Mess</p>
              <select value={form.default_mess} onChange={set('default_mess')} style={{ width: '100%', padding: '11px 14px', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', background: 'var(--bg-surface)', fontFamily: 'inherit', fontSize: '14px', outline: 'none' }}>
                <option value="">Select mess...</option>
                {MESS_NAMES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <p className="label" style={{ fontSize: '12px', marginBottom: '8px' }}>Current Status</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {CAMPUS_STATUSES.map(s => (
                  <button key={s.value} type="button" onClick={() => setForm(p => ({ ...p, status: s.value }))} style={{
                    padding: '6px 14px', borderRadius: 'var(--r-full)',
                    border: `1px solid ${form.status === s.value ? s.color : 'var(--border)'}`,
                    background: form.status === s.value ? s.color + '20' : 'transparent',
                    color: form.status === s.value ? s.color : 'var(--text-secondary)',
                    fontFamily: 'inherit', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                  }}>{s.label}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Interests */}
        <div className="card" style={{ padding: '24px', borderRadius: 'var(--r-xl)' }}>
          <p className="label" style={{ marginBottom: '16px' }}>Interests</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {INTERESTS.map(i => (
              <button key={i} type="button" onClick={() => toggleInterest(i)} style={{
                padding: '6px 16px', borderRadius: 'var(--r-full)',
                border: `1px solid ${form.interests.includes(i) ? 'var(--brand)' : 'var(--border)'}`,
                background: form.interests.includes(i) ? 'var(--brand)' : 'transparent',
                color: form.interests.includes(i) ? 'white' : 'var(--text-secondary)',
                fontFamily: 'inherit', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              }}>{i}</button>
            ))}
          </div>
        </div>

        <Button
          fullWidth size="lg"
          loading={saveMutation.isPending}
          icon={<Save size={16} />}
          onClick={() => saveMutation.mutate()}
          style={{ marginTop: '8px' }}
        >
          Save changes
        </Button>
      </div>
    </div>
  );
}
