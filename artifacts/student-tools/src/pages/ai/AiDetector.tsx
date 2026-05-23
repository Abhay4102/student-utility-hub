import { useCallback, useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ScanSearch, Loader2, Sparkles, RotateCcw, AlertTriangle, CheckCircle2, Brain, User, Lightbulb,
  BarChart3, Bot, FlaskConical, Highlighter,
} from "lucide-react";
import { toast } from "sonner";

interface Signal { label: string; weight: "human" | "ai"; detail: string }
interface SentenceScore { text: string; aiScore: number }
interface DetectorStats {
  totalWords: number;
  totalSentences: number;
  avgSentenceLength: number;
  sentenceLengthStdDev: number;
  burstiness: number;
  typeTokenRatio: number;
  aiClicheCount: number;
  aiClicheMatches: string[];
  emDashesPer100Words: number;
  semicolonCount: number;
  repeatedTrigrams: number;
  repeatedSentenceOpeners: number;
  paragraphCount: number;
}
interface DetectResult {
  aiProbability: number;
  modelProbability: number;
  statsScore: number;
  verdict: string;
  confidence: "low" | "medium" | "high";
  summary: string;
  signals: Signal[];
  sentenceAnalysis: SentenceScore[];
  suspiciousSentences: string[];
  humanizeTips: string[];
  stats: DetectorStats;
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

function sentenceHighlight(score: number): string {
  if (score >= 80) return "bg-red-200 dark:bg-red-900/50 text-red-950 dark:text-red-100 border-l-2 border-red-500";
  if (score >= 60) return "bg-orange-200 dark:bg-orange-900/40 text-orange-950 dark:text-orange-100 border-l-2 border-orange-500";
  if (score >= 40) return "bg-amber-100 dark:bg-amber-900/30 text-amber-950 dark:text-amber-100 border-l-2 border-amber-400";
  if (score >= 20) return "bg-lime-100 dark:bg-lime-900/30 text-lime-950 dark:text-lime-100 border-l-2 border-lime-400";
  return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-950 dark:text-emerald-100 border-l-2 border-emerald-500";
}

/* Compact metric rendering */
interface MetricVerdict { tag: string; tone: "good" | "neutral" | "bad" }
function metricInterpret(key: string, v: number, stats: DetectorStats): MetricVerdict {
  switch (key) {
    case "burstiness":
      if (stats.totalSentences < 4) return { tag: "n/a", tone: "neutral" };
      if (v < 0.3) return { tag: "uniform → AI-like", tone: "bad" };
      if (v < 0.45) return { tag: "low variation", tone: "bad" };
      if (v > 0.7) return { tag: "varied → human-like", tone: "good" };
      return { tag: "moderate", tone: "neutral" };
    case "ttr":
      if (stats.totalWords < 200) return { tag: "n/a (need more text)", tone: "neutral" };
      if (v < 0.35) return { tag: "low diversity → AI-like", tone: "bad" };
      if (v > 0.55) return { tag: "rich vocabulary", tone: "good" };
      return { tag: "average", tone: "neutral" };
    case "cliches":
      if (v === 0) return { tag: "clean — no AI tells", tone: "good" };
      if (v <= 2) return { tag: "few", tone: "neutral" };
      if (v <= 5) return { tag: "several AI tells", tone: "bad" };
      return { tag: "heavy AI vocabulary", tone: "bad" };
    case "emdash":
      if (v > 1.5) return { tag: "ChatGPT signature", tone: "bad" };
      if (v > 0.8) return { tag: "elevated", tone: "bad" };
      return { tag: "normal", tone: "good" };
    case "openers":
      if (stats.totalSentences < 5) return { tag: "n/a", tone: "neutral" };
      if (v / stats.totalSentences > 0.5) return { tag: "repetitive structure", tone: "bad" };
      return { tag: "varied", tone: "good" };
    default:
      return { tag: "", tone: "neutral" };
  }
}

function toneStyle(t: MetricVerdict["tone"]): string {
  if (t === "good") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
  if (t === "bad") return "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300";
  return "bg-muted text-muted-foreground";
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
      title="Advanced AI Content Detector"
      description="Ensemble detector — combines statistical analysis (burstiness, vocabulary, AI clichés) with deep AI reasoning for a calibrated score"
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
          placeholder="Paste an essay, assignment paragraph, or any text (minimum 80 characters, ideally 150+ words for accurate detection)…"
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
          {loading ? "Running 2-pass analysis…" : "Detect AI Content"}
        </Button>
        <Button onClick={reset} variant="outline" size="lg" className="gap-2" data-testid="reset-button">
          <RotateCcw className="w-4 h-4" /> Reset
        </Button>
      </div>

      {/* Result */}
      {result && colors && (
        <div className="mt-6 space-y-4" data-testid="detector-result">
          {/* Final score card */}
          <div className={`rounded-2xl border p-4 sm:p-6 ${colors.soft}`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
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
                <div className="mt-3 h-2 rounded-full bg-foreground/10 overflow-hidden">
                  <div className={`h-full ${colors.bg} transition-all`} style={{ width: `${result.aiProbability}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-semibold">
                  <span>Human</span><span>Mixed</span><span>AI</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ensemble breakdown: stats vs model */}
          <div className="grid sm:grid-cols-2 gap-3">
            <ScoreCard
              title="Statistical analysis"
              icon={<FlaskConical className="w-4 h-4" />}
              score={result.statsScore}
              hint="Burstiness, vocabulary, AI clichés, em-dash density"
            />
            <ScoreCard
              title="AI judgement"
              icon={<Bot className="w-4 h-4" />}
              score={result.modelProbability}
              hint="GPT-5.1 forensic reading of style & voice"
            />
          </div>

          {/* Per-sentence highlighting */}
          {result.sentenceAnalysis && result.sentenceAnalysis.length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Highlighter className="w-4 h-4 text-primary" />
                  <h4 className="font-bold text-sm">Sentence-by-sentence breakdown</h4>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide">
                  <Legend color="bg-emerald-500" label="Human" />
                  <Legend color="bg-lime-400" label="" />
                  <Legend color="bg-amber-400" label="Mixed" />
                  <Legend color="bg-orange-500" label="" />
                  <Legend color="bg-red-500" label="AI" />
                </div>
              </div>
              <div className="p-3 space-y-1.5">
                {result.sentenceAnalysis.map((s, i) => (
                  <div key={i} className={`px-3 py-2 rounded-md text-sm leading-relaxed ${sentenceHighlight(s.aiScore)}`}>
                    <span className="font-mono text-[10px] font-bold opacity-60 mr-2 tabular-nums">{s.aiScore}%</span>
                    {s.text}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Statistics card */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h4 className="font-bold text-sm">Measured statistics</h4>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
              <Metric label="Word count" value={result.stats.totalWords.toString()} />
              <Metric label="Sentences" value={result.stats.totalSentences.toString()} />
              <Metric label="Avg sentence length" value={`${result.stats.avgSentenceLength} words`} />
              <Metric label="Burstiness" value={result.stats.burstiness.toFixed(2)} verdict={metricInterpret("burstiness", result.stats.burstiness, result.stats)} />
              <Metric label="Vocabulary diversity" value={result.stats.typeTokenRatio.toFixed(3)} verdict={metricInterpret("ttr", result.stats.typeTokenRatio, result.stats)} />
              <Metric label="AI clichés found" value={result.stats.aiClicheCount.toString()} verdict={metricInterpret("cliches", result.stats.aiClicheCount, result.stats)} />
              <Metric label="Em-dashes / 100 words" value={result.stats.emDashesPer100Words.toFixed(2)} verdict={metricInterpret("emdash", result.stats.emDashesPer100Words, result.stats)} />
              <Metric label="Repeated openers" value={result.stats.repeatedSentenceOpeners.toString()} verdict={metricInterpret("openers", result.stats.repeatedSentenceOpeners, result.stats)} />
              <Metric label="Repeated 3-grams" value={result.stats.repeatedTrigrams.toString()} />
            </div>
            {result.stats.aiClicheMatches.length > 0 && (
              <div className="px-4 py-3 border-t border-border bg-muted/20">
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">AI cliché phrases detected</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.stats.aiClicheMatches.map((c, i) => (
                    <span key={i} className="text-[11px] font-mono px-2 py-0.5 rounded bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200 dark:border-orange-900">
                      “{c}”
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Signals */}
          {result.signals.length > 0 && (
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
          )}

          {/* Humanize tips */}
          {result.humanizeTips.length > 0 && (
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

      {/* Methodology */}
      <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/30 p-4">
        <p className="text-xs sm:text-sm font-bold text-foreground mb-2">🧪 How this detector works</p>
        <ol className="text-[11px] sm:text-xs text-muted-foreground space-y-1 leading-relaxed list-decimal pl-4">
          <li><b>Statistical pass</b> — we compute burstiness (sentence-length variation), vocabulary diversity, AI-cliché density, em-dash overuse and structural repetition. These metrics produce a numerical AI score.</li>
          <li><b>AI forensic pass</b> — GPT-5.1 reads the same text plus the stats, and gives its own independent probability based on voice, personal experience, hallucinations and writing register.</li>
          <li><b>Ensemble blend</b> — the final score is a weighted blend (AI judgement 60% + statistical 40%). Confidence rises when both methods agree, falls when they disagree.</li>
        </ol>
      </div>

      {/* Disclaimer */}
      <div className="mt-3 rounded-xl border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-4">
        <p className="text-xs sm:text-sm font-bold text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4" /> Honest disclaimer
        </p>
        <p className="text-[11px] sm:text-xs text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
          No AI detector — including Turnitin, GPTZero or this tool — is 100% accurate. Non-native English writers, formal academic prose, and very short or translated text can produce false positives. Use the result as guidance, not as proof. Never submit work you didn't write yourself.
        </p>
      </div>
    </ToolLayout>
  );
}

/* -------- subcomponents -------- */

function ScoreCard({ title, icon, score, hint }: { title: string; icon: React.ReactNode; score: number; hint: string }) {
  const c = verdictColor(score);
  return (
    <div className={`rounded-xl border p-3 ${c.soft}`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-foreground/70">
          {icon} {title}
        </div>
        <span className={`text-xl font-black tabular-nums ${c.text}`}>{score}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-foreground/10 overflow-hidden">
        <div className={`h-full ${c.bg}`} style={{ width: `${score}%` }} />
      </div>
      <p className="text-[10px] text-muted-foreground mt-1.5 leading-snug">{hint}</p>
    </div>
  );
}

function Metric({ label, value, verdict }: { label: string; value: string; verdict?: MetricVerdict }) {
  return (
    <div className="bg-card p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-base font-bold text-foreground tabular-nums mt-0.5">{value}</p>
      {verdict && verdict.tag && (
        <span className={`inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${toneStyle(verdict.tone)}`}>
          {verdict.tag}
        </span>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`inline-block w-2.5 h-2.5 rounded-sm ${color}`} />
      {label && <span className="text-muted-foreground">{label}</span>}
    </span>
  );
}
