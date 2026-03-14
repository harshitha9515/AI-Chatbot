import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Menu, Download, Globe, Image, ArrowDown, Zap, Code, GraduationCap, Lightbulb, FileText, Languages } from "lucide-react";
import MessageBubble from "./MessageBubble";
import ChatInput, { type ChatMode } from "./ChatInput";
import ImageStylePicker, { type ImageStyle } from "./ImageStylePicker";
import { Button } from "@/components/ui/button";
import type { Msg } from "@/lib/streamChat";

type Props = {
  messages: Msg[];
  onSend: (msg: string, files?: File[]) => void;
  onStop: () => void;
  isStreaming: boolean;
  onToggleSidebar: () => void;
  isNewChat: boolean;
  onRegenerate?: () => void;
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  onImageStyleDescribe?: (style: ImageStyle) => void;
  onImageStyleUpload?: (style: ImageStyle, file: File) => void;
  onEditMessage?: (index: number, newContent: string) => void;
  responseHistory?: Record<number, string[]>;
  onRestoreResponse?: (msgIndex: number) => void;
};

const CATEGORIES = [
  {
    icon: Code,
    label: "Coding",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    suggestions: [
      "Write a Python REST API with Flask",
      "Debug this JavaScript async/await code",
      "Create a React custom hook for dark mode",
    ],
  },
  {
    icon: GraduationCap,
    label: "Learning",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    suggestions: [
      "Explain neural networks like I'm 12",
      "Create a 30-day JavaScript learning path",
      "Teach me SQL with interactive examples",
    ],
  },
  {
    icon: Lightbulb,
    label: "Creative",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    suggestions: [
      "Write a sci-fi short story about AI",
      "Generate 10 startup ideas for 2026",
      "Create a LinkedIn bio for a developer",
    ],
  },
  {
    icon: FileText,
    label: "Analysis",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    suggestions: [
      "Summarize a research paper for me",
      "Compare pros and cons of microservices",
      "Analyze this business model",
    ],
  },
  {
    icon: Languages,
    label: "Language",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    suggestions: [
      "Translate this paragraph to Japanese",
      "Teach me conversational Spanish",
      "Explain English idioms with examples",
    ],
  },
  {
    icon: Zap,
    label: "Quick Tasks",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    suggestions: [
      "Solve: ∫(x²+3x)dx step by step",
      "Generate a daily quiz on world history",
      "Summarize today's tech news",
    ],
  },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Working late? 🌙";
  if (hour < 12) return "Good morning! ☀️";
  if (hour < 17) return "Good afternoon! 🌤️";
  if (hour < 21) return "Good evening! 🌅";
  return "Good night! 🌙";
}

const ChatArea = ({
  messages, onSend, onStop, isStreaming, onToggleSidebar, isNewChat, onRegenerate, mode, onModeChange,
  onImageStyleDescribe, onImageStyleUpload, onEditMessage, responseHistory, onRestoreResponse,
}: Props) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeImageStyle, setActiveImageStyle] = useState<ImageStyle | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const [streamStartTime, setStreamStartTime] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Track response time
  useEffect(() => {
    if (isStreaming && !streamStartTime) {
      setStreamStartTime(Date.now());
      setResponseTime(null);
    }
    if (!isStreaming && streamStartTime) {
      setResponseTime(((Date.now() - streamStartTime) / 1000));
      setStreamStartTime(null);
    }
  }, [isStreaming]);

  // Scroll button visibility
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const fromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(fromBottom > 200);
  }, []);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        // Focus search - handled by parent
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const exportChat = () => {
    if (messages.length === 0) return;
    const text = messages.map(m => `${m.role === "user" ? "You" : "Harshi AI"}: ${m.content}`).join("\n\n---\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `harshi-ai-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDescribe = (style: ImageStyle) => {
    setActiveImageStyle(style);
    onImageStyleDescribe?.(style);
  };

  const handleUpload = (style: ImageStyle, file: File) => {
    onImageStyleUpload?.(style, file);
  };

  const thinkingLabel = mode === "search" ? "Searching the web" : mode === "image" ? "Generating image" : "Harshi's Bot is thinking";

  const stylePlaceholder = activeImageStyle
    ? `Describe who/what to create in "${activeImageStyle.name}" style...`
    : undefined;

  const currentCat = CATEGORIES[activeCategory];

  return (
    <div className="flex-1 flex flex-col h-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border backdrop-blur-sm bg-background/80">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={onToggleSidebar} className="md:hidden text-muted-foreground">
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-medium text-foreground">Harshi AI</span>
          </div>
          {mode === "search" && (
            <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              <Globe className="w-3 h-3" /> Web Search
            </span>
          )}
          {mode === "image" && (
            <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              <Image className="w-3 h-3" /> Create Image
            </span>
          )}
          {activeImageStyle && mode === "image" && (
            <span className="flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
              {activeImageStyle.emoji} {activeImageStyle.name}
              <button onClick={() => setActiveImageStyle(null)} className="ml-1 hover:text-destructive">✕</button>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {responseTime && !isStreaming && messages.length > 0 && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Zap className="w-3 h-3" /> {responseTime.toFixed(1)}s
            </span>
          )}
          {messages.length > 0 && (
            <Button size="icon" variant="ghost" onClick={exportChat} className="text-muted-foreground h-8 w-8" title="Export chat">
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scrollbar-thin relative"
      >
        {isNewChat && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-2xl w-full">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-6"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4 glow-primary">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold mb-1 text-gradient">{getGreeting()}</h1>
                <p className="text-muted-foreground">What would you like to explore today?</p>
              </motion.div>

              {/* Category tabs */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap justify-center gap-2 mb-6"
              >
                {CATEGORIES.map((cat, i) => (
                  <button
                    key={cat.label}
                    onClick={() => setActiveCategory(i)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      activeCategory === i
                        ? `${cat.bg} ${cat.color} ring-1 ring-current/20`
                        : "text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <cat.icon className="w-3.5 h-3.5" />
                    {cat.label}
                  </button>
                ))}
              </motion.div>

              {/* Suggestions for active category */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCategory}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-1 gap-2.5"
                >
                  {currentCat.suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => onSend(s)}
                      className={`glass rounded-xl p-3.5 text-sm text-left text-foreground hover:bg-secondary/60 transition-all hover:border-primary/20 flex items-center gap-3 group`}
                    >
                      <div className={`w-8 h-8 rounded-lg ${currentCat.bg} flex items-center justify-center shrink-0`}>
                        <currentCat.icon className={`w-4 h-4 ${currentCat.color}`} />
                      </div>
                      <span className="group-hover:text-foreground">{s}</span>
                    </button>
                  ))}
                </motion.div>
              </AnimatePresence>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 text-xs text-muted-foreground"
              >
                ⌨️ Press <kbd className="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground text-[10px] font-mono mx-0.5">Enter</kbd> to send • <kbd className="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground text-[10px] font-mono mx-0.5">Shift+Enter</kbd> for new line
              </motion.p>
            </motion.div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {messages.map((m, i) => (
              <MessageBubble
                key={i}
                role={m.role}
                content={m.content}
                isLast={i === messages.length - 1}
                onRegenerate={onRegenerate}
                onSendSuggestion={!isStreaming ? onSend : undefined}
                onEditMessage={m.role === "user" && onEditMessage ? (newContent) => onEditMessage(i, newContent) : undefined}
                canRestore={
                  m.role === "assistant" &&
                  responseHistory != null &&
                  (() => {
                    const userIdx = messages.slice(0, i).reverse().findIndex(msg => msg.role === "user");
                    if (userIdx === -1) return false;
                    const actualUserIdx = i - 1 - userIdx;
                    return (responseHistory[actualUserIdx]?.length || 0) > 0;
                  })()
                }
                onRestore={onRestoreResponse ? () => onRestoreResponse(i) : undefined}
              />
            ))}
            {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center glow-primary">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                </div>
                <div className="glass rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{thinkingLabel}</span>
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Scroll to bottom */}
        <AnimatePresence>
          {showScrollBtn && messages.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={scrollToBottom}
              className="fixed bottom-28 right-8 z-20 w-10 h-10 rounded-full bg-secondary border border-border shadow-lg flex items-center justify-center hover:bg-secondary/80 transition-colors"
            >
              <ArrowDown className="w-4 h-4 text-foreground" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {mode === "image" && !isStreaming && (
        <ImageStylePicker onDescribe={handleDescribe} onUpload={handleUpload} />
      )}

      <ChatInput
        onSend={(msg, files) => {
          if (activeImageStyle && mode === "image") {
            onSend(msg, files);
            setActiveImageStyle(null);
          } else {
            onSend(msg, files);
          }
        }}
        onStop={onStop}
        isStreaming={isStreaming}
        disabled={false}
        mode={mode}
        onModeChange={(m) => {
          onModeChange(m);
          if (m !== "image") setActiveImageStyle(null);
        }}
        customPlaceholder={stylePlaceholder}
      />
    </div>
  );
};

export default ChatArea;
