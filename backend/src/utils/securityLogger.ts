export enum SecurityEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  KEY1_REQUESTED = 'KEY1_REQUESTED',
  KEY2_REQUESTED = 'KEY2_REQUESTED',
  HANDSHAKE_SUCCESS = 'HANDSHAKE_SUCCESS',
  HANDSHAKE_FAILURE = 'HANDSHAKE_FAILURE',
  REPLAY_ATTEMPT = 'REPLAY_ATTEMPT',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

export function logSecurityEvent(
  type: SecurityEventType,
  details: {
    userId?: string;
    sessionId?: string;
    ip?: string;
    route?: string;
    message?: string;
  }
) {
  const timestamp = new Date().toISOString();
  // Ensure no sensitive credentials, passwords, raw tokens, or keys are logged
  console.log(
    JSON.stringify({
      level: 'SECURITY',
      type,
      timestamp,
      userId: details.userId || 'anonymous',
      sessionId: details.sessionId ? `${details.sessionId.substring(0, 8)}...` : undefined,
      ip: details.ip || 'unknown',
      route: details.route || 'unknown',
      message: details.message || '',
    })
  );
}
