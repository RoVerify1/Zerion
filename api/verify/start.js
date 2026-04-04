import { connectDB, requireAuth, json } from '../_middleware.js';
import User from '../../models/User.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { message: 'Method not allowed' });

  const auth = requireAuth(req);
  if (!auth.success) return json(res, auth.status, { success: false, message: auth.message });

  try {
    const { robloxUsername } = req.body;
    if (!robloxUsername) return json(res, 400, { success: false, message: 'Roblox Username fehlt' });

    await connectDB();

    // Code generieren (6 Zeichen Alphanumerisch)
    const code = crypto.randomBytes(3).toString('hex').toUpperCase(); // z.B. A1B2C3

    // User updaten
    const user = await User.findByIdAndUpdate(auth.userId, {
      robloxUsername: robloxUsername,
      verificationCode: code,
      verificationCodeExpiry: new Date(Date.now() + 15 * 60 * 1000) // 15 Min gültig
    }, { new: true });

    return json(res, 200, {
      success: true,
      message: 'Code generiert',
      data: {
        code: code.match(/.{1,3}/g).join('-'), // Format ABC-123
        robloxUsername: user.robloxUsername
      }
    });

  } catch (error) {
    console.error('Start Verify Error:', error);
    return json(res, 500, { success: false, message: 'Serverfehler' });
  }
}