import { connectDB, json } from '../_middleware.js';
import User from '../../models/User.js';
import jwt from 'jsonwebtoken';

// Gleicher Store wie in send-otp (In Prod: DB nutzen!)
const otpStore = new Map(); 

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { message: 'Method not allowed' });

  const { email, code } = req.body;
  if (!email || !code) return json(res, 400, { success: false, message: 'Email und Code erforderlich' });

  try {
    await connectDB();

    // Code prüfen
    const storedOtp = otpStore.get(email);
    
    if (!storedOtp || storedOtp.code !== code) {
      return json(res, 400, { success: false, message: 'Ungültiger Code' });
    }

    if (Date.now() > storedOtp.expires) {
      otpStore.delete(email);
      return json(res, 400, { success: false, message: 'Code abgelaufen' });
    }

    // Code war gültig -> Löschen
    otpStore.delete(email);

    // User suchen oder erstellen
    let user = await User.findOne({ email });
    
    if (!user) {
      // Neue Registrierung via OTP
      user = await User.create({
        email,
        username: `User_${email.split('@')[0]}`, // Platzhalter Username
        authProvider: 'email-otp',
        isEmailVerified: true
      });
    } else {
      // Existing User -> Email als verifiziert markieren
      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
        await user.save();
      }
    }

    // Token generieren
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return json(res, 200, {
      success: true,
      message: 'Erfolgreich eingeloggt',
      data: { user: user.toPublicJSON(), token }
    });

  } catch (error) {
    console.error('OTP Verify Error:', error);
    return json(res, 500, { success: false, message: 'Serverfehler' });
  }
}