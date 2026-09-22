import { Request, Response, NextFunction } from 'express';
import { securityStore } from '../services/securityStore';
import { logSecurityEvent, SecurityEventType } from '../utils/securityLogger';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
  full_name?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  sessionId?: string;
}

// Global active server session store
export const sessionStore = new Map<string, { sessionId: string; user: AuthenticatedUser; createdAt: number }>();

const isProduction = process.env.NODE_ENV === 'production';
const DEMO_SESSION_TOKEN = 'demo-session-token';

// Populate fallback session for dev/testing only (disabled in production)
if (!isProduction) {
  sessionStore.set(DEMO_SESSION_TOKEN, {
    sessionId: 's_demo_001',
    user: { id: 'u-admin-001', email: 'admin@kfa.edu', role: 'ADMIN', full_name: 'Demo Admin' },
    createdAt: Date.now(),
  });
}

/**
 * Middleware 1: Authenticate Session Token
 */
export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    // Check fallback demo headers for dev testing (only in non-production)
    if (!isProduction) {
      const demoToken = sessionStore.get(DEMO_SESSION_TOKEN);
      if (demoToken) {
        req.user = demoToken.user;
        req.sessionId = demoToken.sessionId;
        return next();
      }
    }
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const session = sessionStore.get(token);

  if (!session) {
    logSecurityEvent(SecurityEventType.UNAUTHORIZED_ACCESS, {
      route: req.originalUrl,
      message: 'Invalid or expired session token',
    });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.user = session.user;
  req.sessionId = session.sessionId;
  next();
};

/**
 * Middleware 2: Two-Key Handshake Verification
 * Verifies single-use handshake token from header 'x-handshake-token'
 */
export const verifyHandshake = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const handshakeToken = (req.headers['x-handshake-token'] || req.headers['x-handshake-key']) as string;

  if (!req.user || !req.sessionId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!handshakeToken) {
    logSecurityEvent(SecurityEventType.HANDSHAKE_FAILURE, {
      userId: req.user.id,
      sessionId: req.sessionId,
      route: req.originalUrl,
      message: 'Missing x-handshake-token header',
    });
    return res.status(403).json({ error: 'Forbidden' });
  }

  const isValid = securityStore.validateAndConsumeHandshakeToken(handshakeToken, req.sessionId, req.user.id);

  if (!isValid) {
    logSecurityEvent(SecurityEventType.HANDSHAKE_FAILURE, {
      userId: req.user.id,
      sessionId: req.sessionId,
      route: req.originalUrl,
      message: 'Handshake token invalid, expired, or already consumed',
    });
    // Return generic error without exposing security implementation details
    return res.status(403).json({ error: 'Forbidden' });
  }

  logSecurityEvent(SecurityEventType.HANDSHAKE_SUCCESS, {
    userId: req.user.id,
    sessionId: req.sessionId,
    route: req.originalUrl,
  });

  next();
};

/**
 * Middleware 3: Strict Server-Side Role Authorization (STAFF or ADMIN only)
 */
export const roleMiddleware = (allowedRoles: Array<'ADMIN' | 'STAFF'>) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logSecurityEvent(SecurityEventType.UNAUTHORIZED_ACCESS, {
        userId: req.user.id,
        sessionId: req.sessionId,
        route: req.originalUrl,
        message: `Role ${req.user.role} attempted to access restricted endpoint requiring ${allowedRoles.join('/')}`,
      });
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
};

/**
 * Middleware 4: Staff Resource Assignment Verification
 * Verifies staff user has permission for requested batchId
 */
export const authorizeStaffBatch = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Admins are authorized for all batches
  if (req.user.role === 'ADMIN') {
    return next();
  }

  const batchId = req.params.batchId || req.query.batchId || req.body?.batch_id || req.body?.batchId;

  // If no specific batch requested, allow proceed (controller handles filtering by assigned batches)
  if (!batchId) {
    return next();
  }

  // For Staff: check assigned batches
  // Demo assigned batch IDs for Priya Sharma: 'b-001', 'b-002', 'batch-1', 'batch-2'
  const assignedBatchIds = ['b-001', 'b-002', 'batch-1', 'batch-2'];

  if (!assignedBatchIds.includes(String(batchId))) {
    logSecurityEvent(SecurityEventType.UNAUTHORIZED_ACCESS, {
      userId: req.user.id,
      sessionId: req.sessionId,
      route: req.originalUrl,
      message: `Staff ${req.user.id} attempted to access unassigned batch ${batchId}`,
    });
    return res.status(403).json({ error: 'Forbidden. Batch not assigned to staff.' });
  }

  next();
};
