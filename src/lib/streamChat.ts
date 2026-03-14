// ===============================
// STREAM CHAT (CHATGPT STYLE - CLEAN)
// ===============================

export type Msg = {
  role: "user" | "assistant";
  content: string;
};

const CHAT_URL = "http://localhost:5000/chat";

// Clean unwanted spaces
function cleanText(text: string) {
  return text
    .replace(/\s{2,}/g, " ") // keep normal spacing
    .trim();
}

export async function streamChat({
  messages,
  onDelta,
  onDone,
  signal,
}: {
  messages: Msg[];
  onDelta: (text: string) => void;
  onDone: () => void;
  signal?: AbortSignal;
}) {
  try {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) {
      onDone();
      return;
    }

    const response = await fetch(CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: lastMessage.content,
      }),
      signal,
    });

    if (!response.body) throw new Error("No response");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = cleanText(decoder.decode(value));
      onDelta(chunk);
    }

    onDone();
  } catch (err: any) {
    if (err.name !== "AbortError")
      console.error("StreamChat Error:", err);
    onDone();
  }
}

// ===============================
export function generateTitle(text: string) {
  return text
    .replace(/\n/g, " ")
    .split(" ")
    .slice(0, 6)
    .join(" ");
}

