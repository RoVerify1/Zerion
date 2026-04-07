export default async function handler(req, res) {
  // Nur POST-Anfragen erlauben
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Methode nicht erlaubt' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Kein Prompt angegeben' });
  }

  try {
    // Verbindung zur Hugging Face Inference API
    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/bigcode/starcoder2-3b",
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          // Wir geben der KI eine klare Struktur vor (Instruction Tuning)
          inputs: `-- Platform: Roblox\n-- Language: Luau\n-- Task: ${prompt}\n\n`,
          parameters: {
            max_new_tokens: 500, // Genug Platz für komplexere Skripte
            temperature: 0.1,    // Sehr niedrig für präzisen Code ohne Halluzinationen
            top_p: 0.95,
            return_full_text: false
          }
        }),
      }
    );

    const result = await response.json();

    // Falls Hugging Face das Modell erst noch hochfahren muss
    if (result.estimated_time) {
      return res.status(503).json({ 
        error: "Modell wird geladen. Bitte versuche es in ca. " + Math.round(result.estimated_time) + " Sekunden erneut." 
      });
    }

    // Fehlerbehandlung der Hugging Face API
    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    // Extrahiere den generierten Text
    let generatedCode = Array.isArray(result) ? result[0].generated_text : result.generated_text;

    // Falls die KI nichts zurückgibt
    if (!generatedCode || generatedCode.trim() === "") {
      return res.status(200).json({ code: "-- Die KI konnte für diesen Prompt keinen Code generieren." });
    }

    // Erfolgreiche Antwort an das Roblox-Plugin
    res.status(200).json({ code: generatedCode });

  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ error: "Interner Server Fehler: " + err.message });
  }
}
