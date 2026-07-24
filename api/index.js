// Intentionally minimal top-level imports so OPTIONS never depends on
// Express/Mongoose boot. Heavier modules load only for real requests.

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

function sendJson(res, status, body) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = status;
  res.end(JSON.stringify(body));
}

let appPromise;

async function getApp() {
  if (!appPromise) {
    await import('dotenv/config');
    const { createApp } = await import('../src/app.js');
    appPromise = createApp();
  }
  return appPromise;
}

export default async function handler(req, res) {
  // Preflight must succeed with zero app/DB dependencies.
  if (req.method === 'OPTIONS') {
    applyCorsHeaders(req, res);
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    await import('dotenv/config');
    const { connectDB } = await import('../src/config/db.js');
    await connectDB();
  } catch (err) {
    console.error('Database connection failed:', err);
    applyCorsHeaders(req, res);
    sendJson(res, 503, { success: false, error: 'Database unavailable' });
    return;
  }

  try {
    const app = await getApp();
    return app(req, res);
  } catch (err) {
    console.error('App handler failed:', err);
    applyCorsHeaders(req, res);
    sendJson(res, 500, { success: false, error: 'Internal server error' });
  }
}
