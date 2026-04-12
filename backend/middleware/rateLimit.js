/**
 * Lightweight in-memory rate limiter.
 * Suitable for a single-instance deployment and safe fallback protection
 * when a shared store (Redis) is not configured.
 */

const WINDOW_CLEANUP_INTERVAL_MS = 60 * 1000;

const createRateLimiter = ({
  windowMs,
  maxRequests,
  message = 'Too many requests, please try again later.',
  keyGenerator,
  skip,
} = {}) => {
  if (!windowMs || !maxRequests) {
    throw new Error('createRateLimiter requires windowMs and maxRequests');
  }

  const hits = new Map();

  const cleanupExpiredEntries = () => {
    const now = Date.now();
    for (const [key, entry] of hits.entries()) {
      if (entry.resetAt <= now) {
        hits.delete(key);
      }
    }
  };

  const interval = setInterval(cleanupExpiredEntries, WINDOW_CLEANUP_INTERVAL_MS);
  if (typeof interval.unref === 'function') {
    interval.unref();
  }

  return (req, res, next) => {
    if (typeof skip === 'function' && skip(req)) {
      return next();
    }

    const key = typeof keyGenerator === 'function'
      ? keyGenerator(req)
      : req.ip;

    const now = Date.now();
    const current = hits.get(key);

    if (!current || current.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (current.count >= maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
      res.set('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({ message });
    }

    current.count += 1;
    return next();
  };
};

module.exports = { createRateLimiter };
