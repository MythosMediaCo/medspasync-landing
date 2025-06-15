# MedSpaSync Landing

This repository contains the landing page demo and minimal Node.js backend for MedSpaSync Pro.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Build Tailwind CSS:
   ```bash
   npm run build:css
   ```
3. Copy `.env.example` to `.env` and update the values for your environment.
4. For development you can run the server with automatic reloads (requires `nodemon`):
   ```bash
   npm run start:dev
   ```
5. Start the server:
   ```bash
   npm start
   ```

The server serves the static files from the `public` directory and exposes several API endpoints under `/api`.

### Environment Variables

The application relies on a number of environment variables. See `.env.example` for a complete list. At minimum you must configure a MongoDB connection string and your Stripe keys:

```env
MONGO_URI=mongodb://localhost/medspasync
STRIPE_SECRET_KEY=sk_test_your_key
```

### Recommended Node Version

Use Node.js 18 or newer for best compatibility.
