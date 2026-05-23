import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Send, Loader2, BookOpen, RotateCcw, Copy, Check, Image as ImageIcon, X,
  Mic, Square, Plus, MessageSquare, Trash2, Download, RefreshCw, StopCircle,
  Search, Pencil, ChevronDown, ArrowDown, Sparkles, GraduationCap, ArrowLeft,
  Calculator as CalcIcon, FlaskConical, Atom, Beaker, Dna, Landmark, BookText,
  Languages as LangIcon, Globe2, LineChart, Code2,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";

type Mode = "standard" | "concise" | "detailed" | "step" | "exam" | "eli12";
type Subject = "General" | "Math" | "Science" | "Physics" | "Chemistry" | "Biology" | "History" | "Literature" | "Languages" | "Geography" | "Economics" | "Programming";

interface Message {
  role: "user" | "assistant";
  content: string;
  imageDataUrl?: string;
  imageBase64?: string;
  imageMime?: string;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  mode: Mode;
  subject: Subject;
  updatedAt: number;
}

const MODE_LABELS: Record<Mode, { label: string; hint: string }> = {
  standard: { label: "Standard", hint: "Clear, balanced answers" },
  concise: { label: "Concise", hint: "Brief, to the point" },
  detailed: { label: "Detailed", hint: "Thorough, in-depth" },
  step: { label: "Step-by-step", hint: "Numbered solution steps" },
  exam: { label: "Exam-ready", hint: "Mark-scheme style" },
  eli12: { label: "ELI12", hint: "Explain simply" },
};

const SUBJECTS: Subject[] = ["General", "Math", "Science", "Physics", "Chemistry", "Biology", "History", "Literature", "Languages", "Geography", "Economics", "Programming"];

const SUBJECT_META: Record<Subject, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  General:     { icon: Sparkles,      color: "from-violet-500/20 to-violet-500/5 text-violet-400" },
  Math:        { icon: CalcIcon,      color: "from-indigo-500/20 to-indigo-500/5 text-indigo-400" },
  Science:     { icon: FlaskConical,  color: "from-emerald-500/20 to-emerald-500/5 text-emerald-400" },
  Physics:     { icon: Atom,          color: "from-sky-500/20 to-sky-500/5 text-sky-400" },
  Chemistry:   { icon: Beaker,        color: "from-amber-500/20 to-amber-500/5 text-amber-400" },
  Biology:     { icon: Dna,           color: "from-green-500/20 to-green-500/5 text-green-400" },
  History:     { icon: Landmark,      color: "from-orange-500/20 to-orange-500/5 text-orange-400" },
  Literature:  { icon: BookText,      color: "from-rose-500/20 to-rose-500/5 text-rose-400" },
  Languages:   { icon: LangIcon,      color: "from-pink-500/20 to-pink-500/5 text-pink-400" },
  Geography:   { icon: Globe2,        color: "from-cyan-500/20 to-cyan-500/5 text-cyan-400" },
  Economics:   { icon: LineChart,     color: "from-yellow-500/20 to-yellow-500/5 text-yellow-400" },
  Programming: { icon: Code2,         color: "from-fuchsia-500/20 to-fuchsia-500/5 text-fuchsia-400" },
};

const SUGGESTIONS_BY_SUBJECT: Record<Subject, string[]> = {
  General: ["Explain photosynthesis step by step", "How does compound interest work?", "Summarise the French Revolution", "Difference between mitosis and meiosis", "What is opportunity cost?", "Explain Newton's laws"],
  Math: ["Solve 2x² − 5x − 3 = 0 step by step", "Explain the chain rule with an example", "Difference between permutation and combination", "Prove sin²θ + cos²θ = 1", "How do I integrate by parts?", "Explain logarithms simply"],
  Science: ["Explain Newton's three laws of motion", "How does the immune system fight infection?", "What is the periodic table organised by?", "Difference between weather and climate", "Explain the water cycle", "How does electricity flow in a circuit?"],
  Physics: ["Explain Ohm's law with an example", "How do projectile motion equations work?", "What is wave-particle duality?", "Derive v = u + at", "Explain Newton's law of gravitation", "What is the doppler effect?"],
  Chemistry: ["Balance: H₂ + O₂ → H₂O", "Explain pH and pOH with examples", "Difference between ionic and covalent bonds", "How does the periodic table work?", "What is Le Chatelier's principle?", "Explain electron configuration of Fe"],
  Biology: ["Explain DNA replication step by step", "Mitosis vs meiosis comparison", "How do enzymes work?", "Explain photosynthesis (light + dark reactions)", "What is natural selection?", "Structure of a neuron"],
  History: ["Causes of World War I", "Summarise the Industrial Revolution", "Compare French and American Revolutions", "Cold War: major events", "Rise and fall of the Roman Empire", "Causes of the Great Depression"],
  Literature: ["Themes in Macbeth", "Analyse 'The Road Not Taken'", "What is dramatic irony? Give examples", "Difference between metaphor and simile", "Summarise Pride and Prejudice", "Iambic pentameter explained"],
  Languages: ["Difference between past simple and present perfect", "Spanish 'ser' vs 'estar' with examples", "Common French faux amis", "When to use ‘who’ vs ‘whom’", "Active vs passive voice rules", "How to use 'whom' correctly"],
  Geography: ["What causes earthquakes?", "Difference between weather and climate", "How do ocean currents work?", "Tectonic plate boundaries explained", "Causes and effects of urbanisation", "Layers of the atmosphere"],
  Economics: ["Explain supply and demand", "What is GDP and how is it calculated?", "Difference between fiscal and monetary policy", "Explain opportunity cost with an example", "What causes inflation?", "Comparative advantage explained"],
  Programming: ["Difference between let, var and const in JavaScript", "Explain time complexity with O(n) examples", "How does a hash map work?", "What is recursion? Give a simple example", "Explain object-oriented programming concepts", "Difference between SQL and NoSQL"],
};

const QUICK_ACTIONS: { label: string; prefix: string }[] = [
  { label: "Solve step-by-step", prefix: "Solve this step by step: " },
  { label: "Quiz me", prefix: "Create a 5-question quiz with answers about " },
  { label: "Summarise", prefix: "Summarise in clear bullet points: " },
  { label: "Define", prefix: "Define and give two examples for " },
  { label: "Compare", prefix: "Compare and contrast: " },
  { label: "Explain simply", prefix: "Explain like I'm 12: " },
];

const CHATS_KEY = "treo-study-chats";
const PREFS_KEY = "treo-study-prefs";

function loadChats(): Chat[] {
  try {
    const raw = localStorage.getItem(CHATS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveChats(chats: Chat[]) {
  try { localStorage.setItem(CHATS_KEY, JSON.stringify(chats)); } catch { /* quota */ }
}
function loadPrefs(): { mode: Mode; subject: Subject } {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? JSON.parse(raw) : { mode: "standard", subject: "General" };
  } catch { return { mode: "standard", subject: "General" }; }
}
function savePrefs(p: { mode: Mode; subject: Subject }) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch { /* quota */ }
}

function newChatId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

function chatTitleFrom(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 48 ? clean.slice(0, 45) + "…" : clean || "New chat";
}

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function groupChats(list: Chat[]): { today: Chat[]; yesterday: Chat[]; thisWeek: Chat[]; earlier: Chat[] } {
  const now = Date.now();
  const todayStart = startOfDay(now);
  const yesterdayStart = todayStart - 86400000;
  const weekStart = todayStart - 6 * 86400000;
  const groups = { today: [] as Chat[], yesterday: [] as Chat[], thisWeek: [] as Chat[], earlier: [] as Chat[] };
  for (const c of list) {
    if (c.updatedAt >= todayStart) groups.today.push(c);
    else if (c.updatedAt >= yesterdayStart) groups.yesterday.push(c);
    else if (c.updatedAt >= weekStart) groups.thisWeek.push(c);
    else groups.earlier.push(c);
  }
  return groups;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\$[^$\n]+\$)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>;
    if (p.startsWith("$") && p.endsWith("$") && p.length > 2)
      return <span key={i} className="font-mono italic text-primary">{p.slice(1, -1)}</span>;
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

function MessageBubble({
  msg, onCopy, onRegenerate, isLast,
}: {
  msg: Message; onCopy: (text: string) => void; onRegenerate?: () => void; isLast?: boolean;
}) {
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
          <img src={msg.imageDataUrl} alt="uploaded" className="max-w-xs rounded-xl mb-1.5 border border-border" />
        )}
        {msg.content && (
          <div
            className={`rounded-2xl px-4 py-3 text-sm ${
              isUser ? "bg-primary text-primary-foreground rounded-tr-sm"
                : "bg-muted text-foreground rounded-tl-sm"
            }`}
          >
            {isUser
              ? <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              : <div className="space-y-0.5">{renderMessage(msg.content)}</div>}
          </div>
        )}
        {!isUser && msg.content && (
          <div className="mt-1 ml-1 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
            {isLast && onRegenerate && (
              <button onClick={onRegenerate} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <RefreshCw className="w-3 h-3" /> Regenerate
              </button>
            )}
          </div>
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
  const [chats, setChats] = useState<Chat[]>(() => loadChats());
  const [currentId, setCurrentId] = useState<string>(() => {
    const all = loadChats();
    return all[0]?.id || "";
  });

  const initialPrefs = loadPrefs();
  const [mode, setMode] = useState<Mode>(initialPrefs.mode);
  const [subject, setSubject] = useState<Subject>(initialPrefs.subject);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [pendingImage, setPendingImage] = useState<{ base64: string; dataUrl: string; mime: string } | null>(null);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatSearch, setChatSearch] = useState("");
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [subjectMenuOpen, setSubjectMenuOpen] = useState(false);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const userNearBottomRef = useRef(true);

  const current = chats.find((c) => c.id === currentId);
  const messages = current?.messages || [];

  // Auto-scroll the CHAT CONTAINER (not the page) only when:
  //   1) messages length changes OR streaming content grows
  //   2) the user was already near the bottom (don't yank them while reading)
  // This prevents subject/mode changes (which mutate the messages array reference
  // without changing its length) from triggering a scroll that yanks the page on mobile.
  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el || !userNearBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, streamingContent.length]);
  useEffect(() => { savePrefs({ mode, subject }); }, [mode, subject]);
  useEffect(() => { saveChats(chats); }, [chats]);

  // Sync mode/subject changes onto the current chat so export + history reflect them.
  useEffect(() => {
    if (!currentId) return;
    setChats((prev) => prev.map((c) => (c.id === currentId && (c.mode !== mode || c.subject !== subject))
      ? { ...c, mode, subject }
      : c));
  }, [mode, subject, currentId]);

  // When switching to a different chat, restore its mode/subject into the selectors.
  useEffect(() => {
    if (!current) return;
    if (current.mode && current.mode !== mode) setMode(current.mode);
    if (current.subject && current.subject !== subject) setSubject(current.subject);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  // Track scroll position for the "scroll to latest" floating button.
  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const onScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      userNearBottomRef.current = distanceFromBottom < 120;
      setShowScrollDown(distanceFromBottom > 200);
    };
    el.addEventListener("scroll", onScroll);
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [messages.length]);

  // Close popovers on outside click / escape.
  useEffect(() => {
    if (!subjectMenuOpen && !modeMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setSubjectMenuOpen(false); setModeMenuOpen(false); }
    };
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest?.("[data-popover-root]")) { setSubjectMenuOpen(false); setModeMenuOpen(false); }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [subjectMenuOpen, modeMenuOpen]);

  useEffect(() => {
    if (editingTitleId) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [editingTitleId]);

  const ensureChat = useCallback((firstUserText?: string): Chat => {
    if (current) return current;
    const c: Chat = {
      id: newChatId(),
      title: firstUserText ? chatTitleFrom(firstUserText) : "New chat",
      messages: [],
      mode, subject,
      updatedAt: Date.now(),
    };
    setChats((prev) => [c, ...prev]);
    setCurrentId(c.id);
    return c;
  }, [current, mode, subject]);

  const updateChat = useCallback((id: string, patch: Partial<Chat>) => {
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c)));
  }, []);

  const handleImagePick = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image file"); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error("Image must be under 8 MB"); return; }
    const { base64, dataUrl } = await fileToBase64(file);
    setPendingImage({ base64, dataUrl, mime: file.type });
  };

  const runRequest = useCallback(async (
    chatId: string,
    historyForRequest: Message[],
    userMsg: Message,
    imageForRequest: { base64: string; mime: string } | null,
  ) => {
    setLoading(true);
    setStreamingContent("");
    abortRef.current = new AbortController();
    let fullContent = "";

    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/ai/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          question: userMsg.content,
          history: historyForRequest.slice(-12).map((m) => ({ role: m.role, content: m.content })),
          imageBase64: imageForRequest?.base64,
          imageMimeType: imageForRequest?.mime,
          mode, subject,
        }),
      });

      if (!res.ok || !res.body) throw new Error("Failed to connect");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
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
          try { data = JSON.parse(line.slice(6)); } catch { continue; }
          if (!data) continue;
          if (data.error) { streamError = data.error; done = true; break; }
          if (data.done) { done = true; break; }
          if (data.content) { fullContent += data.content; setStreamingContent(fullContent); }
        }
      }

      if (streamError) throw new Error(streamError);
      setChats((prev) => prev.map((c) => c.id === chatId ? {
        ...c,
        messages: [...c.messages, { role: "assistant" as const, content: fullContent }],
        updatedAt: Date.now(),
      } : c));
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        if (fullContent) {
          setChats((prev) => prev.map((c) => c.id === chatId ? {
            ...c,
            messages: [...c.messages, { role: "assistant" as const, content: fullContent + "\n\n_(stopped)_" }],
            updatedAt: Date.now(),
          } : c));
        }
      } else {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    } finally {
      setLoading(false);
      setStreamingContent("");
      abortRef.current = null;
      textareaRef.current?.focus();
    }
  }, [mode, subject]);

  const sendMessage = useCallback(async (questionArg?: string) => {
    const question = (questionArg ?? input).trim();
    if (!question && !pendingImage) return;
    if (loading) return;

    const chat = ensureChat(question || "Image analysis");
    const userMsg: Message = {
      role: "user",
      content: question || (pendingImage ? "Please analyze this image." : ""),
      imageDataUrl: pendingImage?.dataUrl,
      imageBase64: pendingImage?.base64,
      imageMime: pendingImage?.mime,
    };
    const imageForRequest = pendingImage ? { base64: pendingImage.base64, mime: pendingImage.mime } : null;
    const baseHistory = chat.messages;
    setChats((prev) => prev.map((c) => c.id === chat.id ? {
      ...c,
      title: c.messages.length === 0 ? chatTitleFrom(userMsg.content) : c.title,
      messages: [...c.messages, userMsg],
      updatedAt: Date.now(),
    } : c));

    setInput("");
    setPendingImage(null);

    await runRequest(chat.id, baseHistory, userMsg, imageForRequest);
  }, [input, pendingImage, loading, ensureChat, runRequest]);

  const regenerate = useCallback(async () => {
    if (!current || loading) return;
    const lastAssistantIdx = [...current.messages].reverse().findIndex((m) => m.role === "assistant");
    if (lastAssistantIdx === -1) return;
    const realIdx = current.messages.length - 1 - lastAssistantIdx;
    const before = current.messages.slice(0, realIdx);
    const lastUser = [...before].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    updateChat(current.id, { messages: before });
    const img = lastUser.imageBase64 && lastUser.imageMime
      ? { base64: lastUser.imageBase64, mime: lastUser.imageMime }
      : null;
    await runRequest(current.id, before.slice(0, -1), lastUser, img);
  }, [current, loading, runRequest, updateChat]);

  const stopGenerating = () => abortRef.current?.abort();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "";
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (blob.size < 1000) { toast.error("Recording too short"); return; }
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
        } finally { setTranscribing(false); }
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch { toast.error("Microphone access denied"); }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    setRecording(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const newChat = () => {
    setCurrentId("");
    setInput("");
    setStreamingContent("");
    setPendingImage(null);
    setSidebarOpen(false);
  };

  const deleteChat = (id: string) => {
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (currentId === id) setCurrentId("");
  };

  const startRename = (chat: Chat) => {
    setEditingTitleId(chat.id);
    setEditingTitle(chat.title);
  };

  const commitRename = () => {
    if (!editingTitleId) return;
    const t = editingTitle.trim() || "New chat";
    updateChat(editingTitleId, { title: t.length > 64 ? t.slice(0, 64) : t });
    setEditingTitleId(null);
    setEditingTitle("");
  };

  const exportChat = () => {
    if (!current || current.messages.length === 0) return;
    const md = current.messages.map((m) => {
      const head = m.role === "user" ? "## 🧑 You" : "## 📘 Study Assistant";
      return `${head}\n\n${m.content}`;
    }).join("\n\n---\n\n");
    const full = `# ${current.title}\n\n_Subject: ${current.subject} · Mode: ${MODE_LABELS[current.mode].label}_\n\n${md}`;
    const blob = new Blob([full], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${current.title.replace(/[^\w-]+/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Chat exported");
  };

  const applyQuickAction = (prefix: string) => {
    setInput((prev) => prefix + prev.replace(new RegExp("^" + prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), ""));
    textareaRef.current?.focus();
  };

  const onComposerDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("Files")) {
      e.preventDefault();
      setIsDragging(true);
    }
  };
  const onComposerDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget === e.target) setIsDragging(false);
  };
  const onComposerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleImagePick(f);
  };

  const filteredChats = useMemo(() => {
    const q = chatSearch.trim().toLowerCase();
    const sorted = [...chats].sort((a, b) => b.updatedAt - a.updatedAt);
    if (!q) return sorted;
    return sorted.filter((c) =>
      c.title.toLowerCase().includes(q) ||
      c.subject.toLowerCase().includes(q) ||
      c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [chats, chatSearch]);

  const grouped = useMemo(() => groupChats(filteredChats), [filteredChats]);
  const subjectSuggestions = SUGGESTIONS_BY_SUBJECT[subject];
  const CurrentSubjectIcon = SUBJECT_META[subject].icon;
  const charCount = input.length;

  const renderChatList = (label: string, list: Chat[]) => {
    if (list.length === 0) return null;
    return (
      <div className="mb-2">
        <p className="px-2.5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">{label}</p>
        <ul className="space-y-0.5">
          {list.map((c) => {
            const M = SUBJECT_META[c.subject].icon;
            const isEditing = editingTitleId === c.id;
            return (
              <li key={c.id}>
                <div
                  className={`group w-full text-left px-2 py-2 rounded-lg flex items-start gap-2 transition-colors cursor-pointer ${c.id === currentId ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}
                  onClick={() => { if (!isEditing) { setCurrentId(c.id); setSidebarOpen(false); } }}
                >
                  <div className={`w-6 h-6 shrink-0 rounded-md flex items-center justify-center bg-gradient-to-br ${SUBJECT_META[c.subject].color}`}>
                    <M className="w-3 h-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        ref={renameInputRef}
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); commitRename(); }
                          if (e.key === "Escape") { setEditingTitleId(null); setEditingTitle(""); }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full text-xs font-medium bg-transparent border border-primary/50 rounded px-1 py-0.5 outline-none text-foreground"
                      />
                    ) : (
                      <p className="text-xs font-medium truncate">{c.title}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground/70 truncate">
                      {c.subject} · {c.messages.length} msg
                    </p>
                  </div>
                  {!isEditing && (
                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); startRename(c); }}
                        className="p-1 hover:text-foreground"
                        aria-label="Rename chat"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteChat(c.id); }}
                        className="p-1 hover:text-red-500"
                        aria-label="Delete chat"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "flex" : "hidden"} md:flex w-72 border-r border-border bg-card/30 shrink-0 flex-col h-full`}>
        <div className="px-3 pt-3 pb-2 border-b border-border space-y-2">
          <Link href="/" className="flex items-center gap-2 px-1 py-1 rounded-md hover:bg-muted/40 transition-colors">
            <Logo size={20} />
            <span className="font-bold tracking-tight text-foreground text-xs">TREO TOOL&apos;S</span>
          </Link>
          <Button onClick={newChat} className="w-full gap-2" size="sm" data-testid="new-chat">
            <Plus className="w-4 h-4" /> New chat
          </Button>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={chatSearch}
              onChange={(e) => setChatSearch(e.target.value)}
              placeholder="Search chats"
              className="w-full bg-background/60 border border-border rounded-md pl-8 pr-2 py-1.5 text-xs outline-none focus:border-primary/60 focus:bg-background transition-colors"
            />
            {chatSearch && (
              <button
                onClick={() => setChatSearch("")}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
        <div className="overflow-y-auto flex-1 px-2 py-2">
          {filteredChats.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">
                {chatSearch ? "No matching chats." : "Your past chats will appear here."}
              </p>
            </div>
          ) : (
            <>
              {renderChatList("Today", grouped.today)}
              {renderChatList("Yesterday", grouped.yesterday)}
              {renderChatList("This week", grouped.thisWeek)}
              {renderChatList("Earlier", grouped.earlier)}
            </>
          )}
        </div>
        <div className="border-t border-border px-3 py-2 text-[10px] text-muted-foreground">
          {chats.length} chat{chats.length === 1 ? "" : "s"} · stored on this device
        </div>
      </aside>

      {/* Main column */}
      <div className="flex flex-col h-screen flex-1 min-w-0">
        {/* Top bar */}
        <div className="border-b border-border px-3 sm:px-4 py-2.5 flex items-center justify-between shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button className="md:hidden p-1.5 rounded-md hover:bg-muted shrink-0" onClick={() => setSidebarOpen((o) => !o)} aria-label="Menu">
              <MessageSquare className="w-4 h-4" />
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs text-foreground shrink-0"
              title="Back to Home"
              data-testid="link-back-home"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="font-semibold text-foreground text-sm truncate" data-testid="chat-title">
                {current?.title || "Study Assistant"}
              </h1>
              <p className="text-[11px] text-muted-foreground truncate">
                Type, speak, or upload an image — get focused, exam-ready answers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Subject popover */}
            <div className="relative" data-popover-root>
              <button
                onClick={() => { setSubjectMenuOpen((o) => !o); setModeMenuOpen(false); }}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium text-foreground"
                data-testid="subject-button"
              >
                <CurrentSubjectIcon className="w-3.5 h-3.5" />
                {subject}
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>
              {subjectMenuOpen && (
                <div className="absolute right-0 mt-1 w-64 max-h-80 overflow-y-auto bg-popover border border-border rounded-xl shadow-xl p-1.5 z-30">
                  {SUBJECTS.map((s) => {
                    const M = SUBJECT_META[s].icon;
                    return (
                      <button
                        key={s}
                        data-testid={`subject-${s}`}
                        onClick={() => { setSubject(s); setSubjectMenuOpen(false); }}
                        className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs transition-colors ${subject === s ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                      >
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center bg-gradient-to-br ${SUBJECT_META[s].color}`}>
                          <M className="w-3 h-3" />
                        </div>
                        <span className="font-medium">{s}</span>
                        {subject === s && <Check className="w-3 h-3 ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Mode popover */}
            <div className="relative" data-popover-root>
              <button
                onClick={() => { setModeMenuOpen((o) => !o); setSubjectMenuOpen(false); }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium text-foreground"
                data-testid="mode-button"
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span className="hidden sm:inline">{MODE_LABELS[mode].label}</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>
              {modeMenuOpen && (
                <div className="absolute right-0 mt-1 w-64 bg-popover border border-border rounded-xl shadow-xl p-1.5 z-30">
                  {(Object.keys(MODE_LABELS) as Mode[]).map((m) => (
                    <button
                      key={m}
                      data-testid={`mode-${m}`}
                      onClick={() => { setMode(m); setModeMenuOpen(false); }}
                      className={`w-full flex items-start gap-2 px-2.5 py-2 rounded-lg text-left text-xs transition-colors ${mode === m ? "bg-violet-500/15 text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{MODE_LABELS[m].label}</p>
                        <p className="text-[10px] text-muted-foreground/80">{MODE_LABELS[m].hint}</p>
                      </div>
                      {mode === m && <Check className="w-3 h-3 mt-0.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {current && current.messages.length > 0 && (
              <>
                <Button variant="ghost" size="sm" onClick={exportChat} className="gap-1.5 text-xs h-8 px-2" title="Export chat as Markdown">
                  <Download className="w-3.5 h-3.5" /><span className="hidden lg:inline">Export</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={newChat} className="gap-1.5 text-xs h-8 px-2" title="Start a new chat">
                  <RotateCcw className="w-3.5 h-3.5" /><span className="hidden lg:inline">New</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Message area */}
        <div ref={scrollAreaRef} className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 relative">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center gap-7 py-10">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-violet-500/20 flex items-center justify-center mx-auto shadow-lg shadow-primary/10">
                    <GraduationCap className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">How can I help you study?</h2>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Pick a subject below or jump right in. You can also speak your question or attach a problem photo.
                  </p>
                </div>

                {/* Subject grid */}
                <div className="w-full max-w-2xl">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-2 text-center">Choose a subject</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {SUBJECTS.map((s) => {
                      const M = SUBJECT_META[s].icon;
                      const active = subject === s;
                      return (
                        <button
                          key={s}
                          data-testid={`subject-card-${s}`}
                          onClick={() => setSubject(s)}
                          className={`group flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border transition-all ${
                            active
                              ? "border-primary/60 bg-primary/10 shadow-sm"
                              : "border-border bg-card hover:border-primary/30 hover:bg-muted/40"
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br ${SUBJECT_META[s].color}`}>
                            <M className="w-4 h-4" />
                          </div>
                          <span className="text-[11px] font-medium text-foreground">{s}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Suggestions for current subject */}
                <div className="w-full max-w-2xl">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-2 text-center">
                    Try a {subject} question
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {subjectSuggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        className="text-left px-3.5 py-2.5 rounded-xl border border-border bg-card hover:bg-muted hover:border-primary/30 transition-colors text-sm text-foreground"
                      >{s}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <MessageBubble
                key={i}
                msg={msg}
                onCopy={handleCopy}
                onRegenerate={regenerate}
                isLast={msg.role === "assistant" && i === messages.length - 1 && !loading}
              />
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
                <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Thinking…</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Floating scroll-to-bottom */}
          {showScrollDown && (
            <button
              onClick={() => {
                const el = scrollAreaRef.current;
                if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
                userNearBottomRef.current = true;
              }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-muted transition-colors"
              aria-label="Scroll to latest"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-border px-3 sm:px-4 py-3 shrink-0 bg-background">
          <div className="max-w-3xl mx-auto">
            {/* Quick action chips */}
            {!loading && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {QUICK_ACTIONS.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => applyQuickAction(q.prefix)}
                    className="px-2.5 py-1 rounded-full border border-border bg-card text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                    title={`Insert "${q.prefix}"`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            )}

            {pendingImage && (
              <div className="mb-2 relative inline-block">
                <img src={pendingImage.dataUrl} alt="preview" className="h-20 rounded-lg border border-border" />
                <button
                  onClick={() => setPendingImage(null)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center hover:bg-foreground/80"
                  aria-label="Remove image"
                ><X className="w-3 h-3" /></button>
              </div>
            )}

            <div
              onDragOver={onComposerDragOver}
              onDragLeave={onComposerDragLeave}
              onDrop={onComposerDrop}
              className={`relative rounded-2xl border bg-card/60 p-2 flex gap-2 items-end transition-colors ${
                isDragging ? "border-primary border-dashed bg-primary/5" : "border-border"
              }`}
            >
              {isDragging && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-2xl bg-primary/5">
                  <p className="text-xs font-medium text-primary">Drop image to attach</p>
                </div>
              )}
              <input
                ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImagePick(f); e.target.value = ""; }}
              />
              <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}
                disabled={loading || recording} className="shrink-0 h-10 w-10 rounded-xl" title="Attach an image">
                <ImageIcon className="w-4 h-4" />
              </Button>
              <Button variant={recording ? "destructive" : "ghost"} size="icon"
                onClick={recording ? stopRecording : startRecording}
                disabled={loading || transcribing} className="shrink-0 h-10 w-10 rounded-xl"
                title={recording ? "Stop recording" : "Record voice message"}>
                {transcribing ? <Loader2 className="w-4 h-4 animate-spin" />
                  : recording ? <Square className="w-4 h-4 fill-current" />
                  : <Mic className="w-4 h-4" />}
              </Button>
              <Textarea
                ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={recording ? "Recording… tap stop when done"
                  : transcribing ? "Transcribing…"
                  : `Ask anything about ${subject === "General" ? "your studies" : subject}…`}
                className="resize-none min-h-[44px] max-h-[160px] text-sm border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                rows={1} disabled={loading || recording || transcribing}
              />
              {loading ? (
                <Button onClick={stopGenerating} size="icon" variant="destructive"
                  className="shrink-0 h-10 w-10 rounded-xl" title="Stop generating">
                  <StopCircle className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={() => sendMessage()}
                  disabled={(!input.trim() && !pendingImage) || recording || transcribing}
                  size="icon" className="shrink-0 h-10 w-10 rounded-xl">
                  <Send className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between mt-2 px-1">
              <p className="text-[10px] text-muted-foreground">
                {recording ? "🔴 Recording in progress…"
                  : <>Press <kbd className="px-1 py-0.5 rounded bg-muted text-foreground text-[10px]">Enter</kbd> to send · <kbd className="px-1 py-0.5 rounded bg-muted text-foreground text-[10px]">Shift+Enter</kbd> for new line</>}
              </p>
              {charCount > 0 && (
                <p className="text-[10px] text-muted-foreground tabular-nums">{charCount} char{charCount === 1 ? "" : "s"}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
