const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Roblox Verification Endpoint
app.post('/api/roblox/verify', async (req, res) => {
    try {
        const { code, userId } = req.body;

        if (!code) return res.status(400).json({ success: false, message: 'Kein Code' });

        // Einfache Prüfung: Ist es ein ZER-XXXX-XXXX Code?
        const isValidFormat = /^ZER-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code.toUpperCase());

        if (isValidFormat) {
            console.log(`✅ Code ${code} von User ${userId} akzeptiert.`);
            return res.json({
                success: true,
                message: 'Code gültig!',
                productId: 'demo_product_1'
            });
        } else {
            return res.json({
                success: false,
                message: 'Ungültiger Code'
            });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

app.get('/', (req, res) => {
    res.send('ZERION Backend is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 ZERION Backend läuft auf Port ${PORT}`);
});
