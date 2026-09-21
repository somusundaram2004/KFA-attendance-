import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';
import { OfflineProvider } from '../src/context/OfflineContext';
import { COLORS } from '../src/constants/theme';

export default function RootLayout() {
  useEffect(() => {
    // Inject global web CSS animation stylesheet for micro-interactions and accessibility
    if (typeof document !== 'undefined') {
      const styleId = 'kfa-global-animation-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          * {
            transition: background-color 0.18s ease-out, border-color 0.18s ease-out, box-shadow 0.18s ease-out;
          }
          button, [role="button"] {
            transition: transform 0.12s ease-out, opacity 0.12s ease-out, background-color 0.15s ease-out;
          }
          button:active, [role="button"]:active {
            transform: scale(0.97);
          }
          input, select, textarea {
            transition: border-color 0.15s ease-out, box-shadow 0.15s ease-out;
          }
          @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
              scroll-behavior: auto !important;
            }
          }
        `;
        document.head.appendChild(style);
      }
    }

    // Register Service Worker for PWA support on web platforms
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('PWA Service Worker registered:', reg.scope))
        .catch((err) => console.warn('Service Worker registration failed:', err));
    }
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <OfflineProvider>
          <StatusBar style="light" backgroundColor={COLORS.primary} />
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: COLORS.primary,
              },
              headerTintColor: '#FFFFFF',
              headerTitleStyle: {
                fontWeight: '700',
              },
              contentStyle: {
                backgroundColor: COLORS.background,
              },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="(admin)" options={{ headerShown: false }} />
            <Stack.Screen name="(staff)" options={{ headerShown: false }} />
          </Stack>
        </OfflineProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
