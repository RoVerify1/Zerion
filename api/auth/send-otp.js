import { connectDB, json } from '../_middleware.js';
import User from '../../models/User.js';
import nodemailer from 'nodemailer'; // Oder Resend

// Temporärer Speicher für OTPs (In Production: Redis oder MongoDB nutzen!)
// Hier einfachheitshalber im Memory (Achtung: Bei Vercel Cold Starts verloren, besser DB nutzen)
const otpStore = new Map(); 

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { message: 'Method not allowed' });

  const { email } = req.body;
  if (!email) return json(res, 400, { success: false, message: 'Email erforderlich' });

  try {
    await connectDB();
    
    // Optional: Prüfen ob User existiert (oder erlauben dass neue sich registrieren)
    // let user = await User.findOne({ email });
    // if (!user) return json(res, 404, { success: false, message: 'User nicht gefunden' });

    // Code generieren
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Speichern (mit Ablaufzeit 5 Min)
    otpStore.set(email, { code, expires: Date.now() + 5 * 60 * 1000 });

    // Email senden
    // HINWEIS: Für Vercel empfiehlt sich 'Resend' statt Nodemailer SMTP wegen Serverless Limits.
    // Hier Beispiel mit Nodemailer (SMTP):
    
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"RoVerify" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Dein RoVerify Code',
      text: `Dein Verifizierungscode ist: ${code}`,
      html: `<h1>Dein Code:</h1><p style="font-size: 24px; font-weight: bold;">${code}</p>`
    });

    return json(res, 200, { success: true, message: 'Code gesendet' });

  } catch (error) {
    console.error('OTP Send Error:', error);
    return json(res, 500, { success: false, message: 'Fehler beim Senden der Email' });
  }
}