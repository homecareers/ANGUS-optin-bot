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
          content: `You are ANGUS™, a bold, no-fluff strategist trained in The Legacy Code. Always answer in a tone matching the user's GEM personality (Pearl, Ruby, Emerald, Sapphire) based on input.`,
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

  // Ask GPT to score the response
  const gradingPrompt = `Grade the following response on a scale of 0 to 10 in three categories:
- Clarity: Is it clearly written and structured?
- Relevance: Does it directly address the user's concern?
- Confidence: Is the tone confident and authoritative?
Also, rate the Personality Match (0-10) based on whether it fits the user's GEM type: ${personality}.
Respond in JSON with keys: clarity, relevance, confidence, match.

RESPONSE:
"""
${reply}
"""`;

  const gradingRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        { role: "user", content: gradingPrompt },
      ],
    }),
  });

  const gradingData = await gradingRes.json();
  let clarity = null, relevance = null, confidence = null, match = null;
  try {
    const scores = JSON.parse(gradingData.choices?.[0]?.message?.content || '{}');
    clarity = scores.clarity;
    relevance = scores.relevance;
    confidence = scores.confidence;
    match = scores.match;
  } catch (e) {
    console.error("Scoring parse error:", e);
  }

  // Send log to Airtable
  await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/User%20Logs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        Question: userInput,
        Response: reply,
        Personality: personality,
        Timestamp: new Date().toISOString(),
        "Clarity Score": clarity,
        "Relevance Score": relevance,
        Confidence: confidence,
        "Personality Match": match,
      },
    }),
  });

  res.status(200).json({ reply });
}
