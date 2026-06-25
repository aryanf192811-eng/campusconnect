import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';

/* ─── Blueprint SVG Campus Illustration ────────────────────── */
function BlueprintSVG() {
  return (
    <svg viewBox="0 0 500 420" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%' }}>
      {/* Grid lines */}
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2563EB" strokeWidth="0.3" opacity="0.3"/>
        </pattern>
        <style>{`
          @keyframes drawPath { from { stroke-dashoffset: 1200; } to { stroke-dashoffset: 0; } }
          @keyframes pulse-dot { 0%,100% { opacity:0.7; r:5; } 50% { opacity:1; r:8; } }
          .draw { stroke-dasharray:1200; animation: drawPath 3s ease forwards; }
          .draw2 { stroke-dasharray:1200; animation: drawPath 3s 0.4s ease forwards; stroke-dashoffset:1200; }
          .draw3 { stroke-dasharray:1200; animation: drawPath 3s 0.8s ease forwards; stroke-dashoffset:1200; }
          .pulse { animation: pulse-dot 2s ease-in-out infinite; }
        `}</style>
      </defs>
      <rect width="500" height="420" fill="url(#grid)" />

      {/* Campus paths */}
      <path className="draw" d="M50 380 L50 80 L200 80 L200 40 L460 40 L460 380 Z"
        stroke="#2563EB" strokeWidth="1" opacity="0.25" fill="none" />

      {/* Main academic block */}
      <rect className="draw" x="80" y="100" width="120" height="90" rx="4"
        fill="#EFF6FF" stroke="#2563EB" strokeWidth="1.5" />
      <text x="140" y="152" textAnchor="middle" fontSize="9" fill="#2563EB" fontFamily="JetBrains Mono" opacity="0.7">ACADEMIC</text>

      {/* Library */}
      <rect className="draw2" x="250" y="60" width="80" height="70" rx="4"
        fill="#EFF6FF" stroke="#2563EB" strokeWidth="1.5" />
      <text x="290" y="100" textAnchor="middle" fontSize="9" fill="#2563EB" fontFamily="JetBrains Mono" opacity="0.7">LIBRARY</text>

      {/* Mess / Food court */}
      <rect className="draw2" x="360" y="120" width="75" height="60" rx="4"
        fill="#FFFBEB" stroke="#F59E0B" strokeWidth="1.5" />
      <text x="397" y="154" textAnchor="middle" fontSize="9" fill="#D97706" fontFamily="JetBrains Mono" opacity="0.7">MESS</text>

      {/* Hostel block */}
      <rect className="draw3" x="80" y="240" width="100" height="100" rx="4"
        fill="#F5F3FF" stroke="#A855F7" strokeWidth="1.5" />
      <text x="130" y="296" textAnchor="middle" fontSize="9" fill="#7C3AED" fontFamily="JetBrains Mono" opacity="0.7">HOSTEL</text>

      {/* PU Circle */}
      <circle className="draw3" cx="290" cy="280" r="40"
        fill="none" stroke="#2563EB" strokeWidth="1" opacity="0.3" />
      <circle cx="290" cy="280" r="4" fill="#2563EB" opacity="0.4" />
      <text x="290" y="335" textAnchor="middle" fontSize="8" fill="#2563EB" fontFamily="JetBrains Mono" opacity="0.5">PU CIRCLE</text>

      {/* Connecting paths */}
      <path className="draw" d="M200 145 L250 145 L250 95 L250 95"
        stroke="#2563EB" strokeWidth="1" opacity="0.2" strokeDasharray="4 3" />
      <path className="draw2" d="M180 190 L180 240"
        stroke="#2563EB" strokeWidth="1" opacity="0.2" strokeDasharray="4 3" />
      <path className="draw2" d="M290 240 L290 200 L360 200 L360 180"
        stroke="#2563EB" strokeWidth="1" opacity="0.2" strokeDasharray="4 3" />

      {/* Pulse dots at key locations */}
      <circle className="pulse" cx="140" cy="145" r="5" fill="#10B981" opacity="0.8" />
      <circle className="pulse" cx="290" cy="95" r="5" fill="#2563EB" opacity="0.8"
        style={{ animationDelay: '0.6s' }} />
      <circle className="pulse" cx="397" cy="150" r="5" fill="#F59E0B" opacity="0.8"
        style={{ animationDelay: '1.2s' }} />
      <circle className="pulse" cx="130" cy="290" r="5" fill="#A855F7" opacity="0.8"
        style={{ animationDelay: '0.3s' }} />

      {/* Watermark L */}
      <text x="380" y="380" fontSize="160" fontFamily="Space Grotesk" fontWeight="800"
        fill="#2563EB" opacity="0.04" letterSpacing="-4">L</text>
    </svg>
  );
}

/* ─── Landing Page ──────────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>

      {/* Header */}
      <header style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 50,
        padding: '0 40px', height: '58px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(248,250,252,0.92)' : 'rgba(248,250,252,0)',
        backdropFilter: scrolled ? 'blur(12px)' : 'blur(0)',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="7" fill="var(--brand-light)" />
            <text x="7" y="21" fontFamily="Space Grotesk, sans-serif" fontWeight="800" fontSize="18" fill="var(--brand)">L</text>
            <path d="M7 22 L15 22" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" />
            <path d="M15 22 L15 19" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 800, fontSize: '18px',
            letterSpacing: '-0.04em', color: 'var(--text-primary)',
          }}>LATENT</span>
        </div>

        {/* Center links */}
        <nav style={{ display: 'flex', gap: '32px' }}>
          {['Features', 'Map', 'Community'].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} style={{
              fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)',
              transition: 'color var(--t-fast)',
            }}
              onMouseEnter={e => e.target.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
            >{l}</a>
          ))}
        </nav>

        {/* CTA */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Sign in</Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/register')}>Get started</Button>
        </div>
      </header>

      {/* Hero */}
      <section style={{
        paddingTop: 'calc(58px + 80px)', paddingBottom: '80px',
        paddingLeft: '10vw', paddingRight: '10vw',
        display: 'grid', gridTemplateColumns: '55% 45%',
        alignItems: 'center', gap: '40px', maxWidth: '1280px', margin: '0 auto',
        minHeight: '100vh',
      }}>
        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Badge pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-full)', padding: '6px 14px',
            boxShadow: 'var(--shadow-sm)', width: 'fit-content',
            fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }} />
            Parul University · 50,000+ students
          </div>

          {/* Display heading */}
          <div>
            <h1 className="display" style={{ lineHeight: 1.0 }}>
              Campus life<br />
              <span style={{ color: 'var(--brand)' }}>finally</span><br />
              connected.
            </h1>
          </div>

          {/* Body */}
          <p className="body-lg" style={{ maxWidth: '440px', color: 'var(--text-body)' }}>
            The social platform built for Parul students.
            Map, mess, events, and community — all in one place.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/register')}
              iconRight={<ArrowRight size={18} />}
            >
              Start exploring
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/map')}
            >
              See the campus map
            </Button>
          </div>

          {/* Social proof */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
            {/* Overlapping avatar circles */}
            <div style={{ display: 'flex' }}>
              {['#10B981','#2563EB','#F59E0B','#EF4444','#A855F7'].map((c, i) => (
                <div key={i} style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: c, border: '2px solid white',
                  marginLeft: i > 0 ? '-8px' : 0,
                  zIndex: 5 - i, position: 'relative',
                }} />
              ))}
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Join <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>800+</strong> students already on Latent
            </p>
          </div>
        </div>

        {/* Visual: Blueprint SVG */}
        <div style={{ position: 'relative', height: '420px' }}>
          <BlueprintSVG />
        </div>
      </section>

      {/* Features strip */}
      <section id="features" style={{
        borderTop: '1px solid var(--border)',
        padding: '60px 10vw',
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0',
        maxWidth: '1280px', margin: '0 auto',
      }}>
        {[
          {
            title: 'Live Campus Map',
            desc: 'See real-time crowd levels at every campus location. Check in to share where you are.',
            svg: <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round"><circle cx="14" cy="12" r="4"/><path d="M14 4C9.58 4 6 7.58 6 12c0 6 8 16 8 16s8-10 8-16c0-4.42-3.58-8-8-8z"/></svg>,
          },
          {
            title: 'Mess & Meal Booking',
            desc: 'Book meals in advance from any of the 15 campus messes. Wallet payments included.',
            svg: <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round"><path d="M9 4v6m10-6v6M5 12h18M7 12v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"/></svg>,
          },
          {
            title: 'Community & Events',
            desc: 'Post anonymously, follow classmates, join clubs, and RSVP to events on campus.',
            svg: <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round"><circle cx="10" cy="10" r="4"/><circle cx="20" cy="10" r="4"/><path d="M4 24c0-4 2.7-6 6-6M18 18c3.3 0 6 2 6 6M14 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/></svg>,
          },
        ].map((f, i) => (
          <div key={i} style={{
            padding: '40px 36px',
            borderLeftWidth: i > 0 ? '1px' : '0px',
            borderLeftStyle: 'solid',
            borderLeftColor: i > 0 ? 'var(--border)' : 'transparent',
            display: 'flex', flexDirection: 'column', gap: '12px',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 'var(--r-md)',
              background: 'var(--brand-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {f.svg}
            </div>
            <h3 className="h3">{f.title}</h3>
            <p className="body" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Map preview section */}
      <section id="map" style={{
        background: 'var(--text-primary)',
        padding: '80px 10vw',
      }}>
        <div style={{
          maxWidth: '1280px', margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 className="h1" style={{ color: 'white' }}>
              See every corner<br />of campus, live.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '16px', lineHeight: 1.65 }}>
              Real-time crowd data from student check-ins. Know where to go and when.
              Academic blocks, food courts, hostels — all on one map.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/register')}
              style={{ width: 'fit-content', background: 'white', color: 'var(--brand)' }}
            >
              Open campus map
            </Button>
          </div>
          {/* Map placeholder with blueprint styling */}
          <div style={{
            height: '280px', borderRadius: 'var(--r-xl)',
            border: '1px solid rgba(255,255,255,0.1)',
            overflow: 'hidden', position: 'relative',
            background: 'rgba(255,255,255,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="24" cy="20" r="8"/>
                <path d="M24 6C15.16 6 8 13.16 8 22c0 10 16 26 16 26s16-16 16-26C40 13.16 32.84 6 24 6z"/>
                <circle cx="24" cy="36" r="2" fill="currentColor"/>
              </svg>
              <p style={{ marginTop: '12px', fontSize: '13px' }}>Live Campus Map</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        height: '60px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 10vw',
      }}>
        <span style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '14px', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
          LATENT
        </span>
        <div style={{ display: 'flex', gap: '24px' }}>
          {['Privacy', 'Terms', 'Contact'].map(l => (
            <a key={l} href="#" style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>{l}</a>
          ))}
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>© 2025 Latent</span>
      </footer>
    </div>
  );
}
