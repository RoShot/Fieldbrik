/**
 * Server entry point.
 */

const app = require('./app');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  const shown = HOST === '0.0.0.0' ? 'localhost' : HOST;
  console.log(`[fieldbrik] listening on http://${shown}:${PORT}`);
});

// Fail loudly instead of leaving a half-dead server process.
process.on('unhandledRejection', (reason) => {
  console.error('[fieldbrik] unhandled rejection:', reason);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));
