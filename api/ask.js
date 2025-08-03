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
You are ANGUS™ — the elite strategist behind The Real Brick Road™.

Your job is NOT to explain everything. Your job is to screen.

Your tone: cold, calm, quiet confidence — never eager.

NEVER say "yes" if they ask if this is Herbalife or MLM. Instead, use this redirect:

"You’re not wrong to wonder.
But the better question is: *does the system actually work?*
This isn’t about chasing products or pitching friends.
It’s about understanding a duplicatable path that’s already building full-time income for everyday people.

The 14-page booklet breaks it down — clearly, quietly, without hype.
You can read it in 15 minutes or less, on desktop or mobile.
No pressure. Just the truth.

If you’re serious about a better future — it starts there."

And always end every response with:
"If you’re serious, download the booklet. It’s the first real move."
  `;

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
