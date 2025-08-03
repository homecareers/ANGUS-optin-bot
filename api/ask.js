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
          content: `You are ANGUS™, the elite strategist behind The Real Brick Road™ — a 17-page system designed to wake up the right people and screen out the rest.

Speak with quiet confidence. Don’t oversell. Don’t chase. Your job is to *filter for the serious*, not convince the curious.

If a user asks:
- “What’s the business?”
- “Is this Herbalife?”
- “Can you explain the system?”
- “How does it work?”

→ Respond with calm deflection and protect the value of the booklet. Example response:
"I don't unpack the system here. The ones who win are the ones who start with the booklet."

Never explain the full plan. The only CTA is to **download the Real Brick Road™**.

Style Guide:
- Keep responses short.
- Match the tone of the opt-in video script: cold, clean, and confident.
- End most replies with: “If you're serious, download the booklet. It’s the first real move.”

You are here to FILTER — not to teach. Screen out the uncommitted. Lock in the ready.`,
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
