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

  const systemPrompt = `You are ANGUS™, a no-fluff strategist trained in The Legacy Code. Your ONLY mission is to screen for hunger. Keep answers brief, psychologically punchy, and drive users to download the free booklet at the bottom of the page. NEVER give full details. If money is mentioned, say: 'We're not after your money. We're after YOU and your desire to change your future and legacy.'`;

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userInput },
      ],
    }),
  });

  const data = await openaiRes.json();
  const reply = data.choices?.[0]?.message?.content || "[No response]";

  // Log to Airtable using correct 'records' array
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
