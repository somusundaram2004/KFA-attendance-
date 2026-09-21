import { Request, Response, NextFunction } from 'express';
import { logSecurityEvent, SecurityEventType } from '../utils/securityLogger';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export function createRateLimiter(options: { windowMs: number; max: number; keyPrefix?: string }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const prefix = options.keyPrefix || 'rl';
    const key = `${prefix}:${ip}`;

    const now = Date.now();
    let record = rateLimitStore.get(key);

    if (!record || now > record.resetAt) {
      record = {
        count: 1,
        resetAt: now + options.windowMs,
      };
      rateLimitStore.set(key, record);
      return next();
    }

    record.count += 1;

    if (record.count > options.max) {
      logSecurityEvent(SecurityEventType.RATE_LIMIT_EXCEEDED, {
        ip: String(ip),
        route: req.originalUrl,
        message: `Rate limit exceeded: ${record.count} requests in ${options.windowMs}ms window`,
      });

      return res.status(429).json({
        error: 'Too many requests. Please slow down and try again.',
      });
    }

    next();
  };
}
