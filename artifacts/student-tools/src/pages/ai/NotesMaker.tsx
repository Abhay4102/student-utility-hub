import { useState, useRef, useEffect } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NotebookPen, Loader2, Download, Copy, Check, Sparkles, FileText } from "lucide-react";
import { toast } from "sonner";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

function renderMarkdown(md: string): React.ReactNode[] {
  const lines = md.split("\n");
  const out: React.ReactNode[] = [];
  let key = 0;

  for (const raw of lines) {
    const line = raw.replace(/\r$/, "");
    if (!line.trim()) {
      out.push(<div key={key++} className="h-2" />);
      continue;
    }
    if (line.startsWith("# ")) {
      out.push(<h1 key={key++} className="text-2xl font-bold text-foreground mt-4 mb-3">{line.slice(2)}</h1>);
      continue;
    }
    if (line.startsWith("## ")) {
      out.push(<h2 key={key++} className="text-xl font-semibold text-foreground mt-5 mb-2 pb-1 border-b border-border">{line.slice(3)}</h2>);
      continue;
    }
    if (line.startsWith("### ")) {
      out.push(<h3 key={key++} className="text-base font-semibold text-foreground mt-3 mb-1">{line.slice(4)}</h3>);
      continue;
    }
    const bulletMatch = line.match(/^[\s]*[-•*]\s+(.*)$/);
    if (bulletMatch) {
      out.push(
        <div key={key++} className="flex gap-2 ml-2 my-1">
          <span className="text-primary mt-0.5">•</span>
          <span className="flex-1">{renderInline(bulletMatch[1])}</span>
        </div>
      );
      continue;
    }
    const numMatch = line.match(/^[\s]*(\d+)\.\s+(.*)$/);
    if (numMatch) {
      out.push(
        <div key={key++} className="flex gap-2 ml-2 my-1">
          <span className="text-primary font-medium shrink-0">{numMatch[1]}.</span>
          <span className="flex-1">{renderInline(numMatch[2])}</span>
        </div>
      );
      continue;
    }
    out.push(<p key={key++} className="my-1 leading-relaxed">{renderInline(line)}</p>);
  }
  return out;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i} className="font-semibold text-foreground">{p.slice(2, -2)}</strong>;
    if (p.startsWith("*") && p.endsWith("*") && p.length > 2) return <em key={i} className="italic">{p.slice(1, -1)}</em>;
    return <span key={i}>{p}</span>;
  });
}

const SUGGESTIONS = [
  "Photosynthesis (Class 10 Biology)",
  "Newton's Laws of Motion",
  "World War II — causes and consequences",
  "Trigonometric identities",
  "The French Revolution",
  "Cell division: mitosis vs meiosis",
];

export default function NotesMaker() {
  const [topic, setTopic] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [tab, setTab] = useState<"topic" | "source">("topic");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const notesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading) notesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [notes, loading]);

  const generate = async (overrideTopic?: string) => {
    const t = (overrideTopic ?? topic).trim();
    const s = sourceText.trim();
    if (tab === "topic" && !t) {
      toast.error("Please enter a topic");
      return;
    }
    if (tab === "source" && !s) {
      toast.error("Please paste some source text");
      return;
    }

    setLoading(true);
    setNotes("");

    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/ai/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: tab === "topic" ? t : topic.trim() || undefined,
          sourceText: tab === "source" ? s : undefined,
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
          try {
            data = JSON.parse(line.slice(6));
          } catch {
            continue;
          }
          if (!data) continue;
          if (data.error) { streamError = data.error; done = true; break; }
          if (data.done) { done = true; break; }
          if (data.content) {
            full += data.content;
            setNotes(full);
          }
        }
      }
      if (streamError) throw new Error(streamError);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate notes");
    } finally {
      setLoading(false);
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
      if (!line.trim()) {
        paragraphs.push(new Paragraph({ children: [new TextRun("")] }));
        continue;
      }
      if (line.startsWith("# ")) {
        paragraphs.push(new Paragraph({ text: line.slice(2), heading: HeadingLevel.HEADING_1 }));
      } else if (line.startsWith("## ")) {
        paragraphs.push(new Paragraph({ text: line.slice(3), heading: HeadingLevel.HEADING_2 }));
      } else if (line.startsWith("### ")) {
        paragraphs.push(new Paragraph({ text: line.slice(4), heading: HeadingLevel.HEADING_3 }));
      } else {
        // strip markdown bold/italic markers for plain text fallback
        const clean = line.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1");
        paragraphs.push(new Paragraph({ children: [new TextRun({ text: clean, size: 22 })] }));
      }
    }
    const doc = new Document({ sections: [{ children: paragraphs }] });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(topic || "notes").replace(/[^\w-]/g, "_")}.docx`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Notes downloaded");
  };

  return (
    <ToolLayout
      title="AI Notes Maker"
      description="Generate clean, structured study notes from any topic or source text"
      category="AI"
      categoryHref="/?cat=AI"
      icon={<NotebookPen className="w-6 h-6" />}
      iconBg="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400"
    >
      <div className="flex gap-2 mb-4">
        <Button variant={tab === "topic" ? "default" : "outline"} onClick={() => setTab("topic")} className="flex-1">
          From a topic
        </Button>
        <Button variant={tab === "source" ? "default" : "outline"} onClick={() => setTab("source")} className="flex-1">
          From source text
        </Button>
      </div>

      {tab === "topic" ? (
        <div className="space-y-3">
          <Input
            placeholder="e.g. Photosynthesis, Newton's Laws, French Revolution…"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && generate()}
            disabled={loading}
          />
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => { setTopic(s); generate(s); }}
                disabled={loading}
                className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/70 border border-border text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
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
          <Textarea
            placeholder="Paste your textbook content, lecture transcript, or any study material here…"
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            disabled={loading}
            rows={6}
            className="resize-y min-h-[120px]"
          />
        </div>
      )}

      <Button
        onClick={() => generate()}
        disabled={loading}
        size="lg"
        className="w-full mt-4 gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating notes…
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate Notes
          </>
        )}
      </Button>

      {notes && (
        <div className="mt-6 bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>Your Study Notes</span>
              {loading && <Loader2 className="w-3 h-3 animate-spin" />}
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={copyNotes} disabled={loading} className="gap-1.5 h-8">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-xs">{copied ? "Copied" : "Copy"}</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={downloadDocx} disabled={loading} className="gap-1.5 h-8">
                <Download className="w-3.5 h-3.5" />
                <span className="text-xs">.docx</span>
              </Button>
            </div>
          </div>
          <div className="p-5 text-sm text-foreground max-h-[600px] overflow-y-auto">
            {renderMarkdown(notes)}
            <div ref={notesEndRef} />
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
