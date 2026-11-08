import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  envPrefix: ['VITE_', 'REACT_APP_'],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  server: { host: '0.0.0.0', port: 3000, strictPort: true, allowedHosts: true, hmr: { clientPort: 443 } },
  preview: { host: '0.0.0.0', port: 3000, allowedHosts: true },
  build: { outDir: 'build', sourcemap: false },
});
