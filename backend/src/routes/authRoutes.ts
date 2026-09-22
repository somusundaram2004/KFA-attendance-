import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { supabase } from '../config/supabase';
import { AuthenticatedRequest, authenticate, sessionStore } from '../middleware/authMiddleware';
import { logSecurityEvent, SecurityEventType } from '../utils/securityLogger';
import { createRateLimiter } from '../middleware/rateLimiter';

const router = Router();

const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minute window
  max: 10, // Max 10 attempts per 15 minutes
  keyPrefix: 'login',
});

// Demo accounts database for offline/test environments
const DEMO_USERS: Record<string, { id: string; email: string; pass: string; role: 'ADMIN' | 'STAFF'; full_name: string }> = {
  'admin@kfa.edu': {
    id: 'u-admin-001',
    email: 'admin@kfa.edu',
    pass: 'AdminPass123!',
    role: 'ADMIN',
    full_name: 'System Admin',
  },
  'staff.priya@kfa.edu': {
    id: 'u-staff-001',
    email: 'staff.priya@kfa.edu',
    pass: 'StaffPass123!',
    role: 'STAFF',
    full_name: 'Priya Sharma',
  },
};

/**
 * POST /api/auth/login
 */
router.post('/login', loginRateLimiter, async (req: Request, res: Response) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    logSecurityEvent(SecurityEventType.LOGIN_FAILURE, { message: 'Missing credentials' });
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const cleanEmail = String(email).trim().toLowerCase();

  try {
    // 1. Try Supabase Authentication if configured
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!error && data.user) {
        // Fetch role from profiles table
        const { data: prof } = await supabase
          .from('profiles')
          .select('role, status, full_name')
          .eq('id', data.user.id)
          .single();

        if (!prof || prof.status !== 'ACTIVE') {
          logSecurityEvent(SecurityEventType.LOGIN_FAILURE, { userId: data.user.id, message: 'Inactive account' });
          return res.status(403).json({ error: 'Account is inactive. Contact Admin.' });
        }

        const role: 'ADMIN' | 'STAFF' = prof.role === 'ADMIN' ? 'ADMIN' : 'STAFF';
        const sessionToken = `st_${crypto.randomBytes(32).toString('hex')}`;
        const sessionId = `s_${crypto.randomBytes(16).toString('hex')}`;

        sessionStore.set(sessionToken, {
          sessionId,
          user: {
            id: data.user.id,
            email: cleanEmail,
            role,
            full_name: prof.full_name || cleanEmail,
          },
          createdAt: Date.now(),
        });

        logSecurityEvent(SecurityEventType.LOGIN_SUCCESS, { userId: data.user.id, sessionId });

        return res.json({
          success: true,
          token: sessionToken,
          user: {
            id: data.user.id,
            email: cleanEmail,
            role,
            full_name: prof.full_name,
          },
        });
      }
    }

    // 2. Demo User Fallback (Strict role mapping: STAFF or ADMIN; disabled in production when Supabase is active)
    const isProduction = process.env.NODE_ENV === 'production';
    if (!isProduction || !process.env.SUPABASE_URL) {
      const demoUser = DEMO_USERS[cleanEmail];
      if (demoUser && demoUser.pass === password) {
        const sessionToken = `st_${crypto.randomBytes(32).toString('hex')}`;
        const sessionId = `s_${crypto.randomBytes(16).toString('hex')}`;

        sessionStore.set(sessionToken, {
          sessionId,
          user: {
            id: demoUser.id,
            email: demoUser.email,
            role: demoUser.role,
            full_name: demoUser.full_name,
          },
          createdAt: Date.now(),
        });

        logSecurityEvent(SecurityEventType.LOGIN_SUCCESS, { userId: demoUser.id, sessionId });

        return res.json({
          success: true,
          token: sessionToken,
          user: {
            id: demoUser.id,
            email: demoUser.email,
            role: demoUser.role,
            full_name: demoUser.full_name,
          },
        });
      }
    }

    logSecurityEvent(SecurityEventType.LOGIN_FAILURE, { message: `Failed login attempt for ${cleanEmail}` });
    return res.status(401).json({ error: 'Invalid email or password' });
  } catch (err: any) {
    logSecurityEvent(SecurityEventType.LOGIN_FAILURE, { message: err.message });
    return res.status(500).json({ error: 'Authentication failed' });
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    sessionStore.delete(token);
  }

  if (req.user) {
    logSecurityEvent(SecurityEventType.LOGOUT, { userId: req.user.id, sessionId: req.sessionId });
  }

  return res.json({ success: true, message: 'Logged out successfully' });
});

/**
 * GET /api/auth/me
 */
router.get('/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return res.json({
    user: req.user,
  });
});

export default router;
