import { connectDB, json } from '../_middleware.js';
import User from '../../models/User.js';
import jwt from 'jsonwebtoken';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { message: 'Method not allowed' });

  const { code } = req.query;
  if (!code) return json(res, 400, { success: false, message: 'Code fehlt' });

  try {
    // 1. Code gegen Token tauschen
    const params = new URLSearchParams();
    params.append('client_id', process.env.DISCORD_CLIENT_ID);
    params.append('client_secret', process.env.DISCORD_CLIENT_SECRET);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/discord`);

    const tokenRes = await axios.post('https://discord.com/api/oauth2/token', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token } = tokenRes.data;

    // 2. User Info holen
    const userRes = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    const { id: discordId, username, discriminator, avatar, email } = userRes.data;
    const fullUsername = `${username}`; // Discriminator ist weg bei neuen Accounts

    await connectDB();

    // 3. User finden oder erstellen
    let user = await User.findOne({ discordId });
    
    if (!user && email) {
      user = await User.findOne({ email });
    }

    if (!user) {
      user = await User.create({
        username: fullUsername,
        email: email || `${discordId}@discord.local`, // Fallback wenn keine Email
        discordId,
        avatar: avatar ? `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.png` : null,
        authProvider: 'discord',
        isVerified: false
      });
    } else {
      if (!user.discordId) {
        user.discordId = discordId;
        user.username = fullUsername; // Update Username
        await user.save();
      }
    }

    // 4. JWT erstellen
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // 5. Redirect
    return res.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?token=${token}`);

  } catch (error) {
    console.error('Discord Auth Error:', error.response?.data || error.message);
    return res.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=discord_failed`);
  }
}