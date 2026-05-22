import { useState, useRef, useEffect, useCallback } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  NotebookPen, Loader2, Download, Copy, Check, Sparkles, FileText, Upload, X,
  StopCircle, Library, Trash2, ListChecks,
} from "lucide-react";
import { toast } from "sonner";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

type NotesFormat = "outline" | "cornell" | "bullets" | "flashcards" | "mindmap" | "summary";
type NotesDetail = "brief" | "standard" | "detailed" | "exam";

const FORMAT_OPTIONS: Array<{ id: NotesFormat; label: string; hint: string }> = [
  { id: "outline", label: "Outline", hint: "Hierarchical sections + bullets" },
  { id: "bullets", label: "Bullet Summary", hint: "Scannable, key terms first" },
  { id: "cornell", label: "Cornell", hint: "Cues + notes + summary" },
  { id: "flashcards", label: "Flashcards", hint: "Q & A for active recall" },
  { id: "mindmap", label: "Mind Map", hint: "Text-based branch structure" },
  { id: "summary", label: "Summary", hint: "Tight paragraph + key points" },
];

const DETAIL_OPTIONS: Array<{ id: NotesDetail; label: string }> = [
  { id: "brief", label: "Brief" },
  { id: "standard", label: "Standard" },
  { id: "detailed", label: "Detailed" },
  { id: "exam", label: "Exam Prep" },
];

const SUBJECTS = ["General", "Math", "Physics", "Chemistry", "Biology", "Computer Science", "History", "Geography", "Literature", "Economics", "Languages", "Psychology"];
const LEVELS = ["Any", "Class 6-8", "Class 9-10", "Class 11-12", "Undergraduate", "Postgraduate"];

const SUGGESTIONS = [
  "Photosynthesis (Class 10 Biology)",
  "Newton's Laws of Motion",
  "World War II — causes and consequences",
  "Trigonometric identities",
  "The French Revolution",
  "Cell division: mitosis vs meiosis",
];

interface SavedNote {
  id: string;
  title: string;
  content: string;
  format: NotesFormat;
  subject: string;
  level: string;
  detail: NotesDetail;
  createdAt: number;
}

const NOTES_KEY = "treo-saved-notes";
const PREFS_KEY = "treo-notes-prefs";

function loadSaved(): SavedNote[] {
  try { return JSON.parse(localStorage.getItem(NOTES_KEY) || "[]"); } catch { return []; }
}
function saveSaved(s: SavedNote[]) {
  try { localStorage.setItem(NOTES_KEY, JSON.stringify(s)); } catch { /* quota */ }
}
function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
  } catch { return {}; }
}
function savePrefs(p: { format: NotesFormat; detail: NotesDetail; subject: string; level: string; includeQuestions: boolean }) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch { /* quota */ }
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i} className="font-semibold text-foreground">{p.slice(2, -2)}</strong>;
    if (p.startsWith("*") && p.endsWith("*") && p.length > 2) return <em key={i} className="italic">{p.slice(1, -1)}</em>;
    if (p.startsWith("`") && p.endsWith("`") && p.length > 2)
      return <code key={i} className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">{p.slice(1, -1)}</code>;
    return <span key={i}>{p}</span>;
  });
}

function renderMarkdown(md: string): React.ReactNode[] {
  const lines = md.split("\n");
  const out: React.ReactNode[] = [];
  let key = 0;
  let inCode = false;
  let codeBuf: string[] = [];
  const flushCode = () => {
    if (codeBuf.length) {
      out.push(<pre key={key++} className="my-2 p-3 rounded-lg bg-muted border border-border overflow-x-auto text-xs font-mono whitespace-pre">{codeBuf.join("\n")}</pre>);
      codeBuf = [];
    }
  };
  for (const raw of lines) {
    const line = raw.replace(/\r$/, "");
    if (line.startsWith("```")) { if (inCode) flushCode(); inCode = !inCode; continue; }
    if (inCode) { codeBuf.push(line); continue; }
    if (!line.trim()) { out.push(<div key={key++} className="h-2" />); continue; }
    if (line.startsWith("# ")) { out.push(<h1 key={key++} className="text-2xl font-bold text-foreground mt-4 mb-3">{line.slice(2)}</h1>); continue; }
    if (line.startsWith("## ")) { out.push(<h2 key={key++} className="text-xl font-semibold text-foreground mt-5 mb-2 pb-1 border-b border-border">{line.slice(3)}</h2>); continue; }
    if (line.startsWith("### ")) { out.push(<h3 key={key++} className="text-base font-semibold text-foreground mt-3 mb-1">{line.slice(4)}</h3>); continue; }
    const b = line.match(/^[\s]*[-•*]\s+(.*)$/);
    if (b) { out.push(<div key={key++} className="flex gap-2 ml-2 my-1"><span className="text-primary mt-0.5">•</span><span className="flex-1">{renderInline(b[1])}</span></div>); continue; }
    const n = line.match(/^[\s]*(\d+)\.\s+(.*)$/);
    if (n) { out.push(<div key={key++} className="flex gap-2 ml-2 my-1"><span className="text-primary font-medium shrink-0">{n[1]}.</span><span className="flex-1">{renderInline(n[2])}</span></div>); continue; }
    out.push(<p key={key++} className="my-1 leading-relaxed">{renderInline(line)}</p>);
  }
  flushCode();
  return out;
}

async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".txt") || name.endsWith(".md")) {
    return await file.text();
  }
  if (name.endsWith(".pdf")) {
    const pdfjs = await import("pdfjs-dist");
    const worker = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
    pdfjs.GlobalWorkerOptions.workerSrc = worker;
    const buf = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: buf }).promise;
    const chunks: string[] = [];
    const maxPages = Math.min(pdf.numPages, 40);
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const text = content.items.map((it: any) => (it.str || "")).join(" ");
      chunks.push(text);
    }
    return chunks.join("\n\n");
  }
  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const buf = await file.arrayBuffer();
    const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
    return value;
  }
  throw new Error("Unsupported file type. Use .txt, .md, .pdf or .docx");
}

export default function NotesMaker() {
  const initial = loadPrefs();
  const [topic, setTopic] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [sourceFileName, setSourceFileName] = useState<string | null>(null);
  const [tab, setTab] = useState<"topic" | "source">("topic");
  const [format, setFormat] = useState<NotesFormat>(initial.format || "outline");
  const [detail, setDetail] = useState<NotesDetail>(initial.detail || "standard");
  const [subject, setSubject] = useState<string>(initial.subject || "General");
  const [level, setLevel] = useState<string>(initial.level || "Any");
  const [includeQuestions, setIncludeQuestions] = useState<boolean>(initial.includeQuestions ?? false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [saved, setSaved] = useState<SavedNote[]>(() => loadSaved());
  const [libraryOpen, setLibraryOpen] = useState(false);

  const notesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { if (loading) notesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [notes, loading]);
  useEffect(() => { savePrefs({ format, detail, subject, level, includeQuestions }); }, [format, detail, subject, level, includeQuestions]);
  useEffect(() => { saveSaved(saved); }, [saved]);

  const generate = useCallback(async (overrideTopic?: string) => {
    const t = (overrideTopic ?? topic).trim();
    const s = sourceText.trim();
    if (tab === "topic" && !t) { toast.error("Please enter a topic"); return; }
    if (tab === "source" && !s) { toast.error("Please paste or upload source text"); return; }

    setLoading(true);
    setNotes("");
    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/ai/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          topic: tab === "topic" ? t : topic.trim() || undefined,
          sourceText: tab === "source" ? s : undefined,
          format, detail, subject, level, includeQuestions,
        }),
      });

      if (!res.ok || !res.body) throw new Error("Failed to generate notes");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";
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
          if (data.content) { full += data.content; setNotes(full); }
        }
      }
      if (streamError) throw new Error(streamError);
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        toast.message("Generation stopped");
      } else {
        toast.error(err instanceof Error ? err.message : "Failed to generate notes");
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [topic, sourceText, tab, format, detail, subject, level, includeQuestions]);

  const stop = () => abortRef.current?.abort();

  const handleFileUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { toast.error("File must be under 10 MB"); return; }
    setExtracting(true);
    try {
      const text = await extractTextFromFile(file);
      if (!text.trim()) throw new Error("No text extracted from file");
      setSourceText(text.slice(0, 50000));
      setSourceFileName(file.name);
      setTab("source");
      toast.success(`Loaded ${file.name} (${text.length.toLocaleString()} chars)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to read file");
    } finally {
      setExtracting(false);
    }
  };

  const copyNotes = () => {
    navigator.clipboard.writeText(notes);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadDocx = async () => {
    if (!notes) return;
    const paragraphs: Paragraph[] = [];
    const lines = notes.split("\n");
    for (const raw of lines) {
      const line = raw.replace(/\r$/, "");
      if (!line.trim()) { paragraphs.push(new Paragraph({ children: [new TextRun("")] })); continue; }
      if (line.startsWith("# ")) { paragraphs.push(new Paragraph({ text: line.slice(2), heading: HeadingLevel.HEADING_1 })); }
      else if (line.startsWith("## ")) { paragraphs.push(new Paragraph({ text: line.slice(3), heading: HeadingLevel.HEADING_2 })); }
      else if (line.startsWith("### ")) { paragraphs.push(new Paragraph({ text: line.slice(4), heading: HeadingLevel.HEADING_3 })); }
      else {
        const clean = line.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1");
        paragraphs.push(new Paragraph({ children: [new TextRun({ text: clean, size: 22 })] }));
      }
    }
    const doc = new Document({ sections: [{ children: paragraphs }] });
    const blob = await Packer.toBlob(doc);
    triggerDownload(blob, `${safeName(topic)}.docx`);
    toast.success("Downloaded .docx");
  };

  const downloadMarkdown = () => {
    if (!notes) return;
    const blob = new Blob([notes], { type: "text/markdown" });
    triggerDownload(blob, `${safeName(topic)}.md`);
    toast.success("Downloaded .md");
  };

  const saveToLibrary = () => {
    if (!notes) return;
    const title = topic.trim() || (notes.match(/^#\s+(.+)$/m)?.[1] ?? "Untitled notes").trim();
    const item: SavedNote = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title, content: notes, format, subject, level, detail,
      createdAt: Date.now(),
    };
    setSaved((s) => [item, ...s]);
    toast.success("Saved to library");
  };

  const loadFromLibrary = (id: string) => {
    const item = saved.find((s) => s.id === id);
    if (!item) return;
    setNotes(item.content);
    setTopic(item.title);
    setFormat(item.format);
    setDetail(item.detail);
    setSubject(item.subject);
    setLevel(item.level);
    setLibraryOpen(false);
  };

  const deleteFromLibrary = (id: string) => {
    setSaved((s) => s.filter((x) => x.id !== id));
  };

  const sortedSaved = [...saved].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <ToolLayout
      title="AI Notes Maker"
      description="Generate revision-ready notes — pick a format, detail level, and even upload your textbook PDF"
      category="AI"
      categoryHref="/?cat=AI"
      icon={<NotebookPen className="w-6 h-6" />}
      iconBg="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400"
    >
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex gap-2 flex-1 min-w-0">
          <Button variant={tab === "topic" ? "default" : "outline"} onClick={() => setTab("topic")} className="flex-1" data-testid="tab-topic">
            From a topic
          </Button>
          <Button variant={tab === "source" ? "default" : "outline"} onClick={() => setTab("source")} className="flex-1" data-testid="tab-source">
            From source text
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={() => setLibraryOpen((o) => !o)} className="gap-1.5" data-testid="library-toggle">
          <Library className="w-4 h-4" />
          Library {saved.length > 0 && <span className="text-xs bg-primary/10 text-primary px-1.5 rounded">{saved.length}</span>}
        </Button>
      </div>

      {libraryOpen && (
        <div className="mb-4 bg-card border border-border rounded-xl p-3">
          <h3 className="text-sm font-semibold text-foreground mb-2">Saved notes</h3>
          {sortedSaved.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No saved notes yet. Generate notes and click "Save" to build your library.</p>
          ) : (
            <ul className="space-y-1.5 max-h-60 overflow-y-auto">
              {sortedSaved.map((s) => (
                <li key={s.id} className="group flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <button onClick={() => loadFromLibrary(s.id)} className="flex-1 text-left min-w-0" data-testid={`load-${s.id}`}>
                    <p className="text-sm font-medium text-foreground truncate">{s.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {s.format} · {s.detail} · {s.subject} · {new Date(s.createdAt).toLocaleDateString()}
                    </p>
                  </button>
                  <button onClick={() => deleteFromLibrary(s.id)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-red-500 transition-all" aria-label="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "topic" ? (
        <div className="space-y-3">
          <Input
            placeholder="e.g. Photosynthesis, Newton's Laws, French Revolution…"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && generate()}
            disabled={loading}
            data-testid="topic-input"
          />
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => { setTopic(s); generate(s); }} disabled={loading}
                className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/70 border border-border text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Input
            placeholder="Optional: topic name for the notes"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={loading}
          />
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef} type="file" accept=".txt,.md,.pdf,.docx" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ""; }}
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={loading || extracting} className="gap-2" data-testid="upload-file">
              {extracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {extracting ? "Extracting…" : "Upload PDF / DOCX / TXT"}
            </Button>
            {sourceFileName && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                <FileText className="w-3 h-3" />
                <span className="truncate max-w-[200px]">{sourceFileName}</span>
                <button onClick={() => { setSourceFileName(null); setSourceText(""); }} className="hover:text-foreground">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
          <Textarea
            placeholder="…or paste your textbook content, lecture transcript, or any study material here"
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            disabled={loading || extracting}
            rows={6}
            className="resize-y min-h-[120px] font-mono text-xs"
          />
          <p className="text-[11px] text-muted-foreground text-right">
            {sourceText.length.toLocaleString()} / 50,000 characters
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="mt-5 bg-card border border-border rounded-xl p-4 space-y-4">
        <div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Format</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {FORMAT_OPTIONS.map((f) => (
              <button
                key={f.id}
                data-testid={`format-${f.id}`}
                onClick={() => setFormat(f.id)}
                className={`text-left px-3 py-2 rounded-lg border transition-all ${
                  format === f.id
                    ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                    : "border-border bg-card hover:bg-muted/50"
                }`}
              >
                <p className="text-sm font-semibold text-foreground">{f.label}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">{f.hint}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Detail level</p>
            <div className="flex flex-wrap gap-1">
              {DETAIL_OPTIONS.map((d) => (
                <button
                  key={d.id}
                  data-testid={`detail-${d.id}`}
                  onClick={() => setDetail(d.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${detail === d.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
                >{d.label}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Subject</p>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="h-9" data-testid="subject-select"><SelectValue /></SelectTrigger>
              <SelectContent>{SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Level</p>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="h-9" data-testid="level-select"><SelectValue /></SelectTrigger>
              <SelectContent>{LEVELS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeQuestions}
            onChange={(e) => setIncludeQuestions(e.target.checked)}
            className="w-4 h-4 accent-primary"
            data-testid="include-questions"
          />
          <ListChecks className="w-4 h-4 text-primary" />
          <span className="text-sm text-foreground">Also include practice questions + answers</span>
        </label>
      </div>

      <div className="flex gap-2 mt-4">
        {loading ? (
          <Button onClick={stop} size="lg" variant="destructive" className="flex-1 gap-2" data-testid="stop-button">
            <StopCircle className="w-4 h-4" /> Stop generating
          </Button>
        ) : (
          <Button onClick={() => generate()} disabled={loading} size="lg" className="flex-1 gap-2" data-testid="generate-button">
            <Sparkles className="w-4 h-4" /> Generate Notes
          </Button>
        )}
      </div>

      {notes && (
        <div className="mt-6 bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30 gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
              <FileText className="w-4 h-4 shrink-0" />
              <span className="truncate">{topic || "Your Study Notes"}</span>
              {loading && <Loader2 className="w-3 h-3 animate-spin shrink-0" />}
            </div>
            <div className="flex gap-1 flex-wrap">
              <Button variant="ghost" size="sm" onClick={saveToLibrary} disabled={loading} className="gap-1.5 h-8" data-testid="save-button">
                <Library className="w-3.5 h-3.5" /><span className="text-xs">Save</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={copyNotes} disabled={loading} className="gap-1.5 h-8">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-xs">{copied ? "Copied" : "Copy"}</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={downloadMarkdown} disabled={loading} className="gap-1.5 h-8">
                <Download className="w-3.5 h-3.5" /><span className="text-xs">.md</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={downloadDocx} disabled={loading} className="gap-1.5 h-8">
                <Download className="w-3.5 h-3.5" /><span className="text-xs">.docx</span>
              </Button>
            </div>
          </div>
          <div className="p-5 text-sm text-foreground max-h-[700px] overflow-y-auto">
            {renderMarkdown(notes)}
            <div ref={notesEndRef} />
          </div>
        </div>
      )}
    </ToolLayout>
  );
}

function safeName(s: string): string {
  return (s || "notes").replace(/[^\w-]+/g, "_").slice(0, 80) || "notes";
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
