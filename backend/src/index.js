import { pathToFileURL } from 'node:url';
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { env } from './env.js';
import { originGuard } from './security/sanitize.js';
import auth from './routes/auth.js';
import me from './routes/me.js';
import recommend from './routes/recommend.js';
import tools from './routes/tools.js';
import actions from './routes/actions.js';
import admin from './routes/admin.js';
import chat from './routes/chat.js';

function isLocalDevOrigin(origin) {
  if (!origin) return false;
  try {
    const { hostname } = new URL(origin);
    return ['localhost', '127.0.0.1', '::1', '[::1]'].includes(hostname);
  } catch {
    return false;
  }
}

export function createApp() {
  const app = express();
  app.set('trust proxy', true);
  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } }, crossOriginResourcePolicy: { policy: 'same-site' } }));
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && isLocalDevOrigin(origin)) {
      res.set('Access-Control-Allow-Origin', origin);
      res.set('Access-Control-Allow-Credentials', 'true');
      res.set('Vary', 'Origin');
    }
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS');
      res.set('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || 'Content-Type, Authorization');
      return res.sendStatus(204);
    }
    return next();
  });
  app.use(express.json({ limit: '64kb' }));
  app.use(cookieParser());
  app.use('/api', originGuard);
  app.use('/api', (req, res, next) => { if (req.method !== 'GET') res.set('Cache-Control', 'no-store'); next(); });
  for (const router of [auth, me, recommend, tools, actions, admin, chat]) app.use('/api', router);
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    const status = err.status || 500;
    if (status >= 500) console.error(`[error] ${err.message}`);
    res.status(status).json({ error: status === 503 ? 'The service is still being set up. Please try again soon.' : 'Something went wrong. Please try again.' });
  });
  return app;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createApp().listen(env.PORT, '127.0.0.1', () => console.log(`APEX api on ${env.PORT}`));
}
