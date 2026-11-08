import crypto from 'node:crypto';
import { ensureUser, createSession } from '../src/security/auth.js';

// Testing helper: node scripts/test-session.js someone@example.com "Name"
const [email, name = 'Test Owner'] = process.argv.slice(2);
if (!email) { console.error('usage: test-session.js <email> [name]'); process.exit(1); }
const user = await ensureUser({ email, name, picture: null });
const token = `test_${crypto.randomBytes(16).toString('hex')}`;
await createSession(user.id, token);
console.log(JSON.stringify({ user_id: user.id, email: user.email, session_token: token }));
