import { connectDB, json } from '../_middleware.js';
import User from '../../models/User.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { message: 'Method not allowed' });

  try {
    const { robloxUserId, verificationCode, signature } = req.body;

    // 1. Security Check (Signatur vom Roblox Script)
    // Einfacher Check: Ist die Signatur korrekt? (Siehe Middleware/Lib für HMAC)
    // Für den Anfang: Nur prüfen ob Code da ist. In Prod: Signatur validieren!
    
    if (!robloxUserId || !verificationCode) {
      return json(res, 400, { success: false, message: 'Daten unvollständig' });
    }

    await connectDB();

    // 2. User finden mit diesem Code UND dieser Roblox ID
    // Wir suchen nach einem User, dessen robloxUserId (falls schon gesetzt) ODER robloxUsername passt
    // Da wir im Start-Schritt nur den Username hatten, müssen wir hier clever sein.
    // Besser: Im Start-Schritt haben wir den Code im User gespeichert.
    
    // Suche User mit dem Code
    const user = await User.findOne({
      verificationCode: verificationCode.replace('-', '').toUpperCase(),
      verificationCodeExpiry: { $gt: new Date() } // Nicht abgelaufen
    });

    if (!user) {
      return json(res, 400, { success: false, message: 'Ungültiger oder abgelaufener Code' });
    }

    // 3. Optional: Prüfen ob die Roblox UserID vom Script mit der im User gespeicherten übereinstimmt
    // (Wenn wir die UserID im Start-Schritt schon via API geholt haben)
    // Hier nehmen wir an, der Code reicht als Beweis, dass der Spieler Zugriff auf den Account hat.

    // 4. Verifizieren
    user.isVerified = true;
    user.robloxUserId = robloxUserId; // UserID vom Script speichern
    user.verificationCode = null; // Code löschen (Einmalnutzung)
    user.verificationCodeExpiry = null;
    await user.save();

    // 5. Discord Webhook Trigger (Optional hier einbauen)

    return json(res, 200, {
      success: true,
      message: 'Verifizierung erfolgreich!'
    });

  } catch (error) {
    console.error('Game Verify Error:', error);
    return json(res, 500, { success: false, message: 'Serverfehler' });
  }
}