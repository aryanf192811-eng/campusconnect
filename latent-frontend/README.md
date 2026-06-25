# CampusConnect Frontend

This is the React + Vite frontend for CampusConnect.

## Overview

`latent-frontend` is a React 19 application built with Vite. It connects to the CampusConnect backend API and provides the full student user experience:

- authentication and onboarding screens
- dashboard, feed, and notifications
- campus map visualization with Leaflet
- events, clubs, mess booking, market, lost & found, people discovery, study groups, seniors
- protected app layout with public/guest and authenticated route guards

## Run Locally

```bash
cd latent-frontend
npm install
npm run dev
```

By default, the app runs on `http://localhost:5173`.

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — build production assets
- `npm run lint` — run Oxlint on the frontend code
- `npm run preview` — preview the production build locally

## Tech Stack

- React 19
- Vite
- React Router v7
- Zustand for auth state management
- TanStack Query for API caching
- Leaflet + React Leaflet for maps
- Axios for HTTP requests
- Sonner for toast notifications

## Notes

- Ensure the backend is running and `FRONTEND_URL` is configured in `latent-backend/.env`.
- The frontend ships its own router and user state store.
- Keep `latent-backend` and `latent-frontend` workspaces separate when installing dependencies.
