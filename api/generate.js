import { createClient } from '@supabase/supabase-client';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method not allowed');

    const { prompt } = req.body;
    const connectCode = Math.floor(1000 + Math.random() * 9000).toString();

    try {
        // 1. Qwen AI via Groq API aufrufen
        const aiResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "qwen-2.5-coder-32b", 
                messages: [
                    { role: "system", content: "You are a Roblox Luau Expert. Output ONLY the code. Start with -- Type: Script or -- Type: LocalScript." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.2
            })
        });

        const aiData = await aiResponse.json();
        const generatedCode = aiData.choices[0].message.content;

        // 2. In Supabase speichern
        const { error } = await supabase
            .from('roblox_scripts')
            .insert([{ 
                connection_code: connectCode, 
                script_content: generatedCode 
            }]);

        if (error) throw error;

        // 3. Erfolg an Website zurückgeben
        res.status(200).json({ 
            success: true, 
            aiText: "Script wurde generiert!", 
            connectCode: connectCode 
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}
