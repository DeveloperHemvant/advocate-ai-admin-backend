import dotenv from 'dotenv';
dotenv.config();

// Use admin-panel–dedicated DB if set (separate from app API and AI agent).
if (process.env.LEGAL_AI_ADMIN_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.LEGAL_AI_ADMIN_DATABASE_URL;
}

import app from './app.js';
import { config } from './config/index.js';
import { ensureDefaultAdmin } from './services/adminSeed.js';

async function start() {
  await ensureDefaultAdmin();
  app.listen(config.port, () => {
    console.log(`Legal AI Admin API running on http://localhost:${config.port}`);
    console.log(`Swagger docs at http://localhost:${config.port}/docs`);
  });
}

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
