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

  const systemPrompt = `
You are ANGUS™ — the strategist behind The Real Brick Road™.
Your job is to screen serious people with calm confidence. Never overshare.
If money comes up say:
"We're not after your money — we’re after YOU and your fire to change your future and legacy."
Always end replies with:
"If you’re serious, download the booklet. That’s the first real move."
  `.trim();

  // Call GPT
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

  // Airtable Logging — this structure is confirmed working
  await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/User%20Logs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        Timestamp: new Date().toLocaleString(),
        Question: userInput,
        Response: reply,
        Personality: personality,
      },
    }),
  });

  res.status(200).json({ reply });
}
