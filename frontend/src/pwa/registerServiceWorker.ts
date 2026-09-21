// PWA Service Worker Registration Helper

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✓ PWA Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.warn('⚠ Service Worker registration failed:', error);
        });
    });
  }
}
