import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Youtube, Loader2, Sparkles, Copy, Check, Download, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

type Format = "concise" | "detailed" | "bullets" | "study";

const FORMATS: Record<Format, { label: string; hint: string }> = {
  concise: { label: "TL;DR", hint: "Quick 5-bullet summary + main takeaway" },
  detailed: { label: "Detailed Notes", hint: "Full structured notes with headings & examples" },
  bullets: { label: "Key Points", hint: "Bullet-pointed highlights only" },
  study: { label: "Study Mode", hint: "Notes + flashcards + key terms for revision" },
};

function extractVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  // Try as URL
  try {
    const u = new URL(trimmed);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1).split(/[?&#]/)[0] || null;
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/")[2] || null;
      if (u.pathname.startsWith("/embed/")) return u.pathname.split("/")[2] || null;
    }
  } catch { /* not a URL */ }
  // Bare 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  return null;
}

function renderMarkdown(md: string): string {
  // Lightweight inline + block markdown renderer (no deps).
  const escaped = md
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let html = escaped;
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-base font-bold mt-4 mb-2 text-foreground">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-5 mb-2 text-foreground">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-6 mb-3 text-foreground">$1</h1>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-muted rounded text-xs">$1</code>');
  // Bullet lists
  html = html.replace(/^(- .+(?:\n- .+)*)/gm, (m) => {
    const items = m.split("\n").map((l) => `<li class="ml-1">${l.replace(/^- /, "")}</li>`).join("");
    return `<ul class="list-disc pl-6 my-2 space-y-1 text-foreground">${items}</ul>`;
  });
  // Numbered lists
  html = html.replace(/^(\d+\. .+(?:\n\d+\. .+)*)/gm, (m) => {
    const items = m.split("\n").map((l) => `<li class="ml-1">${l.replace(/^\d+\. /, "")}</li>`).join("");
    return `<ol class="list-decimal pl-6 my-2 space-y-1 text-foreground">${items}</ol>`;
  });
  // Paragraphs (treat blank lines as separators)
  html = html.split(/\n\n+/).map((block) => {
    if (block.startsWith("<")) return block;
    return `<p class="my-2 text-foreground leading-relaxed">${block.replace(/\n/g, "<br />")}</p>`;
  }).join("\n");
  return html;
}

export default function YoutubeSummarizer() {
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState<Format>("detailed");
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [meta, setMeta] = useState<{ title?: string; videoId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const videoId = useMemo(() => extractVideoId(url), [url]);

  // Cancel any in-flight stream on unmount.
  useEffect(() => () => abortRef.current?.abort(), []);
  const thumb = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;

  const summarize = useCallback(async () => {
    setError(null);
    setOutput("");
    setMeta(null);
    if (!videoId) {
      setError("Please paste a valid YouTube URL or video ID.");
      return;
    }
    setLoading(true);
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const res = await fetch("/api/ai/youtube-summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, format, language }),
        signal: ac.signal,
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Request failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.meta) setMeta({ title: evt.meta.title, videoId });
            if (evt.content) setOutput((prev) => prev + evt.content);
            if (evt.error) throw new Error(evt.error);
          } catch (e) {
            if (e instanceof Error && e.message) throw e;
          }
        }
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError((e as Error).message || "Failed to summarize video.");
    } finally {
      setLoading(false);
    }
  }, [videoId, format, language]);

  const stop = () => { abortRef.current?.abort(); setLoading(false); };

  const copy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
    toast.success("Copied to clipboard");
  };

  const download = () => {
    if (!output) return;
    const header = meta?.title ? `# ${meta.title}\n\nSource: https://www.youtube.com/watch?v=${meta.videoId}\n\n---\n\n` : "";
    const blob = new Blob([header + output], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${meta?.title?.replace(/[^a-z0-9]+/gi, "-").slice(0, 50) || "summary"}.md`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 500);
  };

  return (
    <ToolLayout
      title="AI YouTube Summarizer"
      description="Paste any YouTube URL and get an instant AI-powered summary, notes, or flashcards. Saves hours of watch time."
      category="AI"
      categoryHref="/?category=AI"
      icon={<Youtube className="w-5 h-5" />}
      iconBg="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400"
    >
      <div className="space-y-4">
        {/* Input */}
        <div className="rounded-xl border border-card-border bg-card p-4 space-y-3">
          <div>
            <Label htmlFor="yt-url">YouTube URL or Video ID</Label>
            <Input
              id="yt-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
              onKeyDown={(e) => { if (e.key === "Enter" && !loading) summarize(); }}
            />
          </div>

          {videoId && thumb && (
            <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
              <img src={thumb} alt="Video thumbnail" className="w-20 h-12 rounded object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Video ID</p>
                <p className="text-sm font-mono truncate text-foreground">{videoId}</p>
              </div>
            </div>
          )}

          <div>
            <Label className="mb-1.5 block">Output style</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(FORMATS) as Format[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`p-2.5 rounded-lg border text-sm text-left transition-all ${
                    format === f
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-card-border hover:border-primary/30 text-foreground"
                  }`}
                >
                  <div className="font-medium text-xs sm:text-sm">{FORMATS[f].label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">{FORMATS[f].hint}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="lang">Output language</Label>
            <Input id="lang" value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="English, Hindi, Spanish…" />
          </div>

          <div className="flex gap-2">
            <Button onClick={summarize} disabled={!videoId || loading} className="flex-1">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Summarizing…</> : <><Sparkles className="w-4 h-4 mr-2" /> Summarize</>}
            </Button>
            {loading && <Button variant="outline" onClick={stop}>Stop</Button>}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Output */}
        {(output || loading) && (
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">
                {meta?.title ? meta.title : "Summary"}
              </h3>
              {output && !loading && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={copy}>
                    {copied ? <Check className="w-4 h-4 mr-1.5 text-emerald-500" /> : <Copy className="w-4 h-4 mr-1.5" />}
                    Copy
                  </Button>
                  <Button size="sm" variant="outline" onClick={download}>
                    <Download className="w-4 h-4 mr-1.5" /> .md
                  </Button>
                </div>
              )}
            </div>
            {output ? (
              <div className="prose prose-sm dark:prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: renderMarkdown(output) }} />
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Fetching transcript and generating summary…
              </div>
            )}
          </div>
        )}

        {!output && !loading && !error && (
          <div className="rounded-xl border border-card-border bg-muted/20 p-6 text-center">
            <Youtube className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Paste a YouTube link above to get an AI summary in seconds. Works best on videos with captions.</p>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
