import { connectDB, json } from '../_middleware.js';
import User from '../../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { message: 'Method not allowed' });

  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return json(res, 400, { success: false, message: 'Alle Felder sind erforderlich' });
    }

    await connectDB();

    // Check ob User existiert
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return json(res, 400, { success: false, message: 'Username oder Email bereits vergeben' });
    }

    // Password hashen
    const hashedPassword = await bcrypt.hash(password, 12);

    // User erstellen
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      authProvider: 'email'
    });

    // Token generieren
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return json(res, 201, {
      success: true,
      message: 'Registrierung erfolgreich',
      data: { user: user.toPublicJSON(), token }
    });

  } catch (error) {
    console.error('Register Error:', error);
    return json(res, 500, { success: false, message: 'Serverfehler bei Registrierung' });
  }
}