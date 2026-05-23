import { useCallback, useRef, useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Wand2, Loader2, Copy, Check, Sparkles, StopCircle, ArrowLeftRight, RotateCcw, Download,
} from "lucide-react";
import { toast } from "sonner";

type Tone = "academic" | "simple" | "fluent" | "formal" | "creative" | "shorten" | "expand";
type Strength = "light" | "medium" | "heavy";

const TONES: Array<{ id: Tone; label: string; hint: string }> = [
  { id: "fluent",   label: "Fluent",   hint: "Smooth, natural, fixes grammar" },
  { id: "academic", label: "Academic", hint: "Formal essay / research style" },
  { id: "simple",   label: "Simple",   hint: "Plain English, easy to read" },
  { id: "formal",   label: "Formal",   hint: "Business / official tone" },
  { id: "creative", label: "Creative", hint: "Vivid, engaging vocabulary" },
  { id: "shorten",  label: "Shorten",  hint: "Cut to ~half the length" },
  { id: "expand",   label: "Expand",   hint: "Add detail, ~1.5x length" },
];

const STRENGTHS: Array<{ id: Strength; label: string }> = [
  { id: "light",  label: "Light" },
  { id: "medium", label: "Medium" },
  { id: "heavy",  label: "Heavy" },
];

const MAX_CHARS = 12000;

function wordCount(s: string) {
  const t = s.trim();
  return t ? t.split(/\s+/).length : 0;
}

export default function Paraphraser() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [tone, setTone] = useState<Tone>("fluent");
  const [strength, setStrength] = useState<Strength>("medium");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async () => {
    const t = input.trim();
    if (!t) { toast.error("Please enter some text"); return; }
    if (t.length > MAX_CHARS) { toast.error(`Maximum ${MAX_CHARS.toLocaleString()} characters`); return; }

    setLoading(true);
    setOutput("");
    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/ai/paraphrase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({ text: t, tone, strength }),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to paraphrase");
      }

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
          if (data.content) { full += data.content; setOutput(full); }
        }
      }
      if (streamError) throw new Error(streamError);
    } catch (err) {
      if ((err as Error).name === "AbortError") toast.message("Stopped");
      else toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [input, tone, strength]);

  const stop = () => abortRef.current?.abort();

  const swap = () => {
    if (!output) return;
    setInput(output);
    setOutput("");
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    if (!output) return;
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "paraphrased.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    if (loading) abortRef.current?.abort();
    setInput(""); setOutput("");
  };

  return (
    <ToolLayout
      title="AI Paraphraser"
      description="Rewrite any text to be unique, plagiarism-safe and natural — academic, simple, formal or creative tone"
      category="AI"
      categoryHref="/?cat=AI"
      icon={<Wand2 className="w-6 h-6" />}
      iconBg="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400"
    >
      {/* Controls */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4 space-y-4">
        <div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Tone</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TONES.map((t) => (
              <button
                key={t.id}
                data-testid={`tone-${t.id}`}
                onClick={() => setTone(t.id)}
                className={`text-left px-3 py-2 rounded-lg border transition-all ${
                  tone === t.id
                    ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                    : "border-border bg-card hover:bg-muted/50"
                }`}
              >
                <p className="text-sm font-semibold text-foreground">{t.label}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">{t.hint}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Rewrite strength</p>
          <div className="flex flex-wrap gap-1.5">
            {STRENGTHS.map((s) => (
              <button
                key={s.id}
                data-testid={`strength-${s.id}`}
                onClick={() => setStrength(s.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  strength === s.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >{s.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* I/O panels */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
            <span className="text-xs font-semibold text-muted-foreground">Original</span>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {wordCount(input)} words · {input.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
            </span>
          </div>
          <Textarea
            data-testid="input-text"
            placeholder="Paste your assignment, essay, paragraph or any text you want rewritten…"
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
            disabled={loading}
            rows={14}
            className="resize-y min-h-[260px] border-0 rounded-none focus-visible:ring-0 font-mono text-sm"
          />
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30 gap-2">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              Paraphrased {loading && <Loader2 className="w-3 h-3 animate-spin" />}
            </span>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => copy(output)} disabled={!output || loading} className="h-7 gap-1.5">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-xs">Copy</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={download} disabled={!output || loading} className="h-7 gap-1.5">
                <Download className="w-3.5 h-3.5" /><span className="text-xs">.txt</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={swap} disabled={!output || loading} className="h-7 gap-1.5" title="Use this as new input">
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          <div
            data-testid="output-text"
            className="flex-1 p-3 min-h-[260px] whitespace-pre-wrap font-mono text-sm overflow-y-auto"
          >
            {output || <span className="text-muted-foreground italic">Your rewritten text will appear here…</span>}
          </div>
          {output && (
            <div className="px-3 py-1.5 border-t border-border bg-muted/20 text-[11px] text-muted-foreground tabular-nums text-right">
              {wordCount(output)} words · {output.length.toLocaleString()} characters
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        {loading ? (
          <Button onClick={stop} size="lg" variant="destructive" className="flex-1 gap-2" data-testid="stop-button">
            <StopCircle className="w-4 h-4" /> Stop
          </Button>
        ) : (
          <Button onClick={run} disabled={!input.trim()} size="lg" className="flex-1 gap-2" data-testid="paraphrase-button">
            <Sparkles className="w-4 h-4" /> Paraphrase
          </Button>
        )}
        <Button onClick={reset} variant="outline" size="lg" className="gap-2" data-testid="reset-button">
          <RotateCcw className="w-4 h-4" /> Reset
        </Button>
      </div>

      {/* Tips */}
      <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/30 p-4">
        <p className="text-xs sm:text-sm font-bold text-foreground mb-2">💡 How to use this for assignments</p>
        <ul className="text-[11px] sm:text-xs text-muted-foreground space-y-1 leading-relaxed list-disc pl-4">
          <li>Write your draft first, then paste it here and pick <b>Academic + Medium</b> for essays.</li>
          <li>For text written by ChatGPT, choose <b>Heavy</b> rewrite to make it sound more human.</li>
          <li>Use <b>Shorten</b> if your word count is over the limit; <b>Expand</b> if you need more length.</li>
          <li>Always read the output before submitting — check facts, names, numbers and citations are correct.</li>
          <li>The tool keeps your meaning intact but changes words and sentence structure — it does NOT invent new facts.</li>
        </ul>
      </div>
    </ToolLayout>
  );
}
