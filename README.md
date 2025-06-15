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
4. Start the server:
   ```bash
   npm start
   ```

The server serves the static files from the `public` directory and exposes several API endpoints under `/api`.
