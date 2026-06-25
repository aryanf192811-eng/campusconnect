import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { OTPInput } from '../components/ui/Input';
import api from '../lib/api';
import { toast } from 'sonner';

const slide = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -24 },
  transition: { type: 'spring', stiffness: 280, damping: 26 },
};

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendOTP = async () => {
    if (!email.trim()) return setError('Email is required');
    setLoading(true); setError('');
    try {
      await api.post('/api/auth/forgot-password', { email });
      toast.info('OTP sent! Check your email (dev: see server console).');
      setStep(2);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const verifyOTP = async () => {
    if (otp.length < 6) return setError('Enter all 6 digits');
    setLoading(true); setError('');
    try {
      const res = await api.post('/api/auth/verify-otp', { email, otp });
      setResetToken(res.data?.reset_token || '');
      setStep(3);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const resetPassword = async () => {
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (password !== confirm) return setError('Passwords do not match');
    setLoading(true); setError('');
    try {
      await api.post('/api/auth/reset-password', { email, otp, new_password: password, reset_token: resetToken });
      toast.success('Password reset! Please sign in.');
      navigate('/login');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-app)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '44px', boxShadow: 'var(--shadow-xl)', borderRadius: 'var(--r-2xl)' }}>
        {/* Step dots */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '32px', justifyContent: 'center' }}>
          {[1,2,3].map(s => (
            <div key={s} style={{
              height: '4px', flex: 1, borderRadius: 'var(--r-full)',
              background: s <= step ? 'var(--brand)' : s < step ? 'var(--success)' : 'var(--border)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" {...slide} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h2 className="h2">Forgot password?</h2>
                <p className="caption" style={{ marginTop: '6px' }}>We'll send an OTP to your registered email.</p>
              </div>
              {error && <p style={{ color: 'var(--danger)', fontSize: '13px' }}>{error}</p>}
              <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} icon={Mail} />
              <Button fullWidth loading={loading} onClick={sendOTP}>Send OTP</Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" {...slide} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h2 className="h2">Enter OTP</h2>
                <p className="caption" style={{ marginTop: '6px' }}>Sent to <strong>{email}</strong></p>
              </div>
              {error && <p style={{ color: 'var(--danger)', fontSize: '13px', textAlign: 'center' }}>{error}</p>}
              <OTPInput value={otp} onChange={setOtp} error={error && otp.length < 6 ? error : ''} />
              <Button fullWidth loading={loading} onClick={verifyOTP}>Verify OTP</Button>
              <button onClick={() => setStep(1)} style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                ← Change email
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" {...slide} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h2 className="h2">New password</h2>
                <p className="caption" style={{ marginTop: '6px' }}>Choose a strong password.</p>
              </div>
              {error && <p style={{ color: 'var(--danger)', fontSize: '13px' }}>{error}</p>}
              <Input label="New password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
              <Input label="Confirm password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} />
              <Button fullWidth loading={loading} onClick={resetPassword}>Reset password</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
