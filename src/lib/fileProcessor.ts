// Process files for AI analysis
export async function processFilesForAI(files: File[]): Promise<string> {
  const results: string[] = [];

  for (const file of files) {
    if (file.type.startsWith("image/")) {
      const base64 = await fileToBase64(file);
      results.push(`[IMAGE: ${file.name}]\n${base64}`);
    } else if (file.type === "application/pdf") {
      const text = await extractPDFText(file);
      results.push(`[PDF: ${file.name}]\n${text}`);
    } else if (
      file.type.startsWith("text/") ||
      file.name.match(/\.(js|ts|tsx|jsx|py|java|cpp|c|html|css|json|xml|md|txt|csv|yaml|yml|sh|rb|go|rs|sql|php)$/i)
    ) {
      const text = await file.text();
      results.push(`[FILE: ${file.name}]\n\`\`\`\n${text}\n\`\`\``);
    } else if (file.type.includes("word") || file.type.includes("document")) {
      const text = await file.text().catch(() => "[Binary document - content extraction not available]");
      results.push(`[DOCUMENT: ${file.name}]\n${text}`);
    } else {
      results.push(`[ATTACHMENT: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(1)}KB)]`);
    }
  }

  return results.join("\n\n");
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function extractPDFText(file: File): Promise<string> {
  // Basic text extraction from PDF by reading raw bytes
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    
    // Extract readable text chunks from PDF structure
    const textParts: string[] = [];
    const streamRegex = /BT\s*([\s\S]*?)ET/g;
    let match;
    while ((match = streamRegex.exec(text)) !== null) {
      const content = match[1]
        .replace(/\([^)]*\)/g, (m) => m.slice(1, -1))
        .replace(/\\n/g, "\n")
        .replace(/[^\x20-\x7E\n]/g, " ")
        .trim();
      if (content.length > 2) textParts.push(content);
    }

    if (textParts.length > 0) {
      return textParts.join("\n").slice(0, 10000);
    }

    // Fallback: extract any readable text
    const readable = text
      .replace(/[^\x20-\x7E\n]/g, " ")
      .replace(/\s{3,}/g, "\n")
      .trim()
      .slice(0, 10000);
    return readable || `[PDF with ${(file.size / 1024).toFixed(0)}KB - send to AI for visual analysis]`;
  } catch {
    return `[PDF: ${file.name} - ${(file.size / 1024).toFixed(0)}KB]`;
  }
}
