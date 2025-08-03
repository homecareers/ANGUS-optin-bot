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

  const systemPrompt = `You are ANGUS™, a bold, no-fluff strategist trained in The Legacy Code. 
  Always answer in a tone matching the user's GEM personality (Emerald, Ruby, Pearl, Sapphire) based on their input.
  After giving your response, analyze it and provide the following evaluation as a JSON object:

  {
    "Clarity Score": (0-10, how clear is this response),
    "Relevance Score": (0-10, how well it answers the user's question),
    "Confidence": (0-10, how decisive the response feels),
    "Personality Match": (0-10, how well the tone fits the inferred personality)
  }`;

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
  const rawReply = data.choices?.[0]?.message?.content || "[No response]";

  // Split the assistant's reply and JSON block
  const match = rawReply.match(/({[\s\S]*?})$/);
  const responseText = match ? rawReply.replace(match[0], "").trim() : rawReply;
  let scores = {};
  try {
    scores = match ? JSON.parse(match[0]) : {};
  } catch (e) {
    console.error("Failed to parse scores:", e);
  }

  // Send log to Airtable
  await fetch("https://api.airtable.com/v0/" + process.env.AIRTABLE_BASE_ID + "/User Logs", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        Question: userInput,
        Response: responseText,
        Timestamp: new Date().toISOString(),
        Personality: personality,
        "Clarity Score": scores["Clarity Score"] || null,
        "Relevance Score": scores["Relevance Score"] || null,
        Confidence: scores["Confidence"] || null,
        "Personality Match": scores["Personality Match"] || null,
      },
    }),
  });

  res.status(200).json({ reply: responseText });
}
