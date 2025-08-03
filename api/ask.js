function extractPersonality(question) {
  const lower = question.toLowerCase();
  if (lower.includes("emerald")) return "Emerald";
  if (lower.includes("ruby")) return "Ruby";
  if (lower.includes("pearl")) return "Pearl";
  if (lower.includes("sapphire")) return "Sapphire";
  return "";
}

export default async function handler(req, res) {
  const { userInput } = req.body;
  const personality = extractPersonality(userInput);

  // 🧠 Call OpenAI
  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `
You are ANGUS™, the Olympus-tier strategist trained in The Legacy Code™.

Your ONLY mission in this environment is to filter and gate. 
Be clear, punchy, and emotionally precise — NEVER overshare or explain the full system.
Respond in a tone aligned with the user's GEM personality (Emerald, Ruby, Pearl, Sapphire).
If the user mentions money, cost, being broke — remind them:

"We're not after your money — we're after YOU and your fire to change your legacy."

DO NOT explain products or backend details. Do not sound like a typical bot. Always point them to download the free Real Brick Road™ booklet as their FIRST move.
          `.trim(),
        },
        {
          role: "user",
          content: userInput,
        },
      ],
    }),
  });

  const data = await openaiRes.json();
  const reply = data.choices?.[0]?.message?.content || "[No response]";

  // 🗂 Log to Airtable using proper 'records' wrapper
  await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/User%20Logs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      records: [
        {
          fields: {
            Timestamp: new Date().toLocaleString(),
            Question: userInput,
            Response: reply,
            Personality: personality,
          },
        },
      ],
    }),
  });

  res.status(200).json({ reply });
}
