import { motion } from "framer-motion";
import { Bot, User, Copy, Check, RefreshCw, Lightbulb, ThumbsUp, ThumbsDown, Share2, Volume2, VolumeX, Pencil, Link, History } from "lucide-react";
import { useState, useRef } from "react";

type Props = {
  role: "user" | "assistant";
  content: string;
  isLast?: boolean;
  onRegenerate?: () => void;
  onSendSuggestion?: (question: string) => void;
  onEditMessage?: (newContent: string) => void;
  canRestore?: boolean;
  onRestore?: () => void;
};

const MessageBubble = ({ role, content, isLast, onRegenerate, onSendSuggestion, onEditMessage, canRestore, onRestore }: Props) => {
  const [copied, setCopied] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [feedback, setFeedback] = useState<"good" | "bad" | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(content);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isUser = role === "user";

  const parseSuggestions = (text: string): { mainContent: string; suggestions: string[] } => {
    const suggestionRegex = /\n---\n💡\s*\*\*Related questions:\*\*\n([\s\S]*?)$/;
    const match = text.match(suggestionRegex);
    if (!match) return { mainContent: text, suggestions: [] };
    const mainContent = text.slice(0, match.index).trimEnd();
    const sugLines = match[1].trim().split("\n").map(l => l.replace(/^\d+\.\s*/, "").trim()).filter(Boolean);
    return { mainContent, suggestions: sugLines };
  };

  const { mainContent, suggestions } = !isUser ? parseSuggestions(content) : { mainContent: content, suggestions: [] };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => { setLinkCopied(false); setShowShareMenu(false); }, 2000);
  };

  const handleEditSubmit = () => {
    if (editText.trim() && editText !== content && onEditMessage) {
      onEditMessage(editText.trim());
    }
    setIsEditing(false);
  };

  const toggleReadAloud = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const cleanText = mainContent
      .replace(/```[\s\S]*?```/g, "code block")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/#{1,4}\s+/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/---/g, "")
      .replace(/^\s*[-*]\s+/gm, "");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Estimate word count for AI responses
  const wordCount = !isUser ? mainContent.split(/\s+/).filter(Boolean).length : 0;

  const renderContent = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        const inner = part.slice(3, -3);
        const firstNl = inner.indexOf("\n");
        const lang = firstNl > 0 ? inner.slice(0, firstNl).trim() : "";
        const code = firstNl > 0 ? inner.slice(firstNl + 1) : inner;
        return (
          <div key={i} className="my-3 rounded-lg overflow-hidden border border-border group/code">
            <div className="flex items-center justify-between px-4 py-2 bg-muted text-xs text-muted-foreground">
              <span className="font-mono">{lang || "code"}</span>
              <button onClick={() => copyText(code)} className="hover:text-foreground transition-colors flex items-center gap-1 opacity-0 group-hover/code:opacity-100">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm bg-background/50">
              <code className="font-mono text-foreground">{code}</code>
            </pre>
          </div>
        );
      }
      const imgRegex = /(data:image\/[^;]+;base64,[^\s"']+)/g;
      const imgParts = part.split(imgRegex);
      if (imgParts.length > 1) {
        return imgParts.map((imgPart, j) => {
          if (imgPart.startsWith("data:image/")) {
            return <img key={`${i}-${j}`} src={imgPart} alt="Generated" className="my-3 rounded-xl max-w-full border border-border shadow-lg" />;
          }
          return <span key={`${i}-${j}`}>{renderMarkdown(imgPart)}</span>;
        });
      }
      return <span key={i}>{renderMarkdown(part)}</span>;
    });
  };

  const renderMarkdown = (text: string) => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let listBuffer: { ordered: boolean; items: string[] } | null = null;
    let blockquoteBuffer: string[] | null = null;
    let tableBuffer: string[] | null = null;

    const flushList = () => {
      if (!listBuffer) return;
      const Tag = listBuffer.ordered ? "ol" : "ul";
      const cls = listBuffer.ordered ? "list-decimal pl-5 my-2 space-y-1" : "list-disc pl-5 my-2 space-y-1";
      elements.push(
        <Tag key={elements.length} className={cls}>
          {listBuffer.items.map((item, j) => (
            <li key={j} className="text-sm leading-relaxed">{renderInline(item)}</li>
          ))}
        </Tag>
      );
      listBuffer = null;
    };

    const flushBlockquote = () => {
      if (!blockquoteBuffer) return;
      elements.push(
        <blockquote key={elements.length} className="border-l-4 border-primary/40 pl-4 my-3 text-muted-foreground italic">
          {blockquoteBuffer.map((line, j) => (
            <p key={j} className="text-sm leading-relaxed">{renderInline(line)}</p>
          ))}
        </blockquote>
      );
      blockquoteBuffer = null;
    };

    const flushTable = () => {
      if (!tableBuffer || tableBuffer.length < 2) return;
      const rows = tableBuffer.map(r => r.split("|").map(c => c.trim()).filter(Boolean));
      const header = rows[0];
      const body = rows.slice(2);
      elements.push(
        <div key={elements.length} className="my-3 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                {header.map((h, j) => (
                  <th key={j} className="px-3 py-2 text-left font-semibold text-foreground">{renderInline(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, j) => (
                <tr key={j} className="border-t border-border">
                  {row.map((cell, k) => (
                    <td key={k} className="px-3 py-2 text-muted-foreground">{renderInline(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableBuffer = null;
    };

    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
        flushList(); flushBlockquote();
        if (!tableBuffer) tableBuffer = [];
        tableBuffer.push(line.trim());
        continue;
      } else { flushTable(); }
      if (line.startsWith("> ")) {
        flushList();
        if (!blockquoteBuffer) blockquoteBuffer = [];
        blockquoteBuffer.push(line.slice(2));
        continue;
      } else { flushBlockquote(); }
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
        flushList();
        elements.push(<hr key={elements.length} className="my-4 border-border" />);
        continue;
      }
      const headingMatch = line.match(/^(#{1,4})\s+(.+)/);
      if (headingMatch) {
        flushList();
        const level = headingMatch[1].length;
        const hText = headingMatch[2];
        const cls = level === 1 ? "text-lg font-bold mt-4 mb-2" : level === 2 ? "text-base font-semibold mt-3 mb-1.5" : "text-sm font-semibold mt-2 mb-1";
        elements.push(<div key={elements.length} className={cls}>{renderInline(hText)}</div>);
        continue;
      }
      const ulMatch = line.match(/^[\-\*]\s+(.+)/);
      if (ulMatch) {
        if (listBuffer && !listBuffer.ordered) { listBuffer.items.push(ulMatch[1]); }
        else { flushList(); listBuffer = { ordered: false, items: [ulMatch[1]] }; }
        continue;
      }
      const olMatch = line.match(/^\d+[\.\)]\s+(.+)/);
      if (olMatch) {
        if (listBuffer && listBuffer.ordered) { listBuffer.items.push(olMatch[1]); }
        else { flushList(); listBuffer = { ordered: true, items: [olMatch[1]] }; }
        continue;
      }
      flushList();
      if (line.trim() === "") { elements.push(<div key={elements.length} className="h-2" />); continue; }
      elements.push(<p key={elements.length} className="text-sm leading-relaxed my-0.5">{renderInline(line)}</p>);
    }
    flushList(); flushBlockquote(); flushTable();
    return elements;
  };

  const renderInline = (text: string): React.ReactNode => {
    const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|~~[^~]+~~)/g);
    return tokens.map((token, i) => {
      if (token.startsWith("**") && token.endsWith("**")) return <strong key={i} className="font-semibold text-foreground">{token.slice(2, -2)}</strong>;
      if (token.startsWith("~~") && token.endsWith("~~")) return <del key={i} className="text-muted-foreground">{token.slice(2, -2)}</del>;
      if (token.startsWith("*") && token.endsWith("*")) return <em key={i}>{token.slice(1, -1)}</em>;
      if (token.startsWith("`") && token.endsWith("`")) return <code key={i} className="px-1.5 py-0.5 rounded bg-muted text-primary text-sm font-mono">{token.slice(1, -1)}</code>;
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) return <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">{linkMatch[1]}</a>;
      return <span key={i}>{token}</span>;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 group ${isUser ? "justify-end" : "justify-start"}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { setHovering(false); setShowShareMenu(false); }}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0 mt-1 glow-primary">
          <Bot className="w-4 h-4 text-primary" />
        </div>
      )}
      <div className="flex flex-col max-w-[80%]">
        {isEditing && isUser ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="rounded-xl px-4 py-3 text-sm bg-secondary border border-border text-foreground resize-none min-h-[60px] outline-none focus:border-primary/40"
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setIsEditing(false); setEditText(content); }} className="px-3 py-1 text-xs rounded-lg text-muted-foreground hover:bg-secondary">Cancel</button>
              <button onClick={handleEditSubmit} className="px-3 py-1 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">Save & Submit</button>
            </div>
          </div>
        ) : (
          <div
            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              isUser
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "glass rounded-bl-md text-foreground"
            }`}
          >
            {renderContent(mainContent)}
          </div>
        )}

        {/* Word count for AI */}
        {!isUser && !isEditing && wordCount > 50 && (
          <span className="text-[10px] text-muted-foreground mt-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {wordCount} words
          </span>
        )}

        {/* Follow-up suggestions */}
        {!isUser && isLast && suggestions.length > 0 && onSendSuggestion && (
          <div className="flex flex-col gap-2 mt-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Related questions</span>
            </div>
            {suggestions.map((q, i) => (
              <button
                key={i}
                onClick={() => onSendSuggestion(q)}
                className="text-left text-sm px-3 py-2 rounded-lg border border-border hover:bg-secondary/60 hover:border-primary/30 transition-all text-foreground"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Action buttons */}
        {hovering && mainContent && !isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`flex items-center gap-0.5 mt-1.5 ${isUser ? "justify-end" : "justify-start"}`}
          >
            <button
              onClick={() => copyText(mainContent)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Copy message"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            {isUser && onEditMessage && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="Edit message"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            {!isUser && (
              <>
                <button
                  onClick={() => setFeedback(feedback === "good" ? null : "good")}
                  className={`p-1.5 rounded-md transition-colors ${feedback === "good" ? "text-emerald-500 bg-emerald-500/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
                  title="Good response"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setFeedback(feedback === "bad" ? null : "bad")}
                  className={`p-1.5 rounded-md transition-colors ${feedback === "bad" ? "text-red-500 bg-red-500/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
                  title="Bad response"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={toggleReadAloud}
                  className={`p-1.5 rounded-md transition-colors ${isSpeaking ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
                  title={isSpeaking ? "Stop reading" : "Read aloud"}
                >
                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    title="Share"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  {showShareMenu && (
                    <div className="absolute bottom-full left-0 mb-1 bg-popover border border-border rounded-lg shadow-lg p-1 min-w-[140px] z-50">
                      <button
                        onClick={handleCopyLink}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs rounded-md hover:bg-secondary transition-colors text-foreground"
                      >
                        {linkCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Link className="w-3.5 h-3.5" />}
                        {linkCopied ? "Link copied!" : "Copy link"}
                      </button>
                    </div>
                  )}
                </div>
                {canRestore && onRestore && (
                  <button
                    onClick={onRestore}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    title="Restore previous response"
                  >
                    <History className="w-3.5 h-3.5" />
                  </button>
                )}
                {isLast && onRegenerate && (
                  <button
                    onClick={onRegenerate}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    title="Regenerate response"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            )}
          </motion.div>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center shrink-0 mt-1">
          <User className="w-4 h-4 text-foreground" />
        </div>
      )}
    </motion.div>
  );
};

export default MessageBubble;