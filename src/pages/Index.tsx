import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import AnimatedBackground from "@/components/AnimatedBackground";
import AuthPage from "@/components/AuthPage";
import ChatSidebar, { type Conversation } from "@/components/ChatSidebar";
import ChatArea from "@/components/ChatArea";
import { streamChat, generateTitle, type Msg } from "@/lib/streamChat";
import type { User } from "@supabase/supabase-js";
import { ChatMode } from "@/components/ChatInput";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  /* AUTO SCROLL */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* AUTH */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } }
      = supabase.auth.onAuthStateChange((_e, s) =>
        setUser(s?.user ?? null)
      );

    return () => subscription.unsubscribe();
  }, []);

  /* LOAD CONVERSATIONS */
  const loadChats = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("conversations")
      .select("*")
      .order("pinned", { ascending: false })
      .order("updated_at", { ascending: false });

    if (data) setConversations(data);
  };

  useEffect(() => { loadChats(); }, [user]);

  /* ===========================
     RENAME CHAT
  =========================== */
  const renameChat = async (id: string, title: string) => {
    await supabase
      .from("conversations")
      .update({ title })
      .eq("id", id);

    loadChats();
  };

  /* ===========================
     PIN / UNPIN CHAT
  =========================== */
  const pinChat = async (id: string, pinned: boolean) => {

  const { error } = await supabase
    .from("conversations")
    .update({
      pinned: pinned,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Pin error:", error);
    return;
  }

  // ✅ update local UI instantly
  setConversations((prev) =>
    prev.map((c) =>
      c.id === id ? { ...c, pinned } : c
    )
  );
};
  /* ===========================
     DELETE CHAT
  =========================== */
  const deleteChat = async (id: string) => {
    await supabase
      .from("messages")
      .delete()
      .eq("conversation_id", id);

    await supabase
      .from("conversations")
      .delete()
      .eq("id", id);

    if (activeConvId === id) {
      setActiveConvId(null);
      setMessages([]);
    }

    loadChats();
  };

  /* ===========================
     SHARE CHAT LINK
  =========================== */
  const shareChat = (id: string) => {
    const link = `${window.location.origin}/chat/${id}`;
    navigator.clipboard.writeText(link);
    alert("Chat link copied!");
  };

  /* LOAD MESSAGES */
  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      return;
    }

    supabase
      .from("messages")
      .select("role,content")
      .eq("conversation_id", activeConvId)
      .order("created_at")
      .then(({ data }) => {
        if (!data) return;
        setMessages(data as Msg[]);
      });
  }, [activeConvId]);

  /* SEND MESSAGE */
  const sendMessage = useCallback(async (input: string) => {
    if (!user || isStreaming) return;

    let convId = activeConvId;

    if (!convId) {
      const { data } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          title: generateTitle(input),
        })
        .select("id")
        .single();

      convId = data?.id ?? null;
      setActiveConvId(convId);
      loadChats();
    }

    const userMsg: Msg = { role: "user", content: input };

    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);

    await supabase.from("messages").insert({
      conversation_id: convId,
      user_id: user.id,
      role: "user",
      content: input,
    });

    let reply = "";

    await streamChat({
      messages: [...messages, userMsg],
      onDelta: (chunk) => {
        reply += chunk;
        setMessages(prev => {
          const withoutStreaming = prev.filter(
            m => !(m.role === "assistant" && m.content === reply)
          );
          return [...withoutStreaming, { role: "assistant", content: reply }];
        });
      },
      onDone: () => setIsStreaming(false),
    });

    await supabase.from("messages").insert({
      conversation_id: convId,
      user_id: user.id,
      role: "assistant",
      content: reply,
    });

    loadChats();
  }, [user, activeConvId, messages, isStreaming]);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) return <div>Loading...</div>;

  if (!user)
    return (
      <>
        <AnimatedBackground />
        <AuthPage />
      </>
    );

  return (
    <div className="h-screen flex overflow-hidden">
      <ChatSidebar
        conversations={conversations}
        activeId={activeConvId}
        onSelect={setActiveConvId}
        onRename={renameChat}
        onPin={pinChat}
        onDelete={deleteChat}
        onNew={() => setActiveConvId(null)}
        onLogout={logout}
        collapsed={false}
        onToggle={() => {}}
      />

      <div className="flex-1 overflow-y-auto">
        <ChatArea
          messages={messages}
          onSend={sendMessage}
          onStop={() => setIsStreaming(false)}
          isStreaming={isStreaming}
          onToggleSidebar={() => {}}
          isNewChat={!activeConvId}
          mode="search"
          onModeChange={function (mode: ChatMode): void {
            throw new Error("Function not implemented.");
          }}
        />
        <div ref={chatEndRef} />
      </div>
    </div>
  );
};

export default Index;