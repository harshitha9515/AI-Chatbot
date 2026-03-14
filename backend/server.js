import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

function cleanText(text) {
  return text.replace(/\s+/g, " ").trim();
}

app.post("/chat", async (req, res) => {
  const { message } = req.body;

  try {
    const ollamaRes = await fetch(
      "http://localhost:11434/api/generate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "phi3:mini",
          prompt: message,
          stream: true,
        }),
      }
    );

    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Transfer-Encoding", "chunked");

    const reader = ollamaRes.body.getReader();
    const decoder = new TextDecoder();

    let fullResponse = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (!line.trim()) continue;

        const json = JSON.parse(line);

        if (json.response) {

          // ✅ AUTO SPACE FIX ADDED
          if (
            fullResponse &&
            !fullResponse.endsWith(" ") &&
            !json.response.startsWith(" ")
          ) {
            fullResponse += " ";
          }

          fullResponse += json.response;
        }
      }
    }

    const finalText = cleanText(fullResponse) + " 🙂";

    res.write(finalText);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
});

app.listen(5000, () =>
  console.log("🚀 Server running http://localhost:5000")
);