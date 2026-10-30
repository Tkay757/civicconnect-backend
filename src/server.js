import express from 'express';
import cors from 'cors';
import { initDatabase } from './db.js';
import { seedDatabase } from './seed.js';
import issuesRouter from './routes/issues.js';
import contactsRouter from './routes/contacts.js';
import statsRouter from './routes/stats.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS for mobile app and web clients
app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'CivicConnect Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/issues', issuesRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/stats', statsRouter);

// Initialize DB and Start Server
try {
  initDatabase();
  seedDatabase();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 CivicConnect REST API running on http://127.0.0.1:${PORT}`);
    console.log(`📡 Health Check: http://127.0.0.1:${PORT}/api/health`);
    console.log(`📋 Issues API: http://127.0.0.1:${PORT}/api/issues`);
  });
} catch (err) {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
}
