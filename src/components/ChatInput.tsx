import { useState, useRef, useEffect } from "react";
import { Send, Square, Sparkles, Paperclip, Mic, MicOff, X, Image, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { startSpeechRecognition, isSpeechRecognitionSupported } from "@/lib/speechToText";

export type ChatMode = "chat" | "image" | "search";

type Props = {
  onSend: (msg: string, files?: File[]) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled: boolean;
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  customPlaceholder?: string;
};

const ChatInput = ({ onSend, onStop, isStreaming, disabled, mode, onModeChange, customPlaceholder }: Props) => {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  const handleSubmit = () => {
    if ((!input.trim() && files.length === 0) || disabled) return;
    onSend(input.trim(), files.length > 0 ? files : undefined);
    setInput("");
    setFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      setIsRecording(false);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      toast({ title: "Not supported", description: "Speech recognition isn't supported in this browser. Try Chrome.", variant: "destructive" });
      return;
    }

    const handle = startSpeechRecognition({
      onResult: (text) => setInput(text),
      onEnd: () => setIsRecording(false),
      onError: (err) => {
        toast({ title: "Voice input error", description: err, variant: "destructive" });
        setIsRecording(false);
      },
    });

    if (handle) {
      recognitionRef.current = handle;
      setIsRecording(true);
      toast({ title: "🎤 Listening...", description: "Speak now — your words will appear in the input." });
    }
  };

  const placeholder = customPlaceholder
    || (mode === "image"
      ? "Describe the image you want to create..."
      : mode === "search"
      ? "Search the web for anything..."
      : "Ask Harshi AI anything...");

  return (
    <div className="p-4 border-t border-border">
      <div className="max-w-3xl mx-auto">
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-secondary rounded-lg px-3 py-1.5 text-xs text-secondary-foreground">
                <span className="truncate max-w-[150px]">{f.name}</span>
                <button onClick={() => removeFile(i)}><X className="w-3 h-3 text-muted-foreground hover:text-destructive" /></button>
              </div>
            ))}
          </div>
        )}
        <div
          className="glass rounded-2xl p-2 flex items-end gap-2 transition-all focus-within:border-primary/30 focus-within:glow-primary"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} accept="image/*,.pdf,.txt,.md,.js,.ts,.tsx,.py,.java,.cpp,.c,.html,.css,.json,.xml,.csv,.yaml,.yml" />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground"
          >
            <Paperclip className="w-4 h-4" />
          </Button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            disabled={disabled}
            className="flex-1 bg-transparent resize-none border-none outline-none px-1 py-2.5 text-sm text-foreground placeholder:text-muted-foreground scrollbar-thin min-h-[40px] max-h-[200px]"
          />

          <Button
            size="icon"
            variant="ghost"
            onClick={toggleRecording}
            className={`shrink-0 h-10 w-10 rounded-xl ${isRecording ? "text-destructive animate-pulse" : "text-muted-foreground hover:text-foreground"}`}
            title={isRecording ? "Stop listening" : "Voice input (speech-to-text)"}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>

          {isStreaming ? (
            <Button size="icon" onClick={onStop} className="shrink-0 h-10 w-10 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              <Square className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={handleSubmit}
              disabled={!input.trim() && files.length === 0}
              className="shrink-0 h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-30 glow-primary"
            >
              {input.trim() || files.length > 0 ? <Send className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 mt-2 justify-center">
          <button
            onClick={() => onModeChange(mode === "image" ? "chat" : "image")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              mode === "image"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            Create Image
          </button>
          <button
            onClick={() => onModeChange(mode === "search" ? "chat" : "search")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              mode === "search"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Web Search
          </button>
          <span className="text-xs text-muted-foreground">Harshi AI can make mistakes. Consider checking important information.</span>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
