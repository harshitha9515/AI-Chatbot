import { supabase } from "@/integrations/supabase/client";

export type Memory = {
  id: string;
  memory_key: string;
  memory_value: string;
  category: string;
};

export async function loadMemories(userId: string): Promise<Memory[]> {
  const { data } = await supabase
    .from("user_memories")
    .select("id, memory_key, memory_value, category")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(50);
  return (data as Memory[]) || [];
}

export async function saveMemory(
  userId: string,
  key: string,
  value: string,
  category = "general"
) {
  // Upsert: if same key exists, update it
  const { data: existing } = await supabase
    .from("user_memories")
    .select("id")
    .eq("user_id", userId)
    .eq("memory_key", key)
    .limit(1);

  if (existing && existing.length > 0) {
    await supabase
      .from("user_memories")
      .update({ memory_value: value, category })
      .eq("id", existing[0].id);
  } else {
    await supabase
      .from("user_memories")
      .insert({ user_id: userId, memory_key: key, memory_value: value, category });
  }
}

export async function deleteMemory(memoryId: string) {
  await supabase.from("user_memories").delete().eq("id", memoryId);
}

export function formatMemoriesForPrompt(memories: Memory[]): string {
  if (memories.length === 0) return "";
  const lines = memories.map((m) => `- ${m.memory_key}: ${m.memory_value}`);
  return `\n\n[USER MEMORY - Things you remember about this user]\n${lines.join("\n")}`;
}

// Extract memories from AI response if it contains [REMEMBER] tags
export function extractMemoriesToSave(text: string): { key: string; value: string }[] {
  const regex = /\[REMEMBER:\s*([^\]]+)\]/g;
  const results: { key: string; value: string }[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    const parts = match[1].split("=");
    if (parts.length >= 2) {
      results.push({ key: parts[0].trim(), value: parts.slice(1).join("=").trim() });
    }
  }
  return results;
}

// Clean REMEMBER tags from displayed content
export function cleanMemoryTags(text: string): string {
  return text.replace(/\[REMEMBER:\s*[^\]]+\]/g, "").trim();
}
