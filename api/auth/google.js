import { connectDB, json } from '../_middleware.js';
import User from '../../models/User.js';
import jwt from 'jsonwebtoken';
import axios from 'axios';

export default async function handler(req, res) {
  // Hinweis: In Vercel wird OAuth oft über einen Proxy oder Client-Side Flow gehandhabt.
  // Dies ist ein vereinfachter Server-Side Exchange Flow.
  
  if (req.method !== 'GET') return json(res, 405, { message: 'Method not allowed' });

  const { code } = req.query;
  if (!code) return json(res, 400, { success: false, message: 'Code fehlt' });

  try {
    // 1. Code gegen Token tauschen
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google`,
      grant_type: 'authorization_code'
    });

    const { id_token } = tokenRes.data;

    // 2. User Info holen
    const userInfoRes = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${tokenRes.data.access_token}`);
    const { sub: googleId, email, name, picture } = userInfoRes.data;

    await connectDB();

    // 3. User finden oder erstellen
    let user = await User.findOne({ email });
    
    if (!user) {
      user = await User.create({
        username: name.replace(/\s/g, '') + Math.floor(Math.random() * 1000), // Einfacher Username
        email,
        googleId,
        avatar: picture,
        authProvider: 'google',
        isVerified: false
      });
    } else {
      // Falls User existiert aber keine Google ID hat (z.B. vorher Email Reg), verknüpfen
      if (!user.googleId) {
        user.googleId = googleId;
        user.avatar = picture;
        await user.save();
      }
    }

    // 4. JWT erstellen
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // 5. Redirect zur Frontend App mit Token
    return res.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?token=${token}`);

  } catch (error) {
    console.error('Google Auth Error:', error.response?.data || error.message);
    return res.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=google_failed`);
  }
}