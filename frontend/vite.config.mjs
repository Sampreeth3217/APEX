import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Local dev: the browser talks only to this server; /api is proxied to the Node API (default http://127.0.0.1:8002).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.API_PROXY_TARGET || 'http://127.0.0.1:8002';
  // If the API is restarting, answer 503 (retried by the app) instead of a generic 500.
  const configure = (proxy) => proxy.on('error', (_err, _req, res) => {
    if (res && !res.headersSent && typeof res.writeHead === 'function') { res.writeHead(503, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'The server is restarting. Please try again in a moment.' })); }
  });
  const proxy = { '/api': { target: apiTarget, changeOrigin: false, configure } };
  return {
    plugins: [react()],
    envPrefix: ['VITE_', 'REACT_APP_'],
    resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
    server: { port: 3000, strictPort: true, proxy },
    preview: { port: 3000, proxy },
    build: { outDir: 'build', sourcemap: false },
  };
});
