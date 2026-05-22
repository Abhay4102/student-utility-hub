import { useState, useCallback, useEffect } from "react";
import { Delete, RotateCcw } from "lucide-react";

type HistoryEntry = { expr: string; result: string };
type AngleMode = "DEG" | "RAD";

function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) return NaN;
  if (n > 170) return Infinity;
  if (n === 0 || n === 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function buildEvaluator(angleMode: AngleMode) {
  const toRad = angleMode === "DEG" ? "(Math.PI/180)*" : "";
  const fromRad = angleMode === "DEG" ? "(180/Math.PI)*" : "";
  return (expr: string): string => {
    try {
      let e = expr
        .replace(/π/g, `(${Math.PI})`)
        .replace(/(?<![a-zA-Z])e(?![a-zA-Z0-9])/g, `(${Math.E})`)
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/−/g, "-")
        .replace(/(?<![a-zA-Z])asin\(/g, `${fromRad}__M.asin(`)
        .replace(/(?<![a-zA-Z])acos\(/g, `${fromRad}__M.acos(`)
        .replace(/(?<![a-zA-Z])atan\(/g, `${fromRad}__M.atan(`)
        .replace(/(?<![a-zA-Z])sinh\(/g, "__M.sinh(")
        .replace(/(?<![a-zA-Z])cosh\(/g, "__M.cosh(")
        .replace(/(?<![a-zA-Z])tanh\(/g, "__M.tanh(")
        .replace(/(?<![a-zA-Z])sin\(/g, `__M.sin(${toRad}`)
        .replace(/(?<![a-zA-Z])cos\(/g, `__M.cos(${toRad}`)
        .replace(/(?<![a-zA-Z])tan\(/g, `__M.tan(${toRad}`)
        .replace(/∛\(/g, "__M.cbrt(")
        .replace(/√\(/g, "__M.sqrt(")
        .replace(/(?<![a-zA-Z])log\(/g, "__M.log10(")
        .replace(/(?<![a-zA-Z])ln\(/g, "__M.log(")
        .replace(/(?<![a-zA-Z])exp\(/g, "__M.exp(")
        .replace(/(?<![a-zA-Z])abs\(/g, "__M.abs(")
        .replace(/(?<![a-zA-Z])mod(?![a-zA-Z])/g, "%")
        .replace(/\^/g, "**")
        .replace(/(\d+(?:\.\d+)?)!/g, (_m, n) => String(factorial(Number(n))))
        .replace(/__M\./g, "Math.");
      // eslint-disable-next-line no-new-func
      const result = new Function(`"use strict"; return (${e})`)();
      if (typeof result !== "number" || !isFinite(result)) return "Error";
      return parseFloat(result.toPrecision(12)).toString();
    } catch {
      return "Error";
    }
  };
}

const HISTORY_KEY = "treo-calc-sci-history";

const mainRows: string[][] = [
  ["C", "⌫", "(", ")"],
  ["7", "8", "9", "÷"],
  ["4", "5", "6", "×"],
  ["1", "2", "3", "−"],
  ["0", ".", "±", "+"],
];

const sciRows: string[][] = [
  ["sin(", "cos(", "tan(", "π", "e"],
  ["asin(", "acos(", "atan(", "^", "!"],
  ["sinh(", "cosh(", "tanh(", "log(", "ln("],
  ["√(", "∛(", "exp(", "abs(", "%"],
];

export default function ScientificPanel() {
  const [expr, setExpr] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [angleMode, setAngleMode] = useState<AngleMode>("DEG");
  const [memory, setMemory] = useState(0);
  const [showInverse, setShowInverse] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      // ignore quota
    }
  }, [history]);

  const evaluate = buildEvaluator(angleMode);

  const press = useCallback((key: string) => {
    if (key === "C") { setExpr(""); setJustEvaluated(false); return; }
    if (key === "⌫") { setExpr((e) => e.slice(0, -1)); setJustEvaluated(false); return; }
    if (key === "=") {
      if (!expr) return;
      const result = evaluate(expr);
      if (result !== "Error") {
        setHistory((h) => [{ expr, result }, ...h].slice(0, 30));
      }
      setExpr(result);
      setJustEvaluated(true);
      return;
    }
    if (key === "±") {
      setExpr((e) => {
        if (!e) return "-";
        if (e.startsWith("-(") && e.endsWith(")")) return e.slice(2, -1);
        return `-(${e})`;
      });
      setJustEvaluated(false);
      return;
    }
    if (justEvaluated && /^[0-9.]/.test(key)) {
      setExpr(key === "." ? "0." : key);
      setJustEvaluated(false);
      return;
    }
    const insert = key === "×" ? "*" : key === "÷" ? "/" : key === "−" ? "-" : key;
    setExpr((e) => e + insert);
    setJustEvaluated(false);
  }, [expr, justEvaluated, evaluate]);

  useEffect(() => {
    const handler = (ev: KeyboardEvent) => {
      const target = ev.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const k = ev.key;
      if (/^[0-9.+\-*/()%^]$/.test(k)) { ev.preventDefault(); press(k); return; }
      if (k === "Enter" || k === "=") { ev.preventDefault(); press("="); return; }
      if (k === "Backspace") { ev.preventDefault(); press("⌫"); return; }
      if (k === "Escape") { ev.preventDefault(); press("C"); return; }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [press]);

  const memoryAction = (action: "MC" | "MR" | "M+" | "M-" | "MS") => {
    const current = parseFloat(evaluate(expr || "0"));
    if (action === "MC") setMemory(0);
    if (action === "MR") { setExpr(String(memory)); setJustEvaluated(true); }
    if (action === "M+" && !isNaN(current)) setMemory((m) => m + current);
    if (action === "M-" && !isNaN(current)) setMemory((m) => m - current);
    if (action === "MS" && !isNaN(current)) setMemory(current);
  };

  const btnClass = (key: string) => {
    if (key === "=") return "bg-primary text-primary-foreground hover:bg-primary/90 h-14 rounded-xl font-bold text-lg transition-all active:scale-95";
    if (["÷", "×", "−", "+", "%", "^"].includes(key)) return "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/60 h-14 rounded-xl font-semibold text-lg transition-all active:scale-95";
    if (key === "C") return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60 h-14 rounded-xl font-semibold text-lg transition-all active:scale-95";
    if (key === "⌫") return "bg-muted text-muted-foreground hover:bg-muted/70 h-14 rounded-xl font-semibold text-lg transition-all active:scale-95";
    return "bg-card border border-border text-foreground hover:bg-muted h-14 rounded-xl font-medium text-lg transition-all active:scale-95 shadow-xs";
  };

  const livePreview = expr && !justEvaluated ? evaluate(expr) : "";

  const displayedSci = sciRows.map((row) =>
    row.map((key) => {
      if (!showInverse) return key;
      if (key === "sin(") return "asin(";
      if (key === "cos(") return "acos(";
      if (key === "tan(") return "atan(";
      if (key === "asin(") return "sin(";
      if (key === "acos(") return "cos(";
      if (key === "atan(") return "tan(";
      if (key === "√(") return "x²";
      if (key === "∛(") return "x³";
      if (key === "log(") return "10^";
      if (key === "ln(") return "e^";
      return key;
    })
  );

  const pressSci = (label: string) => {
    if (label === "x²") return press("^2");
    if (label === "x³") return press("^3");
    if (label === "10^") return press("10^");
    if (label === "e^") return press("exp(");
    press(label);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-card border border-card-border rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            {(["DEG", "RAD"] as const).map((m) => (
              <button
                key={m}
                data-testid={`angle-${m}`}
                onClick={() => setAngleMode(m)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${angleMode === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
              >{m}</button>
            ))}
            <button
              data-testid="toggle-inv"
              onClick={() => setShowInverse((s) => !s)}
              className={`ml-2 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${showInverse ? "bg-violet-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
            >INV</button>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {memory !== 0 && <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">M</span>}
            {(["MC", "MR", "M+", "M-", "MS"] as const).map((a) => (
              <button
                key={a}
                data-testid={`mem-${a}`}
                onClick={() => memoryAction(a)}
                className="px-2 py-1 rounded-md text-xs font-semibold bg-muted text-foreground hover:bg-muted/70 transition-colors"
              >{a}</button>
            ))}
          </div>
        </div>

        <div className="bg-muted/50 rounded-xl p-4 mb-4 min-h-[96px] flex flex-col items-end justify-end">
          <p className="text-foreground text-2xl font-mono font-semibold min-h-[2rem] break-all text-right">{expr || "0"}</p>
          {livePreview && livePreview !== expr && livePreview !== "Error" && (
            <p className="text-muted-foreground text-sm font-mono mt-1">= {livePreview}</p>
          )}
        </div>

        <div className="grid grid-cols-5 gap-2 mb-3">
          {displayedSci.flat().map((key, i) => (
            <button
              key={i}
              data-testid={`sci-${key}`}
              onClick={() => pressSci(key)}
              className="bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/50 h-10 rounded-lg text-sm font-semibold transition-all active:scale-95"
            >
              {key === "√(" ? "√" : key === "∛(" ? "∛" : key === "^" ? "xⁿ" : key}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-2 mb-2">
          {mainRows.flat().map((key, i) => (
            <button
              key={i}
              data-testid={`calc-btn-${key}`}
              onClick={() => press(key)}
              className={btnClass(key)}
            >
              {key === "⌫" ? <Delete className="w-5 h-5 mx-auto" /> : key}
            </button>
          ))}
        </div>
        <button
          data-testid="calc-equals"
          onClick={() => press("=")}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-14 rounded-xl font-bold text-lg transition-all active:scale-95"
        >=</button>
      </div>

      <div className="bg-card border border-card-border rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-foreground">History</h3>
          {history.length > 0 && (
            <button
              data-testid="clear-history"
              onClick={() => setHistory([])}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No calculations yet</p>
        ) : (
          <div className="space-y-2 max-h-[520px] overflow-y-auto">
            {history.map((h, i) => (
              <button
                key={i}
                data-testid={`history-entry-${i}`}
                onClick={() => { setExpr(h.result); setJustEvaluated(true); }}
                className="w-full text-left p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <p className="text-xs text-muted-foreground font-mono truncate">{h.expr}</p>
                <p className="text-sm font-semibold text-foreground font-mono">= {h.result}</p>
              </button>
            ))}
          </div>
        )}
        <p className="text-[10px] text-muted-foreground mt-4 leading-relaxed">
          Keyboard: digits, + − × ÷, ( ), Enter to evaluate, Backspace, Esc to clear.
        </p>
      </div>
    </div>
  );
}
