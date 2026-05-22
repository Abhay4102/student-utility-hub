import { useState, useMemo, Fragment } from "react";
import { Delete } from "lucide-react";

type Base = "HEX" | "DEC" | "OCT" | "BIN";
type BitWidth = 8 | 16 | 32 | 64;

const bases: Record<Base, number> = { HEX: 16, DEC: 10, OCT: 8, BIN: 2 };
const bitWidths: BitWidth[] = [8, 16, 32, 64];

function maskFor(bits: BitWidth): bigint {
  return (1n << BigInt(bits)) - 1n;
}
function toUnsigned(n: bigint, bits: BitWidth): bigint {
  const mask = maskFor(bits);
  return ((n % (mask + 1n)) + (mask + 1n)) & mask;
}

const allowedChars: Record<Base, RegExp> = {
  HEX: /^[0-9A-Fa-f]$/,
  DEC: /^[0-9]$/,
  OCT: /^[0-7]$/,
  BIN: /^[01]$/,
};

function tryParse(input: string, base: Base): bigint | null {
  if (!input) return 0n;
  try {
    const prefix = base === "HEX" ? "0x" : base === "OCT" ? "0o" : base === "BIN" ? "0b" : "";
    const neg = input.startsWith("-");
    const body = neg ? input.slice(1) : input;
    if (!body) return null;
    const v = BigInt(prefix + body);
    return neg ? -v : v;
  } catch {
    return null;
  }
}

function formatBase(n: bigint, base: Base): string {
  const neg = n < 0n;
  const abs = neg ? -n : n;
  const s = abs.toString(bases[base]).toUpperCase();
  return neg ? "-" + s : s;
}

export default function ProgrammerPanel() {
  const [base, setBase] = useState<Base>("DEC");
  const [bits, setBits] = useState<BitWidth>(64);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<{ value: bigint; op: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const value = useMemo(() => tryParse(input, base), [input, base]);

  const switchBase = (b: Base) => {
    if (value !== null && input) {
      setInput(formatBase(value, b));
    }
    setBase(b);
  };

  const append = (k: string) => {
    if (k === "-" && !input) { setInput("-"); return; }
    if (!allowedChars[base].test(k)) return;
    setInput((s) => s + k);
  };

  const clear = () => { setInput(""); setPending(null); setError(null); };
  const backspace = () => { setInput((s) => s.slice(0, -1)); setError(null); };

  const safeCompute = (a: bigint, b: bigint, op: string): bigint | null => {
    try {
      const mask = maskFor(bits);
      switch (op) {
        case "+": return (a + b) & mask;
        case "-": return toUnsigned(a - b, bits);
        case "×": return (a * b) & mask;
        case "÷": if (b === 0n) { setError("Division by zero"); return null; } return a / b;
        case "MOD": if (b === 0n) { setError("Modulo by zero"); return null; } return a % b;
        case "AND": return (a & b) & mask;
        case "OR": return (a | b) & mask;
        case "XOR": return (a ^ b) & mask;
        case "<<": {
          if (b < 0n) { setError("Shift count must be ≥ 0"); return null; }
          if (b >= BigInt(bits)) return 0n;
          return (a << b) & mask;
        }
        case ">>": {
          if (b < 0n) { setError("Shift count must be ≥ 0"); return null; }
          if (b >= BigInt(bits)) return 0n;
          return a >> b;
        }
        default: return b;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Compute error");
      return null;
    }
  };

  const applyOp = (op: string) => {
    if (value === null) return;
    setError(null);
    const v = toUnsigned(value, bits);
    if (pending) {
      const result = safeCompute(pending.value, v, pending.op);
      if (result === null) { setInput(""); return; }
      setPending({ value: result, op });
      setInput("");
    } else {
      setPending({ value: v, op });
      setInput("");
    }
  };

  const equals = () => {
    if (!pending || value === null) return;
    setError(null);
    const result = safeCompute(pending.value, toUnsigned(value, bits), pending.op);
    if (result === null) return;
    setInput(formatBase(result, base));
    setPending(null);
  };

  const unary = (op: "NOT" | "NEG") => {
    if (value === null) return;
    setError(null);
    const v = toUnsigned(value, bits);
    const r = op === "NOT" ? (~v) & maskFor(bits) : toUnsigned(-v, bits);
    setInput(formatBase(r, base));
  };

  const displayedValue = value;
  const isValid = value !== null;

  const hexDigits = ["A", "B", "C", "D", "E", "F"];

  const opBtn = "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/60 h-12 rounded-xl font-semibold transition-all active:scale-95";
  const bitBtn = "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/60 h-12 rounded-xl font-semibold text-sm transition-all active:scale-95";
  const numBtn = (disabled: boolean) => `bg-card border border-border text-foreground h-12 rounded-xl font-medium transition-all ${disabled ? "opacity-30 cursor-not-allowed" : "hover:bg-muted active:scale-95"}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-card border border-card-border rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-1">
            {(Object.keys(bases) as Base[]).map((b) => (
              <button
                key={b}
                data-testid={`base-${b}`}
                onClick={() => switchBase(b)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${base === b ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
              >{b}</button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground font-semibold mr-1">BITS</span>
            {bitWidths.map((bw) => (
              <button
                key={bw}
                data-testid={`bits-${bw}`}
                onClick={() => setBits(bw)}
                className={`px-2 py-1 rounded-md text-xs font-bold transition-colors ${bits === bw ? "bg-violet-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
              >{bw}</button>
            ))}
          </div>
        </div>
        {error && (
          <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded-md mb-2">{error}</div>
        )}

        <div className="bg-muted/50 rounded-xl p-4 mb-4">
          <p className="text-foreground text-2xl font-mono font-semibold text-right break-all min-h-[2rem]">
            {input || "0"}{!isValid && input && <span className="text-red-500 text-sm ml-2">invalid</span>}
          </p>
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 mt-3 text-xs font-mono">
            {(Object.keys(bases) as Base[]).map((b) => (
              <Fragment key={b}>
                <span className={`font-bold ${b === base ? "text-primary" : "text-muted-foreground"}`}>{b}</span>
                <span className="text-foreground break-all text-right">
                  {displayedValue !== null ? formatBase(displayedValue, b) : "—"}
                </span>
              </Fragment>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-2">
          {["AND", "OR", "XOR", "NOT"].map((op) => (
            <button
              key={op}
              data-testid={`bit-${op}`}
              onClick={() => op === "NOT" ? unary("NOT") : applyOp(op)}
              className={bitBtn}
            >{op}</button>
          ))}
          {["<<", ">>", "MOD", "±"].map((op) => (
            <button
              key={op}
              data-testid={`bit-${op}`}
              onClick={() => op === "±" ? unary("NEG") : applyOp(op)}
              className={bitBtn}
            >{op}</button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-2">
          {hexDigits.map((d) => {
            const disabled = base !== "HEX";
            return (
              <button
                key={d}
                data-testid={`prog-${d}`}
                disabled={disabled}
                onClick={() => append(d)}
                className={numBtn(disabled)}
              >{d}</button>
            );
          })}
        </div>

        <div className="grid grid-cols-4 gap-2">
          <button data-testid="prog-C" onClick={clear} className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60 h-12 rounded-xl font-semibold transition-all active:scale-95">C</button>
          <button data-testid="prog-back" onClick={backspace} className="bg-muted text-muted-foreground hover:bg-muted/70 h-12 rounded-xl font-semibold transition-all active:scale-95"><Delete className="w-4 h-4 mx-auto" /></button>
          <button data-testid="prog-÷" onClick={() => applyOp("÷")} className={opBtn}>÷</button>
          <button data-testid="prog-×" onClick={() => applyOp("×")} className={opBtn}>×</button>

          {["7", "8", "9"].map((k) => {
            const disabled = !allowedChars[base].test(k);
            return <button key={k} data-testid={`prog-${k}`} disabled={disabled} onClick={() => append(k)} className={numBtn(disabled)}>{k}</button>;
          })}
          <button data-testid="prog-minus" onClick={() => applyOp("-")} className={opBtn}>−</button>

          {["4", "5", "6"].map((k) => {
            const disabled = !allowedChars[base].test(k);
            return <button key={k} data-testid={`prog-${k}`} disabled={disabled} onClick={() => append(k)} className={numBtn(disabled)}>{k}</button>;
          })}
          <button data-testid="prog-plus" onClick={() => applyOp("+")} className={opBtn}>+</button>

          {["1", "2", "3"].map((k) => {
            const disabled = !allowedChars[base].test(k);
            return <button key={k} data-testid={`prog-${k}`} disabled={disabled} onClick={() => append(k)} className={numBtn(disabled)}>{k}</button>;
          })}
          <button data-testid="prog-equals" onClick={equals} className="row-span-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold transition-all active:scale-95">=</button>

          <button data-testid="prog-0" disabled={!allowedChars[base].test("0")} onClick={() => append("0")} className={`col-span-3 ${numBtn(!allowedChars[base].test("0"))}`}>0</button>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-2xl p-4 shadow-sm">
        <h3 className="font-semibold text-sm text-foreground mb-3">Programmer mode</h3>
        <ul className="text-xs text-muted-foreground space-y-2 leading-relaxed">
          <li><strong className="text-foreground">HEX / DEC / OCT / BIN</strong> — switch the input/display base. The value is shown in all four bases simultaneously.</li>
          <li><strong className="text-foreground">AND, OR, XOR, NOT</strong> — bitwise operators on arbitrary-precision integers (BigInt).</li>
          <li><strong className="text-foreground">&lt;&lt; / &gt;&gt;</strong> — left/right bit shift. Second operand is the shift amount.</li>
          <li><strong className="text-foreground">MOD</strong> — integer remainder.</li>
          <li>Pending operation: {pending ? <span className="text-primary font-bold">{formatBase(pending.value, base)} {pending.op}</span> : <span>none</span>}</li>
        </ul>
      </div>
    </div>
  );
}
