import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';
import { toast } from 'sonner';

/* ─── Background watermark ──────────────────────────────────── */
function Watermark() {
  return (
    <div style={{
      position: 'fixed', left: '-80px', top: '50%', transform: 'translateY(-50%)',
      zIndex: 0, pointerEvents: 'none', userSelect: 'none',
      fontSize: '500px', fontFamily: 'Space Grotesk', fontWeight: 800,
      color: 'var(--brand)', opacity: 0.035, lineHeight: 1, letterSpacing: '-0.05em',
    }}>L</div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);

  const [formData, setFormData] = useState({ email_or_enrollment: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setFormData(p => ({ ...p, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!formData.email_or_enrollment.trim()) errs.email_or_enrollment = 'Email or enrollment is required';
    if (!formData.password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', {
        email_or_enrollment: formData.email_or_enrollment,
        password: formData.password,
      });
      login(res.data.user, res.data.token);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      setErrors({ form: err.response?.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-app)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', padding: '24px',
    }}>
      <Watermark />

      <div className="card" style={{
        width: '100%', maxWidth: '420px',
        padding: '44px', zIndex: 1,
        boxShadow: 'var(--shadow-xl)',
        borderRadius: 'var(--r-2xl)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="7" fill="var(--brand-light)" />
              <text x="7" y="21" fontFamily="Space Grotesk, sans-serif" fontWeight="800" fontSize="18" fill="var(--brand)">L</text>
              <path d="M7 22 L15 22" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" />
              <path d="M15 22 L15 19" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span style={{
              fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800,
              fontSize: '20px', letterSpacing: '-0.04em', color: 'var(--text-primary)',
            }}>LATENT</span>
          </div>
        </div>

        <h2 className="h2" style={{ textAlign: 'center', marginBottom: '6px' }}>Welcome back</h2>
        <p className="caption" style={{ textAlign: 'center', marginBottom: '32px' }}>
          Sign in to Parul's campus platform
        </p>

        {errors.form && (
          <div style={{
            padding: '12px 14px', borderRadius: 'var(--r-md)',
            background: 'var(--danger-bg)', border: '1px solid var(--danger-border)',
            color: 'var(--danger)', fontSize: '13px', marginBottom: '16px',
          }}>
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Email or Enrollment number"
            type="text"
            value={formData.email_or_enrollment}
            onChange={set('email_or_enrollment')}
            icon={Mail}
            error={errors.email_or_enrollment}
            autoComplete="email"
          />
          <div>
            <Input
              label="Password"
              type={showPw ? 'text' : 'password'}
              value={formData.password}
              onChange={set('password')}
              icon={Lock}
              iconRight={showPw ? EyeOff : Eye}
              onRightIconClick={() => setShowPw(p => !p)}
              error={errors.password}
              autoComplete="current-password"
            />
            <div style={{ textAlign: 'right', marginTop: '6px' }}>
              <Link to="/forgot-password" style={{
                fontSize: '13px', fontWeight: 500, color: 'var(--brand)',
              }}>Forgot password?</Link>
            </div>
          </div>

          <Button type="submit" fullWidth loading={loading} size="lg" style={{ marginTop: '4px' }}>
            Sign in
          </Button>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0',
          }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span className="caption">or</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
            New here?{' '}
            <Link to="/register" style={{ color: 'var(--brand)', fontWeight: 500 }}>
              Create your account →
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
