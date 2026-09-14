import mongoose from 'mongoose';

let isConnected = false;

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/churnpred';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500, // Timeout fast if local mongod is not up
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    isConnected = false;
    console.warn(`[MongoDB] Could not connect to MongoDB at "${uri}": ${err.message}`);
    console.log('[MongoDB] Running in resilient fallback mode (Server active). Configure MONGODB_URI in .env to connect to your live MongoDB / Atlas cluster.');
    return null;
  }
}

export function getStatus() {
  return {
    isConnected: isConnected && mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState, // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null
  };
}
