import rateLimit from 'express-rate-limit';

// Blunt brute-force/credential-stuffing attempts against auth endpoints
// without affecting normal chat traffic.
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  message: { success: false, error: 'Too many attempts, please try again shortly' },
});

/** General authenticated API limiter (CodeQL missing-rate-limiting). */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again shortly' },
});

/**
 * Realtime sync polling limiter. Keyed by user id, not IP: clients poll this
 * endpoint every couple of seconds, so the IP-keyed apiLimiter would make users
 * behind one NAT starve each other. Must be mounted *after* requireAuth so
 * req.user exists — the req.ip fallback only covers misordered mounts.
 */
export const syncLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 90,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user?._id || req.ip),
  message: { success: false, error: 'Too many sync requests, please try again shortly' },
});
