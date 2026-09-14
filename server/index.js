import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { connectDB, getStatus } from './config/db.js';
import { UserService } from './models/User.js';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'ChurnPred External MongoDB Backend Server',
    status: 'online',
    version: '2.0.0',
    mongodb: getStatus()
  });
});

/**
 * Seed initial Demo Analyst account if empty
 */
async function seedInitialDemo() {
  try {
    const count = await UserService.count();
    if (count === 0) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('password123', salt);
      await UserService.create({
        name: 'Demo Analyst',
        email: 'demo@churnpred.io',
        passwordHash,
        company: 'Acme Telecommunications',
        role: 'Lead ML Retention Strategist'
      });
      console.log('[Seed] Demo Analyst account created (demo@churnpred.io / password123)');
    }
  } catch (err) {
    console.warn('[Seed] Could not seed initial user:', err.message);
  }
}

// Start Server
async function start() {
  // Connect to MongoDB
  await connectDB();

  // Seed demo account
  await seedInitialDemo();

  app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`✦ ChurnPred External Backend Running on Port ${PORT}`);
    console.log(`✦ Health Check: http://localhost:${PORT}/api/auth/health`);
    console.log(`✦ MongoDB URI:  ${process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/churnpred'}`);
    console.log(`==================================================\n`);
  });
}

start().catch(err => {
  console.error('Fatal server startup error:', err);
});
