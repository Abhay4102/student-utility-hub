import { useCallback, useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ScanSearch, Loader2, Sparkles, RotateCcw, AlertTriangle, CheckCircle2, Brain, User, Lightbulb,
} from "lucide-react";
import { toast } from "sonner";

interface Signal { label: string; weight: "human" | "ai"; detail: string }
interface DetectResult {
  aiProbability: number;
  verdict: string;
  confidence: "low" | "medium" | "high";
  summary: string;
  signals: Signal[];
  suspiciousSentences: string[];
  humanizeTips: string[];
}

const MIN_CHARS = 80;
const MAX_CHARS = 15000;

function wordCount(s: string) { const t = s.trim(); return t ? t.split(/\s+/).length : 0; }

function verdictColor(prob: number) {
  if (prob <= 25) return { ring: "ring-emerald-500", bg: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", soft: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800" };
  if (prob <= 45) return { ring: "ring-lime-500", bg: "bg-lime-500", text: "text-lime-600 dark:text-lime-400", soft: "bg-lime-50 dark:bg-lime-950/40 border-lime-200 dark:border-lime-800" };
  if (prob <= 60) return { ring: "ring-amber-500", bg: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", soft: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800" };
  if (prob <= 80) return { ring: "ring-orange-500", bg: "bg-orange-500", text: "text-orange-600 dark:text-orange-400", soft: "bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800" };
  return { ring: "ring-red-500", bg: "bg-red-500", text: "text-red-600 dark:text-red-400", soft: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800" };
}

export default function AiDetector() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DetectResult | null>(null);

  const run = useCallback(async () => {
    const t = input.trim();
    if (t.length < MIN_CHARS) { toast.error(`Please enter at least ${MIN_CHARS} characters`); return; }
    if (t.length > MAX_CHARS) { toast.error(`Maximum ${MAX_CHARS.toLocaleString()} characters`); return; }

    setLoading(true); setResult(null);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/ai/detect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: t }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to analyse");
      setResult(data as DetectResult);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [input]);

  const reset = () => { setInput(""); setResult(null); };

  const colors = result ? verdictColor(result.aiProbability) : null;

  return (
    <ToolLayout
      title="AI Content Detector"
      description="Check whether a piece of text was written by ChatGPT, Gemini, Claude or another AI — with a probability score, signals and humanise tips"
      category="AI"
      categoryHref="/?cat=AI"
      icon={<ScanSearch className="w-6 h-6" />}
      iconBg="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400"
    >
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
          <span className="text-xs font-semibold text-muted-foreground">Paste text to analyse</span>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {wordCount(input)} words · {input.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
          </span>
        </div>
        <Textarea
          data-testid="detector-input"
          placeholder="Paste an essay, assignment paragraph, or any text (minimum 80 characters)…"
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
          disabled={loading}
          rows={10}
          className="resize-y min-h-[200px] border-0 rounded-none focus-visible:ring-0 font-mono text-sm"
        />
      </div>

      <div className="flex gap-2 mt-4">
        <Button onClick={run} disabled={loading || input.trim().length < MIN_CHARS} size="lg" className="flex-1 gap-2" data-testid="analyse-button">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? "Analysing…" : "Detect AI Content"}
        </Button>
        <Button onClick={reset} variant="outline" size="lg" className="gap-2" data-testid="reset-button">
          <RotateCcw className="w-4 h-4" /> Reset
        </Button>
      </div>

      {/* Result */}
      {result && colors && (
        <div className="mt-6 space-y-4" data-testid="detector-result">
          {/* Score card */}
          <div className={`rounded-2xl border p-4 sm:p-6 ${colors.soft}`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              {/* Big % */}
              <div className="relative shrink-0">
                <div className={`w-28 h-28 rounded-full border-8 ${colors.ring.replace("ring-", "border-")} flex flex-col items-center justify-center bg-background`}>
                  <span className={`text-4xl font-black tabular-nums ${colors.text}`}>{result.aiProbability}<span className="text-xl">%</span></span>
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold">AI Likely</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className={`text-xl sm:text-2xl font-black ${colors.text}`}>{result.verdict}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-foreground/10 text-foreground/70">
                    Confidence: {result.confidence}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">{result.summary}</p>
                {/* Bar */}
                <div className="mt-3 h-2 rounded-full bg-foreground/10 overflow-hidden">
                  <div className={`h-full ${colors.bg} transition-all`} style={{ width: `${result.aiProbability}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-semibold">
                  <span>Human</span><span>Mixed</span><span>AI</span>
                </div>
              </div>
            </div>
          </div>

          {/* Signals */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              <h4 className="font-bold text-sm">Linguistic signals</h4>
            </div>
            <ul className="divide-y divide-border">
              {result.signals.map((s, i) => (
                <li key={i} className="px-4 py-3 flex items-start gap-3">
                  {s.weight === "ai"
                    ? <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    : <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {s.label}
                      <span className={`ml-2 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                        s.weight === "ai"
                          ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      }`}>{s.weight === "ai" ? "AI-like" : "Human-like"}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Suspicious sentences */}
          {result.suspiciousSentences && result.suspiciousSentences.length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <h4 className="font-bold text-sm">Most AI-like sentences</h4>
              </div>
              <ul className="p-3 space-y-2">
                {result.suspiciousSentences.map((s, i) => (
                  <li key={i} className="text-sm italic px-3 py-2 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 text-orange-900 dark:text-orange-200">
                    “{s}”
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Humanize tips */}
          {result.humanizeTips && result.humanizeTips.length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <h4 className="font-bold text-sm">How to make this sound more human</h4>
              </div>
              <ul className="p-3 space-y-1.5">
                {result.humanizeTips.map((t, i) => (
                  <li key={i} className="text-sm flex gap-2"><User className="w-4 h-4 text-primary shrink-0 mt-0.5" /><span className="text-foreground/90">{t}</span></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-6 rounded-xl border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-4">
        <p className="text-xs sm:text-sm font-bold text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4" /> Honest disclaimer
        </p>
        <p className="text-[11px] sm:text-xs text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
          No AI detector — including Turnitin, GPTZero or this tool — is 100% accurate. Results are an estimate based on linguistic patterns. Short, technical, or translated text can produce false positives. Always use the result as guidance, not as proof. Never submit work you didn't write yourself.
        </p>
      </div>
    </ToolLayout>
  );
}
