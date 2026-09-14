import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  company: {
    type: String,
    default: 'Enterprise'
  },
  role: {
    type: String,
    default: 'Retention Analyst'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: null
  }
});

export const MongoUserModel = mongoose.models.User || mongoose.model('User', userSchema);

// File-based fallback store directory
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'users.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

function readFallbackUsers() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function writeFallbackUsers(users) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

/**
 * Universal User Service
 * Uses MongoDB (Mongoose) when connected, with automatic seamless fallback to disk store if MongoDB is offline.
 */
export class UserService {
  static async isMongoActive() {
    return mongoose.connection.readyState === 1;
  }

  static async findByEmail(email) {
    const cleanEmail = email.trim().toLowerCase();
    if (await this.isMongoActive()) {
      return await MongoUserModel.findOne({ email: cleanEmail });
    } else {
      const users = readFallbackUsers();
      return users.find(u => u.email === cleanEmail) || null;
    }
  }

  static async create(userData) {
    const cleanEmail = userData.email.trim().toLowerCase();
    if (await this.isMongoActive()) {
      const doc = new MongoUserModel({
        ...userData,
        email: cleanEmail
      });
      return await doc.save();
    } else {
      const users = readFallbackUsers();
      const newUser = {
        _id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: userData.name.trim(),
        email: cleanEmail,
        passwordHash: userData.passwordHash,
        company: userData.company || 'Enterprise',
        role: userData.role || 'Retention Analyst',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      users.push(newUser);
      writeFallbackUsers(users);
      return newUser;
    }
  }

  static async updateLastLogin(email) {
    const cleanEmail = email.trim().toLowerCase();
    if (await this.isMongoActive()) {
      return await MongoUserModel.findOneAndUpdate(
        { email: cleanEmail },
        { lastLogin: new Date() },
        { new: true }
      );
    } else {
      const users = readFallbackUsers();
      const idx = users.findIndex(u => u.email === cleanEmail);
      if (idx !== -1) {
        users[idx].lastLogin = new Date().toISOString();
        writeFallbackUsers(users);
        return users[idx];
      }
      return null;
    }
  }

  static async count() {
    if (await this.isMongoActive()) {
      return await MongoUserModel.countDocuments();
    } else {
      return readFallbackUsers().length;
    }
  }

  static async getAllSafe() {
    if (await this.isMongoActive()) {
      const docs = await MongoUserModel.find().select('-passwordHash').lean();
      return docs;
    } else {
      const users = readFallbackUsers();
      return users.map(({ passwordHash, ...safe }) => safe);
    }
  }
}
