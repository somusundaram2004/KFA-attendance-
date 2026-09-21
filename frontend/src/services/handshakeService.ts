import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

export interface HandshakeHeaders {
  'Authorization'?: string;
  'x-handshake-token'?: string;
  'Content-Type': string;
}

/**
 * Executes Two-Key Handshake Flow with Backend:
 * STEP 1: Request Key-1 Challenge
 * GAP: Small randomized delay (60-120ms)
 * STEP 2: Request Key-2 Challenge & Single-Use Handshake Token
 */
export async function performTwoKeyHandshake(): Promise<HandshakeHeaders | null> {
  try {
    const sessionToken = await AsyncStorage.getItem('kfa_session_token');
    const authHeader = sessionToken ? `Bearer ${sessionToken}` : undefined;

    // STEP 1: Request Key 1
    const res1 = await fetch(`${BACKEND_URL}/api/security/key-1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });

    if (!res1.ok) {
      console.warn('Key-1 handshake request failed with status:', res1.status);
      return null;
    }

    const data1 = await res1.json();
    if (!data1.success || !data1.challengeId || !data1.key1) {
      console.warn('Invalid Key-1 response payload');
      return null;
    }

    // GAP: Randomized split-second delay (60ms to 120ms)
    const randomDelay = Math.floor(Math.random() * 60) + 60;
    await new Promise((resolve) => setTimeout(resolve, randomDelay));

    // STEP 2: Request Key 2
    const res2 = await fetch(`${BACKEND_URL}/api/security/key-2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({
        challengeId: data1.challengeId,
        key1: data1.key1,
      }),
    });

    if (!res2.ok) {
      console.warn('Key-2 handshake request failed with status:', res2.status);
      return null;
    }

    const data2 = await res2.json();
    if (!data2.success || !data2.handshakeToken) {
      console.warn('Invalid Key-2 response payload');
      return null;
    }

    return {
      'Content-Type': 'application/json',
      ...(authHeader ? { Authorization: authHeader } : {}),
      'x-handshake-token': data2.handshakeToken,
    };
  } catch (error) {
    console.error('Error during two-key handshake execution:', error);
    return null;
  }
}
