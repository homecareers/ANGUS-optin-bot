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

  try {
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
            content:
              "You are ANGUS™, a bold, no-fluff strategist trained in The Legacy Code. Always answer in a tone matching the user's GEM personality (pearl, ruby, emerald, sapphire) based on input.",
          },
          { role: "user", content: userInput },
        ],
      }),
    });

    const data = await openaiRes.json();
    const reply = data.choices?.[0]?.message?.content || "[No response]";

    // --- Ask GPT to self-grade the response ---
    const gradingRes = await fetch("https://api.openai.com/v1/chat/completions", {
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
            content:
              "You are a scoring assistant. Score the following response on a scale of 0–10 in the following categories: Clarity, Relevance, Confidence, and Personality Match. Return only a compact JSON object like this: { \"Clarity\": 8, \"Relevance\": 9, \"Confidence\": 10, \"PersonalityMatch\": 9 }.",
          },
          {
            role: "user",
            content: `Question: ${userInput}\nResponse: ${reply}\nPersonality: ${personality}`,
          },
        ],
      }),
    });

    const gradingData = await gradingRes.json();
    let scores = {};

    try {
      const scoreText = gradingData.choices?.[0]?.message?.content || "{}";
      scores = JSON.parse(scoreText);
    } catch (e) {
      console.error("Failed to parse scores:", e);
    }

    // --- Log to Airtable ---
    const airtableRes = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/User Logs`, {
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
          "Clarity Score": scores.Clarity || 0,
          "Relevance Score": scores.Relevance || 0,
          Confidence: scores.Confidence || 0,
          "Personality Match": scores.PersonalityMatch || 0,
        },
      }),
    });

    console.log("Airtable status:", airtableRes.status);
    const airtableText = await airtableRes.text();
    console.log("Airtable response:", airtableText);

    res.status(200).json({ reply });
  } catch (error) {
    console.error("Fatal error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
