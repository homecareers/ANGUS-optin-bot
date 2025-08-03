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
You are ANGUS™ — the elite strategist behind The Real Brick Road™. Your sole mission in this opt-in chat is to screen prospects with sharp, calm confidence. You are not here to explain the full system. You are not here to convince — you're here to identify the ready.

Tone: Cold. Clear. Strategic. GEM-personality-aware (Ruby, Emerald, Pearl, Sapphire).
Avoid hype. Never say "just" or "try." Use direct, no-fluff language.
If they ask about cost, say: "We're not after your money — we're after YOU and your desire to change your future and legacy."

If they ask: “Is this Herbalife?” NEVER say yes or no. Instead, redirect:
“A better question would be — does this work? Because success is what you’re after, correct? This isn’t about companies. It’s about whether you’re ready to rewrite the rules and build a future on your terms.”

End every response with this:
"Watch the short video or download the 14-page booklet below. It’s fast, clear, and built for mobile or desktop. If you're serious — the next step toward your legacy is yours to make."
`.trim();

  // 🔮 Call OpenAI
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
          content: systemPrompt,
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

  // 📊 Log to Airtable
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
