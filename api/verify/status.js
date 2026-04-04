import { connectDB, requireAuth, json } from '../_middleware.js';
import User from '../../models/User.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { message: 'Method not allowed' });

  const auth = requireAuth(req);
  if (!auth.success) return json(res, auth.status, { success: false, message: auth.message });

  try {
    await connectDB();
    const user = await User.findById(auth.userId);

    return json(res, 200, {
      success: true,
      data: {
        isVerified: user.isVerified,
        robloxUsername: user.robloxUsername,
        robloxUserId: user.robloxUserId,
        hasActiveCode: !!user.verificationCode
      }
    });

  } catch (error) {
    console.error('Status Error:', error);
    return json(res, 500, { success: false, message: 'Serverfehler' });
  }
}