import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite configuration for brain-user example
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    open: true
  }
});
