import 'dotenv/config';
import { createApp } from '../src/app.js';
import { connectDB } from '../src/config/db.js';

// No socket.io here: Vercel's serverless functions can't hold the persistent
// connections it needs. The app still works over plain REST — sendMessage
// just skips the realtime push (see messageController.js).
const app = createApp();

const STATIC_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5175',
  'https://chat.quantumlogicslimited.com',
  'https://ai.quantumlogicslimited.com',
  'https://quantum-chat.vercel.app',
  'https://quantum-ai-frontend.vercel.app',
];

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (STATIC_ALLOWED_ORIGINS.includes(origin)) return true;
  return String(process.env.CLIENT_URL || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .includes(origin);
}

function applyCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    req.headers['access-control-request-headers'] || 'Content-Type, Authorization'
  );
  res.setHeader('Access-Control-Max-Age', '86400');
}

export default async function handler(req, res) {
  // Preflight must succeed even when Mongo is down — otherwise browsers
  // report a misleading CORS error instead of the real 503.
  if (req.method === 'OPTIONS') {
    applyCorsHeaders(req, res);
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    await connectDB();
  } catch (err) {
    console.error('Database connection failed:', err);
    applyCorsHeaders(req, res);
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 503;
    res.end(JSON.stringify({ success: false, error: 'Database unavailable' }));
    return;
  }

  return app(req, res);
}
