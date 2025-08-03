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

  // Generate ANGUS response
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
          content: "You are ANGUS™, a bold, no-fluff strategist trained in The Legacy Code. Always answer in a tone matching the user's GEM personality (pearl, ruby, emerald, sapphire) based on input.",
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

  // Grade the response
  const scoreRes = await fetch("https://api.openai.com/v1/chat/completions", {
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
          content: `Grade the following AI response from 0–10 for:
1) Clarity
2) Relevance to the user's question
3) Confidence of delivery

Then also identify up to 3 tags that apply (e.g. Empathy, Urgency, Authority, Transparency, Reframe).

Also indicate how well the tone matches the user's GEM personality: Strong Match, Weak Match, or No Match.`,
        },
        {
          role: "user",
          content: `User Input: ${userInput}\n\nResponse: ${reply}\n\nPersonality: ${personality}`,
        },
      ],
    }),
  });

  const scoreData = await scoreRes.json();
  const scoreText = scoreData.choices?.[0]?.message?.content || "";

  // Extract scores and tags using regex
  const clarityMatch = scoreText.match(/Clarity:\s*(\d+)/i);
  const relevanceMatch = scoreText.match(/Relevance:\s*(\d+)/i);
  const confidenceMatch = scoreText.match(/Confidence:\s*(\d+)/i);
  const tagsMatch = scoreText.match(/Tags?:\s*(.*)/i);
  const matchMatch = scoreText.match(/(Strong Match|Weak Match|No Match)/i);

  const clarity = clarityMatch ? parseInt(clarityMatch[1]) : null;
  const relevance = relevanceMatch ? parseInt(relevanceMatch[1]) : null;
  const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : null;
  const tags = tagsMatch ? tagsMatch[1].split(",").map(tag => tag.trim()) : [];
  const toneMatch = matchMatch ? matchMatch[1] : "";

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
        Response: reply,
        Timestamp: new Date().toISOString(),
        Personality: personality,
        Tags: tags,
        "Clarity Score": clarity,
        "Relevance Score": relevance,
        "Confidence Score": confidence,
        "Personality Match": toneMatch,
      },
    }),
  });

  res.status(200).json({ reply });
}
