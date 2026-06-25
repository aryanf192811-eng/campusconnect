# Contributing to CampusConnect

Thank you for contributing to CampusConnect. This document explains how to get the code running locally, the repository structure, and the collaboration workflow.

## Local Setup

### Backend

1. Open `latent-backend`.
2. Copy `.env.example` to `.env`.
3. Configure database credentials and secrets.
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
6. Start the backend:
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
3. Start the frontend:
   ```bash
   npm run dev
   ```

## Branching and Workflow

- Create a branch for each feature or fix: `feature/<name>` or `fix/<name>`.
- Keep commits focused and descriptive.
- Rebase or merge from `master` before opening a pull request.
- Target `master` for production-ready changes.

## Coding Standards

- Keep backend code idiomatic to Express and PostgreSQL.
- Keep frontend code modular with reusable components.
- Use existing patterns for auth, API requests, and state.
- Run linting in the frontend with:
  ```bash
  cd latent-frontend
  npm run lint
  ```

## What to Include in a Pull Request

- Summary of the change
- Why the change was needed
- Any setup or migration notes
- Screenshots or sample requests when applicable

## Notes

- Do not commit secrets or `.env` files.
- Keep the `latent-backend/.env.example` file up to date with required configuration keys.
