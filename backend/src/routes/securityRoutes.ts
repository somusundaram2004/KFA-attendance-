import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticate } from '../middleware/authMiddleware';
import { securityStore } from '../services/securityStore';
import { logSecurityEvent, SecurityEventType } from '../utils/securityLogger';
import { createRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply strict rate limiting to security endpoints
const securityRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120, // max 120 key requests per minute
  keyPrefix: 'sec',
});

router.use(securityRateLimiter);
router.use(authenticate);

/**
 * STEP 1: Request Key 1 Challenge
 * POST /api/security/key-1
 */
router.post('/key-1', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || !req.sessionId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { challengeId, key1 } = securityStore.createKey1Challenge(req.sessionId, req.user.id);

  logSecurityEvent(SecurityEventType.KEY1_REQUESTED, {
    userId: req.user.id,
    sessionId: req.sessionId,
    route: '/api/security/key-1',
  });

  return res.json({
    success: true,
    challengeId,
    key1,
  });
});

/**
 * STEP 2: Request Key 2 & Handshake Token
 * POST /api/security/key-2
 */
router.post('/key-2', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || !req.sessionId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { challengeId, key1 } = req.body || {};

  if (!challengeId || !key1) {
    logSecurityEvent(SecurityEventType.HANDSHAKE_FAILURE, {
      userId: req.user.id,
      sessionId: req.sessionId,
      route: '/api/security/key-2',
      message: 'Missing challengeId or key1',
    });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const result = securityStore.verifyKey1AndCreateKey2(
    challengeId,
    key1,
    req.sessionId,
    req.user.id
  );

  if (!result) {
    logSecurityEvent(SecurityEventType.HANDSHAKE_FAILURE, {
      userId: req.user.id,
      sessionId: req.sessionId,
      route: '/api/security/key-2',
      message: 'Challenge validation failed',
    });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  logSecurityEvent(SecurityEventType.KEY2_REQUESTED, {
    userId: req.user.id,
    sessionId: req.sessionId,
    route: '/api/security/key-2',
  });

  return res.json({
    success: true,
    challengeId,
    key2: result.key2,
    handshakeToken: result.handshakeToken,
  });
});

export default router;
