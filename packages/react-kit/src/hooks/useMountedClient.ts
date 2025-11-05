import { useEffect, useState } from 'react';

/**
 * Hook to detect when component has mounted on client-side
 *
 * Significance: Essential for SSR (Server-Side Rendering) compatibility
 * Core idea: Safely distinguishes between server and client rendering phases
 * Main function: Returns boolean flag indicating if component is mounted on client
 * Main purpose: Prevent hydration mismatches and enable client-only features
 *
 * Key features:
 * - Returns false during SSR and initial render
 * - Returns true after component mounts on client
 * - Uses requestAnimationFrame for smooth transition
 * - Properly cleans up animation frame on unmount
 *
 * Use cases:
 * - Preventing hydration mismatches in SSR applications
 * - Deferring client-only code (window, document access)
 * - Loading client-side libraries after mount
 * - Conditional rendering based on client availability
 * - Avoiding "window is not defined" errors
 *
 * @returns Boolean flag - false during SSR/initial render, true after client mount
 *
 * @example Preventing hydration mismatch
 * function ThemeToggle() {
 *   const mounted = useMountedClient();
 *
 *   // During SSR, show placeholder to avoid mismatch
 *   if (!mounted) {
 *     return <div className="theme-toggle-placeholder" />;
 *   }
 *
 *   // Client-only: access localStorage safely
 *   const theme = localStorage.getItem('theme');
 *   return <button>{theme === 'dark' ? '🌙' : '☀️'}</button>;
 * }
 *
 * @example Accessing browser APIs safely
 * function WindowSize() {
 *   const mounted = useMountedClient();
 *   const [size, setSize] = useState({ width: 0, height: 0 });
 *
 *   useEffect(() => {
 *     if (!mounted) return;
 *
 *     const updateSize = () => {
 *       setSize({
 *         width: window.innerWidth,
 *         height: window.innerHeight
 *       });
 *     };
 *
 *     updateSize();
 *     window.addEventListener('resize', updateSize);
 *     return () => window.removeEventListener('resize', updateSize);
 *   }, [mounted]);
 *
 *   if (!mounted) return null;
 *   return <div>Window: {size.width} x {size.height}</div>;
 * }
 *
 * @example Loading client-side library
 * function MapComponent() {
 *   const mounted = useMountedClient();
 *   const [map, setMap] = useState(null);
 *
 *   useEffect(() => {
 *     if (!mounted) return;
 *
 *     // Load mapping library only on client
 *     import('leaflet').then((L) => {
 *       const mapInstance = L.map('map');
 *       setMap(mapInstance);
 *     });
 *   }, [mounted]);
 *
 *   if (!mounted) {
 *     return <div>Loading map...</div>;
 *   }
 *
 *   return <div id="map" />;
 * }
 *
 * @example Conditional user-specific content
 * function UserGreeting() {
 *   const mounted = useMountedClient();
 *
 *   if (!mounted) {
 *     // Show generic greeting during SSR
 *     return <h1>Welcome!</h1>;
 *   }
 *
 *   // Client-only: access cookies/session
 *   const username = document.cookie.includes('username');
 *   return <h1>Welcome back, {username}!</h1>;
 * }
 *
 * @example With Next.js dynamic import
 * import dynamic from 'next/dynamic';
 *
 * function DashboardPage() {
 *   const mounted = useMountedClient();
 *
 *   // Prevent flash of wrong content
 *   if (!mounted) {
 *     return <LoadingSpinner />;
 *   }
 *
 *   // Now safe to render client-only components
 *   return <ClientOnlyChart data={data} />;
 * }
 */
export const useMountedClient = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setMounted(true);
    });

    return () => {
      cancelAnimationFrame(timer);
    };
  }, []);

  return mounted;
};
