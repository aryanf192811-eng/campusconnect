import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Camera, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Input';
import { useAuthStore } from '../stores/authStore';
import { DEPARTMENTS, INTERESTS, MESS_NAMES } from '../lib/constants';
import api from '../lib/api';
import { toast } from 'sonner';

const slide = {
  initial: { opacity: 0, x: 32 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -32 },
  transition: { type: 'spring', stiffness: 260, damping: 26 },
};

function StepIndicator({ current, total }) {
  return (
    <div style={{ display: 'flex', gap: '6px', marginBottom: '40px' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: '4px', flex: 1, borderRadius: 'var(--r-full)',
          background: i < current ? 'var(--success)' : i === current ? 'var(--brand)' : 'var(--border)',
          transition: 'background 0.3s',
        }} />
      ))}
    </div>
  );
}

function Chip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '8px 16px',
        borderRadius: 'var(--r-full)',
        border: `1px solid ${selected ? 'var(--brand)' : 'var(--border)'}`,
        background: selected ? 'var(--brand)' : 'var(--bg-card)',
        color: selected ? 'white' : 'var(--text-secondary)',
        fontSize: '13px', fontWeight: 500,
        cursor: 'pointer', transition: 'all var(--t-fast)',
        fontFamily: 'inherit',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');

  // Step 2
  const [interests, setInterests] = useState([]);

  // Step 3
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [bio, setBio] = useState('');
  const [defaultMess, setDefaultMess] = useState('');
  const [hostelType, setHostelType] = useState('hostel');

  const toggleInterest = (i) => {
    setInterests(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
    );
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('department', department);
      fd.append('year', year);
      fd.append('interests', JSON.stringify(interests));
      fd.append('bio', bio);
      fd.append('default_mess', defaultMess);
      fd.append('hostel_type', hostelType);
      if (avatar) fd.append('avatar', avatar);

      const res = await api.post('/api/auth/onboarding', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(res.data?.user || { department, year, interests, bio });
      toast.success('Welcome to Latent! 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-app)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div className="card" style={{
        width: '100%', maxWidth: '560px', padding: '44px',
        boxShadow: 'var(--shadow-xl)', borderRadius: 'var(--r-2xl)',
      }}>
        <StepIndicator current={step} total={3} />

        <AnimatePresence mode="wait">
          {/* Step 1 — Department & Year */}
          {step === 0 && (
            <motion.div key="s1" {...slide}>
              <h3 className="h3" style={{ marginBottom: '4px' }}>Tell us about you</h3>
              <p className="caption" style={{ marginBottom: '28px' }}>Personalizes your feed and campus map</p>

              <div style={{ marginBottom: '24px' }}>
                <p className="label" style={{ marginBottom: '10px' }}>Department</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {DEPARTMENTS.map(d => (
                    <Chip key={d} label={d} selected={department === d} onClick={() => setDepartment(d)} />
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <p className="label" style={{ marginBottom: '10px' }}>Year</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['1st Year', '2nd Year', '3rd Year', '4th Year'].map(y => (
                    <Chip key={y} label={y} selected={year === y} onClick={() => setYear(y)} />
                  ))}
                </div>
              </div>

              <Button
                fullWidth size="lg"
                iconRight={<ChevronRight size={18} />}
                disabled={!department || !year}
                onClick={() => setStep(1)}
              >
                Continue
              </Button>
            </motion.div>
          )}

          {/* Step 2 — Interests */}
          {step === 1 && (
            <motion.div key="s2" {...slide}>
              <h3 className="h3" style={{ marginBottom: '4px' }}>What excites you?</h3>
              <p className="caption" style={{ marginBottom: '6px' }}>Pick at least 3 — we'll show you the right content</p>
              <p style={{
                fontSize: '12px', fontWeight: 600,
                color: interests.length >= 3 ? 'var(--success)' : 'var(--text-tertiary)',
                marginBottom: '20px', transition: 'color 0.2s',
              }}>
                {interests.length}/3 minimum{interests.length >= 3 && ' ✓'}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
                {INTERESTS.map(i => (
                  <Chip key={i} label={i} selected={interests.includes(i)} onClick={() => toggleInterest(i)} />
                ))}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
                <Button
                  fullWidth size="lg"
                  iconRight={<ChevronRight size={18} />}
                  disabled={interests.length < 3}
                  onClick={() => setStep(2)}
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3 — Profile */}
          {step === 2 && (
            <motion.div key="s3" {...slide} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h3 className="h3" style={{ marginBottom: '4px' }}>Make it yours</h3>
                <p className="caption">Almost there — add your photo and bio</p>
              </div>

              {/* Avatar upload */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <label htmlFor="avatar-upload" style={{ cursor: 'pointer' }}>
                  <div style={{
                    width: 96, height: 96, borderRadius: '50%',
                    border: '2px dashed var(--border-medium)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--bg-surface)',
                    overflow: 'hidden', transition: 'border-color var(--t-fast)',
                    position: 'relative',
                  }}>
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
                        <Camera size={24} />
                        <p style={{ fontSize: '10px', marginTop: '4px' }}>Upload</p>
                      </div>
                    )}
                  </div>
                  <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                </label>
              </div>

              <Textarea label="Bio" value={bio} onChange={e => setBio(e.target.value)} maxLength={120} rows={3} />

              <div>
                <p className="label" style={{ marginBottom: '8px' }}>Default Mess</p>
                <select
                  value={defaultMess}
                  onChange={e => setDefaultMess(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 14px',
                    borderRadius: 'var(--r-md)', border: '1px solid var(--border)',
                    background: 'var(--bg-surface)', fontFamily: 'inherit',
                    fontSize: '14px', color: 'var(--text-primary)', outline: 'none',
                  }}
                >
                  <option value="">Select your mess...</option>
                  {MESS_NAMES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <p className="label" style={{ marginBottom: '8px' }}>Stay type</p>
                <div style={{ display: 'flex', background: 'var(--bg-surface)', borderRadius: 'var(--r-full)', padding: '4px', border: '1px solid var(--border)' }}>
                  {[['hostel', 'Hosteler'], ['day_scholar', 'Day Scholar']].map(([v, l]) => (
                    <button
                      key={v} type="button" onClick={() => setHostelType(v)}
                      style={{
                        flex: 1, padding: '8px', borderRadius: 'var(--r-full)',
                        background: hostelType === v ? 'var(--brand)' : 'transparent',
                        color: hostelType === v ? 'white' : 'var(--text-secondary)',
                        border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        fontSize: '13px', fontWeight: 500, transition: 'all var(--t-fast)',
                      }}
                    >{l}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button fullWidth size="lg" loading={loading} onClick={handleFinish}>
                  Enter Latent
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
