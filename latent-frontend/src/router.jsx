import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { useAuthStore } from './stores/authStore';

// Pages — lazy loaded for performance
import { lazy, Suspense } from 'react';
import { PostCardSkeleton } from './components/ui/Skeleton';

const Lazy = (imp) => {
  const C = lazy(imp);
  return (props) => (
    <Suspense fallback={<div style={{ padding: '40px' }}><PostCardSkeleton /></div>}>
      <C {...props} />
    </Suspense>
  );
};

// Public pages
const Landing        = Lazy(() => import('./pages/Landing'));
const Login          = Lazy(() => import('./pages/Login'));
const Register       = Lazy(() => import('./pages/Register'));
const ForgotPassword = Lazy(() => import('./pages/ForgotPassword'));
const Onboarding     = Lazy(() => import('./pages/Onboarding'));

// Protected pages
const Dashboard    = Lazy(() => import('./pages/Dashboard'));
const Feed         = Lazy(() => import('./pages/Feed'));
const CampusMap    = Lazy(() => import('./pages/CampusMap'));
const Events       = Lazy(() => import('./pages/Events'));
const EventDetail  = Lazy(() => import('./pages/EventDetail'));
const Mess         = Lazy(() => import('./pages/Mess'));
const MessBook     = Lazy(() => import('./pages/MessBook'));
const MessTickets  = Lazy(() => import('./pages/MessTickets'));
const Clubs        = Lazy(() => import('./pages/Clubs'));
const ClubDetail   = Lazy(() => import('./pages/ClubDetail'));
const People       = Lazy(() => import('./pages/People'));
const Profile      = Lazy(() => import('./pages/Profile'));
const ProfileEdit  = Lazy(() => import('./pages/ProfileEdit'));
const LostFound    = Lazy(() => import('./pages/LostFound'));
const Market       = Lazy(() => import('./pages/Market'));
const StudyGroups  = Lazy(() => import('./pages/StudyGroups'));
const Seniors      = Lazy(() => import('./pages/Seniors'));
const Notifications = Lazy(() => import('./pages/Notifications'));

// Guard component
function RequireAuth({ children }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function RequireGuest({ children }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

export const router = createBrowserRouter([
  // Public routes
  { path: '/', element: <Landing /> },
  {
    path: '/login',
    element: <RequireGuest><Login /></RequireGuest>,
  },
  {
    path: '/register',
    element: <RequireGuest><Register /></RequireGuest>,
  },
  { path: '/forgot-password', element: <ForgotPassword /> },
  {
    path: '/onboarding',
    element: <RequireAuth><Onboarding /></RequireAuth>,
  },

  // Protected app routes — all inside AppLayout
  {
    element: <RequireAuth><AppLayout /></RequireAuth>,
    children: [
      { path: '/dashboard',       element: <Dashboard /> },
      { path: '/feed',            element: <Feed /> },
      { path: '/map',             element: <CampusMap /> },
      { path: '/events',          element: <Events /> },
      { path: '/events/:id',      element: <EventDetail /> },
      { path: '/mess',            element: <Mess /> },
      { path: '/mess/book',       element: <MessBook /> },
      { path: '/mess/tickets',    element: <MessTickets /> },
      { path: '/clubs',           element: <Clubs /> },
      { path: '/clubs/:id',       element: <ClubDetail /> },
      { path: '/people',          element: <People /> },
      { path: '/profile/:id',     element: <Profile /> },
      { path: '/profile/edit',    element: <ProfileEdit /> },
      { path: '/lost-found',      element: <LostFound /> },
      { path: '/market',          element: <Market /> },
      { path: '/study-groups',    element: <StudyGroups /> },
      { path: '/seniors',         element: <Seniors /> },
      { path: '/notifications',   element: <Notifications /> },
    ],
  },

  // Catch-all
  { path: '*', element: <Navigate to="/" replace /> },
]);
