import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'sonner';

function PasswordStrength({ password }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const strength = checks.filter(Boolean).length;
  const colors = ['var(--border)', 'var(--danger)', 'var(--warning)', 'var(--accent)', 'var(--success)'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div style={{ marginTop: '6px' }}>
      <div style={{ display: 'flex', gap: '4px' }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            flex: 1, height: '3px', borderRadius: 'var(--r-full)',
            background: i < strength ? colors[strength] : 'var(--border)',
            transition: 'background 0.2s',
          }} />
        ))}
      </div>
      {password && (
        <p style={{ fontSize: '11px', color: colors[strength], marginTop: '4px', fontWeight: 500 }}>
          {labels[strength]}
        </p>
      )}
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);

  const [form, setForm] = useState({
    name: '', enrollment_no: '', email: '', password: '', confirm_password: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirm_password) errs.confirm_password = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await api.post('/api/auth/register', {
        name: form.name,
        enrollment_no: form.enrollment_no || null,
        email: form.email,
        password: form.password,
      });
      login(res.data.user, res.data.token);
      toast.success('Account created!');
      navigate('/onboarding');
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
      padding: '24px',
    }}>
      {/* Background watermark */}
      <div style={{
        position: 'fixed', right: '-60px', top: '50%', transform: 'translateY(-50%)',
        fontSize: '500px', fontFamily: 'Space Grotesk', fontWeight: 800,
        color: 'var(--brand)', opacity: 0.035, lineHeight: 1, letterSpacing: '-0.05em',
        pointerEvents: 'none', userSelect: 'none', zIndex: 0,
      }}>L</div>

      <div className="card" style={{
        width: '100%', maxWidth: '420px', padding: '44px',
        boxShadow: 'var(--shadow-xl)', borderRadius: 'var(--r-2xl)', zIndex: 1,
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
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '20px', letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>LATENT</span>
          </div>
        </div>

        <h2 className="h2" style={{ textAlign: 'center', marginBottom: '6px' }}>Create your account</h2>
        <p className="caption" style={{ textAlign: 'center', marginBottom: '32px' }}>
          Join Parul's campus platform
        </p>

        {errors.form && (
          <div style={{ padding: '12px 14px', borderRadius: 'var(--r-md)', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', fontSize: '13px', marginBottom: '16px' }}>
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Input label="Full name" value={form.name} onChange={set('name')} icon={User} error={errors.name} autoComplete="name" />
          <Input
            label="Enrollment number (optional)"
            value={form.enrollment_no}
            onChange={set('enrollment_no')}
            error={errors.enrollment_no}
            hint="e.g. 22BTECH10001"
          />
          <Input label="Email" type="email" value={form.email} onChange={set('email')} icon={Mail} error={errors.email} autoComplete="email" />
          <div>
            <Input
              label="Password"
              type={showPw ? 'text' : 'password'}
              value={form.password}
              onChange={set('password')}
              icon={Lock}
              iconRight={showPw ? EyeOff : Eye}
              onRightIconClick={() => setShowPw(p => !p)}
              error={errors.password}
            />
            <PasswordStrength password={form.password} />
          </div>
          <Input
            label="Confirm password"
            type="password"
            value={form.confirm_password}
            onChange={set('confirm_password')}
            icon={Lock}
            error={errors.confirm_password}
          />

          <Button type="submit" fullWidth loading={loading} size="lg" style={{ marginTop: '8px' }}>
            Create account
          </Button>

          <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--brand)', fontWeight: 500 }}>Sign in →</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
