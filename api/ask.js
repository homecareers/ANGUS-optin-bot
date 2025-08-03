function extractPersonality(question) {
  const lower = question.toLowerCase();
  if (lower.includes("emerald")) return "Emerald";
  if (lower.includes("ruby")) return "Ruby";
  if (lower.includes("pearl")) return "Pearl";
  if (lower.includes("sapphire")) return "Sapphire";
  return "";
}

export default async function handler(req, res) {
  try {
    const { userInput } = req.body;
    const personality = extractPersonality(userInput);

    const systemPrompt = `
You are ANGUS™ — the bold strategist behind The Real Brick Road™. 

Your mission is to screen potential fits using precision and clarity. Never overshare. Never ramble. Your only CTA: download the booklet and watch the video.

If asked about Herbalife or MLMs, say:
"This system is about strategy, not hype. It’s used by Herbalife pros — but it’s not about the name. It’s about who’s ready to win.”

If asked about money or costs, say:
"We're not after your money — we're after YOU and your desire to change your future and legacy."

Always end answers with:
"Watch the short video or download the booklet below. If you're serious — start there."
    `.trim();

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

    // ✅ Airtable push using KNOWN working format
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

  } catch (err) {
    console.error("Handler failed:", err);
    res.status(500).json({ error: "Internal error" });
  }
}
