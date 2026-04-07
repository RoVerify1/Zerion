// Dies ist eine Vercel Serverless Function. Sie läuft auf dem Server, nicht im Browser.
// Hier verstecken wir deinen API Key.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;

  // Wir nutzen das Modell "Salesforce/codegen-350M-mono" oder ähnliches für Code
  // Es ist kostenlos und schnell über Hugging Face.
  const response = await fetch(
    "https://api-inference.huggingface.co/models/Salesforce/codegen-350M-mono",
    {
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`, // Dein Key kommt aus Vercel Settings
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        inputs: `Write a Roblox Lua script that: ${prompt}. \n-- Lua Code:`,
        parameters: {
          max_new_tokens: 200, // Länge des Codes
          temperature: 0.7,    // Kreativität
          return_full_text: false
        }
      }),
    }
  );

  const result = await response.json();
  
  // Die API gibt manchmal Fehler zurück, wenn das Modell lädt
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  // Extrahiere den generierten Text
  const generatedCode = result[0]?.generated_text || "-- Kein Code generiert";
  
  res.status(200).json({ code: generatedCode });
}