import { createClient } from '@supabase/supabase-client';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Nur POST erlaubt');
    const { prompt } = req.body;
    const connectCode = Math.floor(1000 + Math.random() * 9000).toString();

    try {
        const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "qwen-2.5-coder-32b",
                messages: [
                    { role: "system", content: "You are a Roblox Expert. Output ONLY Luau code. No talk." },
                    { role: "user", content: prompt }
                ]
            })
        });
        const data = await aiRes.json();
        const code = data.choices[0].message.content;

        await supabase.from('roblox_scripts').insert([{ connection_code: connectCode, script_content: code }]);
        res.status(200).json({ success: true, connectCode });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
