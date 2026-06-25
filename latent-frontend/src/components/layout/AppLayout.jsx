import React from 'react';
import { Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { IconRail } from './IconRail';
import { BottomNav } from './BottomNav';
import { useSSE } from '../../hooks/useSSE';
import { Toaster } from 'sonner';

export function AppLayout() {
  const location = useLocation();
  useSSE(); // Connect to SSE notifications

  return (
    <>
      {/* Desktop sidebar — hidden on mobile */}
      <div className="desktop-rail">
        <IconRail />
      </div>

      {/* Main content area — offset by icon rail width */}
      <main style={{
        paddingLeft: 'var(--nav-w)',
        minHeight: '100vh',
        background: 'var(--bg-page)',
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(3px)' }}
            transition={{ type: 'spring', stiffness: 200, damping: 24 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile bottom nav */}
      <div className="mobile-nav">
        <BottomNav />
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            fontFamily: 'Inter Variable, Inter, sans-serif',
            fontSize: '14px',
            boxShadow: 'var(--shadow-lg)',
          },
        }}
      />

      <style>{`
        .desktop-rail { display: block; }
        .mobile-nav { display: none; }
        @media (max-width: 768px) {
          .desktop-rail { display: none; }
          .mobile-nav { display: block; }
          main { padding-left: 0 !important; padding-bottom: 60px; }
        }
      `}</style>
    </>
  );
}
