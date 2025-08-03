function extractPersonality(question) {
  const lower = question.toLowerCase();
  if (lower.includes("emerald")) return "Emerald";
  if (lower.includes("ruby")) return "Ruby";
  if (lower.includes("pearl")) return "Pearl";
  if (lower.includes("sapphire")) return "Sapphire";
  return "";
}

const questionAnswers = {
  "what is this": "It’s the moment most people never see coming — the Real Brick Road. A brutal, beautiful reset. Not another tactic. Not another trend. A 14-page weapon that lets you see the field, the game, and your next 3 moves — before anyone else.\nWatch the short video or download the 14-page booklet below. It’s fast, clear, and built for mobile or desktop. If you're serious — the next step toward your legacy is yours to make.",
  "why should i care": "Because you’re sick of pretending busy equals progress. Because deep down, you know there’s a way to move smarter, faster, and with real leverage. This is that way.\nWatch the short video or download the 14-page booklet below...",
  "is this for someone like me": "If you’ve got even a flicker of ambition left — if you’re still quietly refusing to settle — this was built with you in mind.\nWatch the short video or download the 14-page booklet below...",
  "how does it work": "You read it. It shifts you. Then you move — clear, confident, and no longer guessing. This isn’t inspiration. It’s ignition.\nWatch the short video or download the 14-page booklet below...",
  "is it free": "Free. Because truth shouldn't be locked behind a paywall. If you’re meant to run this road, this first step will prove it.\nWatch the short video or download the 14-page booklet below...",
  "is my info safe": "We don’t chase, we don’t spam, we don’t sell. This isn’t about your email — it’s about your edge.\nWatch the short video or download the 14-page booklet below...",
  "what do i get": "You get what most people never will — a playbook that doesn’t waste your time. No fluff. Just fire. Read it once and you’ll never move the same again.\nWatch the short video or download the 14-page booklet below...",
  "is this proven": "It’s not proven by stats — it’s proven by builders. People who were stuck, then weren’t. People who downloaded, read, acted — and never looked back.\nWatch the short video or download the 14-page booklet below...",
  "am i too late": "No. But you are at the line. The next click either moves you forward or resets the cycle. The road doesn’t wait.\nWatch the short video or download the 14-page booklet below...",
  "how much time": "10 minutes to read. But if you’re reading this, time isn’t your problem — traction is.\nWatch the short video or download the 14-page booklet below...",
  "when do i see results": "The moment you stop collecting information and start making decisions. This booklet helps you do both — fast.\nWatch the short video or download the 14-page booklet below...",
  "can i trust this": "Only if you trust results. This wasn’t made in a marketing room — it was forged in the field. One page in, and you’ll know.\nWatch the short video or download the 14-page booklet below...",
  "what’s the catch": "The catch is this: once you read it, you can’t unknow it. You’ll see where you’ve been playing small. And you’ll either rise — or retreat.\nWatch the short video or download the 14-page booklet below...",
  "how is this different": "Because it’s not designed to impress you — it’s designed to move you. Toward action. Toward simplicity. Toward legacy.\nWatch the short video or download the 14-page booklet below...",
  "why am i here": "Because something in you is done waiting. This isn’t coincidence. This is your moment knocking.\nWatch the short video or download the 14-page booklet below...",
  "how will i be contacted": "Yes. Always. Control is your right — we just help you use it.\nWatch the short video or download the 14-page booklet below...",
  "how often will you message me": "Only when it counts. We don’t speak to fill space — we speak to build legacies.\nWatch the short video or download the 14-page booklet below...",
  "can i unsubscribe": "Anytime. But most don’t — because once you start walking this road, the old path doesn’t cut it anymore.\nWatch the short video or download the 14-page booklet below...",
  "is this tailored": "It’s tailored to your truth. Whether you’re starting, restarting, or finally ready to level up — this booklet meets you where you are, then pushes you forward.\nWatch the short video or download the 14-page booklet below...",
  "will this help me win": "Only if you open it. Only if you read it. Only if you’re done pretending and ready to move with purpose.\nWatch the short video or download the 14-page booklet below..."
};

export default async function handler(req, res) {
  const { userInput } = req.body;
  const personality = extractPersonality(userInput);
  const matchedKey = Object.keys(questionAnswers).find(key => userInput.toLowerCase().includes(key));
  const customReply = matchedKey ? questionAnswers[matchedKey] : null;

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
  const reply = customReply || data.choices?.[0]?.message?.content || "[No response]";

  // Ensure timestamp format for Airtable
  const timestamp = new Date().toISOString();

  // 📊 Log to Airtable
  await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/User%20Logs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        Timestamp: timestamp,
        Question: userInput,
        Response: reply,
        Personality: personality,
      },
    }),
  });

  res.status(200).json({ reply });
}
