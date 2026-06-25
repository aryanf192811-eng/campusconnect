# CampusConnect

CampusConnect is a campus engagement platform built as a dual-project repository:

- `latent-backend`: Node.js + Express API with PostgreSQL, authentication, notifications, mess management, events, clubs, people discovery, marketplace, lost & found, and campus services.
- `latent-frontend`: React + Vite web client that enables authenticated campus users to browse feed, map, events, mess, clubs, people, study groups, seniors, marketplace and notifications.

## Product Overview

CampusConnect is designed for modern campus life:

- student onboarding and profile management
- secure login, password reset, OTP verification
- real-time notifications and SSE support
- campus map with location-aware services
- event discovery and event-detail flows
- mess bookings, tickets, and food notifications
- clubs and people discovery with follow/friend features
- lost & found, study groups, senior support, and marketplace
- weather integration and Razorpay payment support for campus services

## Architecture

### Backend (`latent-backend`)

- Express.js API server
- PostgreSQL database via `pg`
- JWT-based authentication and sessionless API
- File uploads with `multer`
- Rate limiting, security headers, and compression
- Config-driven environment validation and optional feature flags

### Frontend (`latent-frontend`)

- React 19 + Vite
- React Router v7 for guarded public/protected routes
- Zustand for lightweight auth state
- TanStack Query for data fetching and caching
- Leaflet for campus mapping
- Responsive app layout with notifications and skeleton loading

## Setup

### Backend

1. Open `latent-backend`.
2. Copy `.env.example` to `.env`.
3. Set database credentials and secrets.
4. Install dependencies:
   ```bash
   cd latent-backend
   npm install
   ```
5. Initialize the database schema and seed data:
   ```bash
   npm run schema
   npm run seed
   ```
6. Start the API server:
   ```bash
   npm run dev
   ```

### Frontend

1. Open `latent-frontend`.
2. Install dependencies:
   ```bash
   cd latent-frontend
   npm install
   ```
3. Start the development app:
   ```bash
   npm run dev
   ```

## Important Environment Variables

Backend requires at least these values in `latent-backend/.env`:

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET`, `JWT_OTP_SECRET`, `JWT_RESET_SECRET`
- `FRONTEND_URL`

Optional but recommended:

- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- `OPENWEATHER_API_KEY`

## Repository Notes

- This repository currently contains two separate runnable projects.
- `latent-backend` is the API service; `latent-frontend` is the client.
- There is no top-level `package.json`; each project maintains its own dependencies.

## Deployment

For deployment, build the frontend and serve it alongside the API or from a static host. Ensure backend environment secrets are set and the production `FRONTEND_URL` is configured.

## Remote Repository

This project is configured to push to `https://github.com/aryanf192811-eng/campusconnect.git`.
