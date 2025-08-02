export default async function handler(req, res) {
  const { userInput } = req.body;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are ANGUS™, a bold, no-fluff strategist trained in The Legacy Code. Always answer in a tone matching the user's GEM personality (pearl, ruby, emerald, sapphire) based on input.",
        },
        {
          role: "user",
          content: userInput,
        },
      ],
    }),
  });

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content || "[No response]";
  res.status(200).json({ reply });
}
