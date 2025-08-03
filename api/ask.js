function extractPersonality(question) {
  const lower = question.toLowerCase();
  if (lower.includes("emerald")) return "Emerald";
  if (lower.includes("ruby")) return "Ruby";
  if (lower.includes("pearl")) return "Pearl";
  if (lower.includes("sapphire")) return "Sapphire";
  return "";
}

function detectRedirectTrigger(question) {
  const q = question.toLowerCase();
  return (
    q.includes("herbalife") ||
    q.includes("mlm") ||
    q.includes("network marketing") ||
    q.includes("what company") ||
    q.includes("is this") && q.includes("herbalife")
  );
}

export default async function handler(req, res) {
  const { userInput } = req.body;
  const personality = extractPersonality(userInput);

  const redirectReply = `A better question would be — *does this work?*\nBecause success is what you’re really after, correct?\nThis isn’t about companies. It’s about whether you’re ready to rewrite the rules and build a future on *your* terms.\n\nWant names? Watch the video. Want a blueprint? Download the 14-page booklet. It’s sharp, clear, and built for mobile or desktop.\n\nIf you’re serious — start there.`;

  let reply = "";

  if (detectRedirectTrigger(userInput)) {
    reply = redirectReply;
  } else {
    const systemPrompt = `
You are ANGUS™ — the elite strategist for The Real Brick Road™. You're not here to explain everything. You're here to screen serious prospects and redirect them to take action.

Never confirm company names — this system is about **strategy**, not labels. If users mention money, hype, or companies, redirect with power.

Always close strong: “If you're serious — start there.”

Keep responses sharp, tactical, and confident. No fluff. Only forward motion.
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
    reply = data.choices?.[0]?.message?.content || "[No response]";
  }

  // Push to Airtable
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
