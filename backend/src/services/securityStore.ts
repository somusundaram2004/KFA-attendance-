import crypto from 'crypto';

export interface SecurityChallenge {
  challengeId: string;
  sessionId: string;
  userId: string;
  key1: string;
  key2?: string;
  handshakeToken?: string;
  createdAt: number;
  status: 'KEY1_ISSUED' | 'KEY2_ISSUED' | 'HANDSHAKE_READY' | 'CONSUMED';
  consumed: boolean;
}

class SecurityStoreService {
  private challenges: Map<string, SecurityChallenge> = new Map();
  private handshakeTokens: Map<string, { challengeId: string; sessionId: string; userId: string; expiresAt: number; consumed: boolean }> = new Map();

  constructor() {
    // Periodically clean up expired items every 15 seconds
    setInterval(() => this.cleanup(), 15000);
  }

  /**
   * Step 1: Create Key 1 Challenge
   */
  public createKey1Challenge(sessionId: string, userId: string): { challengeId: string; key1: string } {
    const challengeId = `ch_${crypto.randomBytes(16).toString('hex')}`;
    const key1 = `k1_${crypto.randomBytes(32).toString('hex')}`;

    const challenge: SecurityChallenge = {
      challengeId,
      sessionId,
      userId,
      key1,
      createdAt: Date.now(),
      status: 'KEY1_ISSUED',
      consumed: false,
    };

    this.challenges.set(challengeId, challenge);
    return { challengeId, key1 };
  }

  /**
   * Step 2: Generate Key 2 & Single-Use Handshake Token after validating Key 1 & delay gap
   */
  public verifyKey1AndCreateKey2(
    challengeId: string,
    providedKey1: string,
    sessionId: string,
    userId: string
  ): { key2: string; handshakeToken: string } | null {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) return null;

    const now = Date.now();
    // Expiration check (30 seconds TTL)
    if (now - challenge.createdAt > 30000) {
      this.challenges.delete(challengeId);
      return null;
    }

    // Must match session, user, key1, and status
    if (
      challenge.sessionId !== sessionId ||
      challenge.userId !== userId ||
      challenge.key1 !== providedKey1 ||
      challenge.status !== 'KEY1_ISSUED' ||
      challenge.consumed
    ) {
      return null;
    }

    // Split-second gap check (must be at least 30ms after key1 creation to ensure real 2-step sequence)
    if (now - challenge.createdAt < 30) {
      return null;
    }

    const key2 = `k2_${crypto.randomBytes(32).toString('hex')}`;
    const handshakeToken = `hs_${crypto.randomBytes(32).toString('hex')}`;

    challenge.key2 = key2;
    challenge.handshakeToken = handshakeToken;
    challenge.status = 'HANDSHAKE_READY';

    // Store handshake token with 30-second TTL
    this.handshakeTokens.set(handshakeToken, {
      challengeId,
      sessionId,
      userId,
      expiresAt: now + 30000,
      consumed: false,
    });

    return { key2, handshakeToken };
  }

  /**
   * Step 3: Validate and Consume Single-Use Handshake Token
   */
  public validateAndConsumeHandshakeToken(token: string, sessionId: string, userId: string): boolean {
    if (!token) return false;

    const tokenData = this.handshakeTokens.get(token);
    if (!tokenData) return false;

    const now = Date.now();
    if (tokenData.consumed || now > tokenData.expiresAt) {
      this.handshakeTokens.delete(token);
      return false;
    }

    if (tokenData.sessionId !== sessionId || tokenData.userId !== userId) {
      return false;
    }

    // Immediately mark as consumed to prevent replay attacks
    tokenData.consumed = true;
    this.handshakeTokens.delete(token);

    const challenge = this.challenges.get(tokenData.challengeId);
    if (challenge) {
      challenge.consumed = true;
      challenge.status = 'CONSUMED';
      this.challenges.delete(tokenData.challengeId);
    }

    return true;
  }

  private cleanup() {
    const now = Date.now();
    for (const [id, ch] of this.challenges.entries()) {
      if (now - ch.createdAt > 30000 || ch.consumed) {
        this.challenges.delete(id);
      }
    }
    for (const [t, data] of this.handshakeTokens.entries()) {
      if (now > data.expiresAt || data.consumed) {
        this.handshakeTokens.delete(t);
      }
    }
  }
}

export const securityStore = new SecurityStoreService();
