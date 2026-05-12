import { useState, useCallback } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { Calculator as CalcIcon, Delete, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type HistoryEntry = { expr: string; result: string };

const buttons = [
  ["C", "⌫", "%", "/"],
  ["7", "8", "9", "*"],
  ["4", "5", "6", "-"],
  ["1", "2", "3", "+"],
  ["0", ".", "=", ""],
];

const scientificButtons = ["sin(", "cos(", "tan(", "√(", "log(", "ln(", "π", "e", "(", ")", "^", "!"];

function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) return NaN;
  if (n === 0 || n === 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function evaluate(expr: string): string {
  try {
    let e = expr
      .replace(/π/g, String(Math.PI))
      .replace(/e(?![0-9])/g, String(Math.E))
      .replace(/sin\(/g, "Math.sin(")
      .replace(/cos\(/g, "Math.cos(")
      .replace(/tan\(/g, "Math.tan(")
      .replace(/√\(/g, "Math.sqrt(")
      .replace(/log\(/g, "Math.log10(")
      .replace(/ln\(/g, "Math.log(")
      .replace(/\^/g, "**")
      .replace(/(\d+)!/g, (_m: string, n: string) => String(factorial(Number(n))));
    // eslint-disable-next-line no-new-func
    const result = new Function(`return (${e})`)();
    if (typeof result !== "number" || !isFinite(result)) return "Error";
    return parseFloat(result.toFixed(10)).toString();
  } catch {
    return "Error";
  }
}

export default function Calculator() {
  const [expr, setExpr] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [justEvaluated, setJustEvaluated] = useState(false);

  const press = useCallback((key: string) => {
    if (key === "C") {
      setExpr("");
      setJustEvaluated(false);
      return;
    }
    if (key === "⌫") {
      setExpr((e) => e.slice(0, -1));
      setJustEvaluated(false);
      return;
    }
    if (key === "=") {
      if (!expr) return;
      const result = evaluate(expr);
      setHistory((h) => [{ expr, result }, ...h].slice(0, 15));
      setExpr(result);
      setJustEvaluated(true);
      return;
    }
    if (justEvaluated && !isNaN(Number(key)) && key !== ".") {
      setExpr(key);
      setJustEvaluated(false);
      return;
    }
    setExpr((e) => e + key);
    setJustEvaluated(false);
  }, [expr, justEvaluated]);

  const btnClass = (key: string) => {
    if (key === "=") return "col-span-1 bg-primary text-primary-foreground hover:bg-primary/90 h-14 rounded-xl font-bold text-lg transition-all active:scale-95";
    if (["/", "*", "-", "+", "%"].includes(key)) return "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/60 h-14 rounded-xl font-semibold text-lg transition-all active:scale-95";
    if (key === "C") return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60 h-14 rounded-xl font-semibold text-lg transition-all active:scale-95";
    if (key === "⌫") return "bg-muted text-muted-foreground hover:bg-muted/70 h-14 rounded-xl font-semibold text-lg transition-all active:scale-95";
    return "bg-card border border-border text-foreground hover:bg-muted h-14 rounded-xl font-medium text-lg transition-all active:scale-95 shadow-xs";
  };

  return (
    <ToolLayout
      title="Calculator"
      description="Scientific calculator with calculation history"
      category="Utilities"
      categoryHref="/"
      icon={<CalcIcon className="w-6 h-6 text-amber-700 dark:text-amber-400" />}
      iconBg="bg-amber-100 dark:bg-amber-900/40"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-card-border rounded-2xl p-4 shadow-sm">
          <div className="bg-muted/50 rounded-xl p-4 mb-4 min-h-[80px] flex flex-col items-end justify-end">
            <p className="text-muted-foreground text-sm font-mono min-h-[1.25rem] break-all text-right">{expr || "0"}</p>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-3">
            {buttons.map((row, ri) =>
              row.map((key, ki) =>
                key === "" ? (
                  <div key={`${ri}-${ki}`} />
                ) : (
                  <button
                    key={`${ri}-${ki}`}
                    data-testid={`calc-btn-${key}`}
                    onClick={() => press(key)}
                    className={btnClass(key)}
                  >
                    {key === "⌫" ? <Delete className="w-5 h-5 mx-auto" /> : key}
                  </button>
                )
              )
            )}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {scientificButtons.map((key) => (
              <button
                key={key}
                data-testid={`calc-sci-${key}`}
                onClick={() => press(key)}
                className="bg-accent text-accent-foreground hover:bg-accent/80 h-10 rounded-lg text-sm font-medium transition-all active:scale-95"
              >
                {key === "√(" ? "√" : key === "^" ? "xⁿ" : key}
              </button>
            ))}
          </div>
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
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {history.map((h, i) => (
                <button
                  key={i}
                  data-testid={`history-entry-${i}`}
                  onClick={() => { setExpr(h.result); setJustEvaluated(true); }}
                  className="w-full text-left p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <p className="text-xs text-muted-foreground font-mono truncate">{h.expr}</p>
                  <p className="text-sm font-semibold text-foreground font-mono">{h.result}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
