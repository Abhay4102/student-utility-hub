import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, BookOpen, RotateCcw, Copy, Check, Image as ImageIcon, X, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
  imageDataUrl?: string;
}

const SUGGESTED = [
  "Explain photosynthesis step by step",
  "How do I solve quadratic equations?",
  "What caused World War I?",
  "Explain Newton's laws of motion",
  "Difference between mitosis and meiosis?",
  "How does compound interest work?",
];

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>;
    if (p.startsWith("*") && p.endsWith("*") && p.length > 2) return <em key={i} className="italic">{p.slice(1, -1)}</em>;
    if (p.startsWith("`") && p.endsWith("`") && p.length > 2)
      return <code key={i} className="px-1.5 py-0.5 rounded bg-background/60 text-xs font-mono">{p.slice(1, -1)}</code>;
    return <span key={i}>{p}</span>;
  });
}

function renderMessage(content: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const lines = content.split("\n");
  let inCode = false;
  let codeBuf: string[] = [];
  let key = 0;

  const flushCode = () => {
    if (codeBuf.length) {
      out.push(
        <pre key={key++} className="my-2 p-3 rounded-lg bg-background/70 border border-border overflow-x-auto text-xs font-mono whitespace-pre">
          {codeBuf.join("\n")}
        </pre>
      );
      codeBuf = [];
    }
  };

  for (const raw of lines) {
    const line = raw.replace(/\r$/, "");
    if (line.startsWith("```")) {
      if (inCode) flushCode();
      inCode = !inCode;
      continue;
    }
    if (inCode) { codeBuf.push(line); continue; }
    if (!line.trim()) { out.push(<div key={key++} className="h-2" />); continue; }
    if (line.startsWith("### ")) { out.push(<h3 key={key++} className="text-base font-semibold mt-3 mb-1">{line.slice(4)}</h3>); continue; }
    if (line.startsWith("## ")) { out.push(<h2 key={key++} className="text-lg font-bold mt-3 mb-1">{line.slice(3)}</h2>); continue; }
    if (line.startsWith("# ")) { out.push(<h1 key={key++} className="text-xl font-bold mt-3 mb-1">{line.slice(2)}</h1>); continue; }
    const bullet = line.match(/^\s*[-•*]\s+(.*)$/);
    if (bullet) { out.push(<div key={key++} className="ml-4 my-0.5 flex gap-2"><span>•</span><span>{renderInline(bullet[1])}</span></div>); continue; }
    const num = line.match(/^\s*(\d+)\.\s+(.*)$/);
    if (num) { out.push(<div key={key++} className="ml-4 my-0.5 flex gap-2"><span className="font-medium shrink-0">{num[1]}.</span><span>{renderInline(num[2])}</span></div>); continue; }
    out.push(<p key={key++} className="my-0.5 leading-relaxed">{renderInline(line)}</p>);
  }
  flushCode();
  return out;
}

function MessageBubble({ msg, onCopy }: { msg: Message; onCopy: (text: string) => void }) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
          <BookOpen className="w-4 h-4 text-primary" />
        </div>
      )}
      <div className={`group max-w-[85%] ${isUser ? "order-first" : ""}`}>
        {msg.imageDataUrl && (
          <img
            src={msg.imageDataUrl}
            alt="uploaded"
            className="max-w-xs rounded-xl mb-1.5 border border-border"
          />
        )}
        {msg.content && (
          <div
            className={`rounded-2xl px-4 py-3 text-sm ${
              isUser
                ? "bg-primary text-primary-foreground rounded-tr-sm"
                : "bg-muted text-foreground rounded-tl-sm"
            }`}
          >
            {isUser ? (
              <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            ) : (
              <div className="space-y-0.5">{renderMessage(msg.content)}</div>
            )}
          </div>
        )}
        {!isUser && msg.content && (
          <button
            onClick={handleCopy}
            className="mt-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>
    </div>
  );
}

async function fileToBase64(file: File): Promise<{ base64: string; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1] || "";
      resolve({ base64, dataUrl });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.split(",")[1] || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function StudyAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [pendingImage, setPendingImage] = useState<{ base64: string; dataUrl: string; mime: string } | null>(null);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const handleImagePick = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be under 8 MB");
      return;
    }
    const { base64, dataUrl } = await fileToBase64(file);
    setPendingImage({ base64, dataUrl, mime: file.type });
  };

  const sendMessage = useCallback(async (questionArg?: string) => {
    const question = (questionArg ?? input).trim();
    if (!question && !pendingImage) return;
    if (loading) return;

    const userMsg: Message = {
      role: "user",
      content: question || (pendingImage ? "Please analyze this image." : ""),
      imageDataUrl: pendingImage?.dataUrl,
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    const imageForRequest = pendingImage;
    setInput("");
    setPendingImage(null);
    setLoading(true);
    setStreamingContent("");

    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/ai/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question || "Please analyze this image.",
          history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
          imageBase64: imageForRequest?.base64,
          imageMimeType: imageForRequest?.mime,
        }),
      });

      if (!res.ok || !res.body) throw new Error("Failed to connect");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      let streamError: string | null = null;
      let done = false;
      while (!done) {
        const { done: rdDone, value } = await reader.read();
        if (rdDone) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          let data: { content?: string; error?: string; done?: boolean } | null = null;
          try {
            data = JSON.parse(line.slice(6));
          } catch {
            continue;
          }
          if (!data) continue;
          if (data.error) { streamError = data.error; done = true; break; }
          if (data.done) { done = true; break; }
          if (data.content) {
            fullContent += data.content;
            setStreamingContent(fullContent);
          }
        }
      }

      if (streamError) throw new Error(streamError);
      setMessages((prev) => [...prev, { role: "assistant", content: fullContent }]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      setStreamingContent("");
      textareaRef.current?.focus();
    }
  }, [messages, loading, input, pendingImage]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (blob.size < 1000) {
          toast.error("Recording too short");
          return;
        }
        setTranscribing(true);
        try {
          const base64 = await blobToBase64(blob);
          const fmt = (recorder.mimeType || "audio/webm").includes("mp4") ? "mp3" : "webm";
          const res = await fetch(`${import.meta.env.BASE_URL}api/ai/transcribe`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audioBase64: base64, format: fmt }),
          });
          const data = await res.json();
          if (data.error || !data.text) throw new Error(data.error || "No transcript");
          setInput((prev) => (prev ? `${prev} ${data.text}` : data.text));
          textareaRef.current?.focus();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Failed to transcribe");
        } finally {
          setTranscribing(false);
        }
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    setRecording(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const reset = () => {
    setMessages([]);
    setInput("");
    setStreamingContent("");
    setPendingImage(null);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground text-sm">Study Assistant</h1>
            <p className="text-xs text-muted-foreground">Text, voice & image — AI-powered academic help</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5 text-xs">
            <RotateCcw className="w-3.5 h-3.5" />
            New chat
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-6 pb-10">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Study Assistant</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                Type, speak, or upload an image — ask anything about your studies and get clear, detailed answers.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
              {SUGGESTED.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-left px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-sm text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} onCopy={handleCopy} />
        ))}

        {loading && streamingContent && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm text-foreground">
              <div className="space-y-0.5">{renderMessage(streamingContent)}</div>
            </div>
          </div>
        )}

        {loading && !streamingContent && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border px-4 py-3 shrink-0">
        <div className="max-w-3xl mx-auto">
          {pendingImage && (
            <div className="mb-2 relative inline-block">
              <img src={pendingImage.dataUrl} alt="preview" className="h-20 rounded-lg border border-border" />
              <button
                onClick={() => setPendingImage(null)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center hover:bg-foreground/80"
                aria-label="Remove image"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <div className="flex gap-2 items-end">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImagePick(f);
                e.target.value = "";
              }}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || recording}
              className="shrink-0 h-11 w-11"
              title="Attach an image"
            >
              <ImageIcon className="w-4 h-4" />
            </Button>
            <Button
              variant={recording ? "destructive" : "outline"}
              size="icon"
              onClick={recording ? stopRecording : startRecording}
              disabled={loading || transcribing}
              className="shrink-0 h-11 w-11"
              title={recording ? "Stop recording" : "Record voice message"}
            >
              {transcribing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : recording ? (
                <Square className="w-4 h-4 fill-current" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={recording ? "Recording… tap stop when done" : transcribing ? "Transcribing…" : "Type, speak, or attach an image…"}
              className="resize-none min-h-[44px] max-h-[160px] text-sm"
              rows={1}
              disabled={loading || recording || transcribing}
            />
            <Button
              onClick={() => sendMessage()}
              disabled={(!input.trim() && !pendingImage) || loading || recording || transcribing}
              size="icon"
              className="shrink-0 h-11 w-11"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-2">
            {recording ? "🔴 Recording in progress…" : "For academic study purposes only · Powered by AI"}
          </p>
        </div>
      </div>
    </div>
  );
}
