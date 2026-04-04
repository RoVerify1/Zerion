import { connectDB, requireAdmin, json } from '../_middleware.js';
import User from '../../models/User.js';

export default async function handler(req, res) {
  // GET: Liste aller User
  if (req.method === 'GET') {
    const adminCheck = await requireAdmin(req);
    if (!adminCheck.success) return json(res, adminCheck.status, { success: false, message: adminCheck.message });

    try {
      await connectDB();
      // Hole User ohne sensible Daten (Password etc.)
      const users = await User.find({}).select('-password -__v').sort({ createdAt: -1 });
      
      return json(res, 200, { success: true, data: users });

    } catch (error) {
      console.error('Admin Get Users Error:', error);
      return json(res, 500, { success: false, message: 'Serverfehler' });
    }
  }

  // PATCH: User updaten (z.B. Role ändern, Ban)
  if (req.method === 'PATCH') {
    const adminCheck = await requireAdmin(req);
    if (!adminCheck.success) return json(res, adminCheck.status, { success: false, message: adminCheck.message });

    try {
      const { userId, updates } = req.body; // updates z.B. { role: 'admin' } oder { isBanned: true }
      
      await connectDB();
      const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');

      return json(res, 200, { success: true, data: user });

    } catch (error) {
      console.error('Admin Update User Error:', error);
      return json(res, 500, { success: false, message: 'Serverfehler' });
    }
  }

  // DELETE: User löschen
  if (req.method === 'DELETE') {
     const adminCheck = await requireAdmin(req);
    if (!adminCheck.success) return json(res, adminCheck.status, { success: false, message: adminCheck.message });

    try {
      const { userId } = req.body;
      await connectDB();
      await User.findByIdAndDelete(userId);

      return json(res, 200, { success: true, message: 'User gelöscht' });

    } catch (error) {
      console.error('Admin Delete User Error:', error);
      return json(res, 500, { success: false, message: 'Serverfehler' });
    }
  }

  return json(res, 405, { message: 'Method not allowed' });
}