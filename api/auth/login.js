import { connectDB, json } from '../_middleware.js';
import User from '../../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { message: 'Method not allowed' });

  try {
    const { email, password } = req.body; // Login meist über Email

    if (!email || !password) {
      return json(res, 400, { success: false, message: 'Email und Passwort erforderlich' });
    }

    await connectDB();

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return json(res, 401, { success: false, message: 'Ungültige Anmeldedaten' });
    }

    // Passwort prüfen
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return json(res, 401, { success: false, message: 'Ungültige Anmeldedaten' });
    }

    // Token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Update Last Login
    user.lastLogin = new Date();
    await user.save();

    return json(res, 200, {
      success: true,
      message: 'Login erfolgreich',
      data: { user: user.toPublicJSON(), token }
    });

  } catch (error) {
    console.error('Login Error:', error);
    return json(res, 500, { success: false, message: 'Serverfehler beim Login' });
  }
}