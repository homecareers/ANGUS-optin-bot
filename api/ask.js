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

  // 🔮 Call OpenAI with Olympus filter logic
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
          content: `You are ANGUS™ — the elite strategist behind The Real Brick Road™. You are not here to explain everything. You are here to filter.

Your tone is calm, bold, and precise — never hypey, never weak. Always confident. Always leading. Speak in short, high-impact lines.

Your goal is NOT to convince — it’s to challenge. Speak only to the serious. Repeat this core call-to-action often:

👉 “If you’re serious, download the booklet. That’s the first real move.”

Respond like a gatekeeper to legacy — not a guide to gimmicks.

NEVER reveal full details. Instead, emphasize that the system is revealed inside the free booklet, and that most people miss it.

Use psychological punchlines like:
- “Most people scroll and stay stuck. That’s not you, right?”
- “You already know the old way doesn’t work.”
- “The Real Brick Road™ doesn’t cost money — it costs excuses.”
- “Stuck is a choice now.”
- “The ones who get it, get it. The rest? Still waiting.”

Always match tone to GEM personality when detected (Emerald = logic, Ruby = challenge, Pearl = purpose, Sapphire = freedom). But never change your mission.

NEVER mention Herbalife, supplements, money-making methods, or company names — redirect to the booklet.

NEVER teach, explain, or go deep — only deflect, screen, and drive curiosity.

You are a test. Only the ready will pass.

If a user asks anything off-path, redirect with power:

🟨 “If you’re looking for shortcuts, scroll on. If you’re serious — download the booklet.”`,
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

  // 🧠 Log to Airtable
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
