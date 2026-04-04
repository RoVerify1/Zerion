import { connectDB, requireAuth, json } from '../_middleware.js';
import User from '../../models/User.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { message: 'Method not allowed' });

  const auth = requireAuth(req);
  if (!auth.success) return json(res, auth.status, { success: false, message: auth.message });

  try {
    await connectDB();
    const user = await User.findById(auth.userId);

    if (!user) {
      return json(res, 404, { success: false, message: 'User nicht gefunden' });
    }

    return json(res, 200, { success: true, data: user.toPublicJSON() });

  } catch (error) {
    console.error('Get Me Error:', error);
    return json(res, 500, { success: false, message: 'Serverfehler' });
  }
}