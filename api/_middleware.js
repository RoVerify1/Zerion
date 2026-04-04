import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../../models/User.js'; // Pfad zum Model anpassen falls nötig

// --- DATABASE CONNECTION (Cached for Serverless) ---
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error('MONGODB_URI fehlt in .env');

let cached = global.mongoose || { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    }).then((mongoose) => mongoose);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// --- AUTH MIDDLEWARE ---
export function requireAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return { success: false, status: 401, message: 'Nicht autorisiert' };
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { success: true, userId: decoded.userId };
  } catch (err) {
    return { success: false, status: 401, message: 'Token ungültig' };
  }
}

// --- ADMIN CHECK ---
export async function requireAdmin(req) {
  const auth = requireAuth(req);
  if (!auth.success) return auth;

  await connectDB();
  const user = await User.findById(auth.userId);
  
  if (!user || user.role !== 'admin') {
    return { success: false, status: 403, message: 'Kein Admin-Zugriff' };
  }
  
  return { success: true, user };
}

// --- RESPONSE HELPER ---
export function json(res, statusCode, data) {
  return res.status(statusCode).json(data);
}