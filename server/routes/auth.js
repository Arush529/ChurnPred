import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserService } from '../models/User.js';
import { getStatus } from '../config/db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'churnpred_dev_secret_key_2026';

/**
 * Health & MongoDB Status
 */
router.get('/health', async (req, res) => {
  const dbStatus = getStatus();
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: {
      type: 'MongoDB',
      ...dbStatus
    }
  });
});

/**
 * User Registration
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, company } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Full Name is required.' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await UserService.findByEmail(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await UserService.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      company: (company && company.trim()) || 'Enterprise Org',
      role: 'Retention Analyst'
    });

    const token = jwt.sign(
      { email: newUser.email, name: newUser.name, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      user: {
        name: newUser.name,
        email: newUser.email,
        company: newUser.company,
        role: newUser.role,
        token
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message || 'Server error during registration.' });
  }
});

/**
 * User Login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter both email and password.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await UserService.findByEmail(cleanEmail);
    if (!user) {
      return res.status(401).json({ error: 'No account found with this email address.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    await UserService.updateLastLogin(cleanEmail);

    const token = jwt.sign(
      { email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        company: user.company,
        role: user.role,
        token
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message || 'Server error during authentication.' });
  }
});

/**
 * Get Current User Profile (JWT Authentication)
 */
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header missing or invalid.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await UserService.findByEmail(decoded.email);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        company: user.company,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired session token.' });
  }
});

/**
 * List all users (Public metadata)
 */
router.get('/users', async (req, res) => {
  try {
    const users = await UserService.getAllSafe();
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
