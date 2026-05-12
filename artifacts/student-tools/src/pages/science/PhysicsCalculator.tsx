import { useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { Atom } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Variable = { symbol: string; name: string; unit: string };
type Formula = {
  id: string;
  name: string;
  equation: string;
  variables: Variable[];
  solve: Record<string, (v: Record<string, number>) => number>;
};
type Category = { name: string; formulas: Formula[] };

const G = 6.674e-11;
const R = 8.314;

const CATEGORIES: Category[] = [
  {
    name: "Mechanics",
    formulas: [
      {
        id: "f-ma", name: "Newton's 2nd Law", equation: "F = m × a",
        variables: [
          { symbol: "F", name: "Force", unit: "N" },
          { symbol: "m", name: "Mass", unit: "kg" },
          { symbol: "a", name: "Acceleration", unit: "m/s²" },
        ],
        solve: {
          F: (v) => v.m * v.a,
          m: (v) => v.F / v.a,
          a: (v) => v.F / v.m,
        },
      },
      {
        id: "v-u-at", name: "Velocity (v = u + at)", equation: "v = u + a × t",
        variables: [
          { symbol: "v", name: "Final velocity", unit: "m/s" },
          { symbol: "u", name: "Initial velocity", unit: "m/s" },
          { symbol: "a", name: "Acceleration", unit: "m/s²" },
          { symbol: "t", name: "Time", unit: "s" },
        ],
        solve: {
          v: (x) => x.u + x.a * x.t,
          u: (x) => x.v - x.a * x.t,
          a: (x) => (x.v - x.u) / x.t,
          t: (x) => (x.v - x.u) / x.a,
        },
      },
      {
        id: "v2-u2-2as", name: "Velocity² (v² = u² + 2as)", equation: "v² = u² + 2 × a × s",
        variables: [
          { symbol: "v", name: "Final velocity", unit: "m/s" },
          { symbol: "u", name: "Initial velocity", unit: "m/s" },
          { symbol: "a", name: "Acceleration", unit: "m/s²" },
          { symbol: "s", name: "Displacement", unit: "m" },
        ],
        solve: {
          v: (x) => Math.sqrt(x.u * x.u + 2 * x.a * x.s),
          u: (x) => Math.sqrt(x.v * x.v - 2 * x.a * x.s),
          a: (x) => (x.v * x.v - x.u * x.u) / (2 * x.s),
          s: (x) => (x.v * x.v - x.u * x.u) / (2 * x.a),
        },
      },
      {
        id: "s-ut-half-at2", name: "Displacement (s = ut + ½at²)", equation: "s = u×t + ½×a×t²",
        variables: [
          { symbol: "s", name: "Displacement", unit: "m" },
          { symbol: "u", name: "Initial velocity", unit: "m/s" },
          { symbol: "a", name: "Acceleration", unit: "m/s²" },
          { symbol: "t", name: "Time", unit: "s" },
        ],
        solve: {
          s: (x) => x.u * x.t + 0.5 * x.a * x.t * x.t,
          u: (x) => (x.s - 0.5 * x.a * x.t * x.t) / x.t,
          a: (x) => 2 * (x.s - x.u * x.t) / (x.t * x.t),
          t: (x) => { /* quadratic: 0.5a t² + u t - s = 0 */
            const A = 0.5 * x.a, B = x.u, C = -x.s;
            const disc = B * B - 4 * A * C;
            if (disc < 0) return NaN;
            const t1 = (-B + Math.sqrt(disc)) / (2 * A);
            const t2 = (-B - Math.sqrt(disc)) / (2 * A);
            return t1 >= 0 ? t1 : t2;
          },
        },
      },
      {
        id: "ke", name: "Kinetic Energy", equation: "KE = ½ × m × v²",
        variables: [
          { symbol: "KE", name: "Kinetic Energy", unit: "J" },
          { symbol: "m", name: "Mass", unit: "kg" },
          { symbol: "v", name: "Velocity", unit: "m/s" },
        ],
        solve: {
          KE: (x) => 0.5 * x.m * x.v * x.v,
          m: (x) => 2 * x.KE / (x.v * x.v),
          v: (x) => Math.sqrt(2 * x.KE / x.m),
        },
      },
      {
        id: "pe", name: "Gravitational PE", equation: "PE = m × g × h",
        variables: [
          { symbol: "PE", name: "Potential Energy", unit: "J" },
          { symbol: "m", name: "Mass", unit: "kg" },
          { symbol: "g", name: "Gravity", unit: "m/s²" },
          { symbol: "h", name: "Height", unit: "m" },
        ],
        solve: {
          PE: (x) => x.m * x.g * x.h,
          m: (x) => x.PE / (x.g * x.h),
          g: (x) => x.PE / (x.m * x.h),
          h: (x) => x.PE / (x.m * x.g),
        },
      },
      {
        id: "momentum", name: "Momentum", equation: "p = m × v",
        variables: [
          { symbol: "p", name: "Momentum", unit: "kg⋅m/s" },
          { symbol: "m", name: "Mass", unit: "kg" },
          { symbol: "v", name: "Velocity", unit: "m/s" },
        ],
        solve: {
          p: (x) => x.m * x.v,
          m: (x) => x.p / x.v,
          v: (x) => x.p / x.m,
        },
      },
      {
        id: "work", name: "Work Done", equation: "W = F × d × cos(θ)",
        variables: [
          { symbol: "W", name: "Work", unit: "J" },
          { symbol: "F", name: "Force", unit: "N" },
          { symbol: "d", name: "Distance", unit: "m" },
          { symbol: "θ", name: "Angle", unit: "°" },
        ],
        solve: {
          W: (x) => x.F * x.d * Math.cos(x["θ"] * Math.PI / 180),
          F: (x) => x.W / (x.d * Math.cos(x["θ"] * Math.PI / 180)),
          d: (x) => x.W / (x.F * Math.cos(x["θ"] * Math.PI / 180)),
          θ: (x) => Math.acos(x.W / (x.F * x.d)) * 180 / Math.PI,
        },
      },
      {
        id: "power", name: "Power", equation: "P = W / t",
        variables: [
          { symbol: "P", name: "Power", unit: "W" },
          { symbol: "W", name: "Work / Energy", unit: "J" },
          { symbol: "t", name: "Time", unit: "s" },
        ],
        solve: {
          P: (x) => x.W / x.t,
          W: (x) => x.P * x.t,
          t: (x) => x.W / x.P,
        },
      },
      {
        id: "pressure", name: "Pressure", equation: "P = F / A",
        variables: [
          { symbol: "P", name: "Pressure", unit: "Pa" },
          { symbol: "F", name: "Force", unit: "N" },
          { symbol: "A", name: "Area", unit: "m²" },
        ],
        solve: {
          P: (x) => x.F / x.A,
          F: (x) => x.P * x.A,
          A: (x) => x.F / x.P,
        },
      },
      {
        id: "density", name: "Density", equation: "ρ = m / V",
        variables: [
          { symbol: "ρ", name: "Density", unit: "kg/m³" },
          { symbol: "m", name: "Mass", unit: "kg" },
          { symbol: "V", name: "Volume", unit: "m³" },
        ],
        solve: {
          ρ: (x) => x.m / x.V,
          m: (x) => x.ρ * x.V,
          V: (x) => x.m / x.ρ,
        },
      },
      {
        id: "gravity-force", name: "Gravitational Force", equation: "F = G × m₁ × m₂ / r²",
        variables: [
          { symbol: "F", name: "Force", unit: "N" },
          { symbol: "m₁", name: "Mass 1", unit: "kg" },
          { symbol: "m₂", name: "Mass 2", unit: "kg" },
          { symbol: "r", name: "Distance", unit: "m" },
        ],
        solve: {
          F: (x) => G * x["m₁"] * x["m₂"] / (x.r * x.r),
          "m₁": (x) => x.F * x.r * x.r / (G * x["m₂"]),
          "m₂": (x) => x.F * x.r * x.r / (G * x["m₁"]),
          r: (x) => Math.sqrt(G * x["m₁"] * x["m₂"] / x.F),
        },
      },
    ],
  },
  {
    name: "Electricity",
    formulas: [
      {
        id: "ohm", name: "Ohm's Law", equation: "V = I × R",
        variables: [
          { symbol: "V", name: "Voltage", unit: "V" },
          { symbol: "I", name: "Current", unit: "A" },
          { symbol: "R", name: "Resistance", unit: "Ω" },
        ],
        solve: {
          V: (x) => x.I * x.R,
          I: (x) => x.V / x.R,
          R: (x) => x.V / x.I,
        },
      },
      {
        id: "power-iv", name: "Electrical Power (P=IV)", equation: "P = I × V",
        variables: [
          { symbol: "P", name: "Power", unit: "W" },
          { symbol: "I", name: "Current", unit: "A" },
          { symbol: "V", name: "Voltage", unit: "V" },
        ],
        solve: {
          P: (x) => x.I * x.V,
          I: (x) => x.P / x.V,
          V: (x) => x.P / x.I,
        },
      },
      {
        id: "power-i2r", name: "Electrical Power (P=I²R)", equation: "P = I² × R",
        variables: [
          { symbol: "P", name: "Power", unit: "W" },
          { symbol: "I", name: "Current", unit: "A" },
          { symbol: "R", name: "Resistance", unit: "Ω" },
        ],
        solve: {
          P: (x) => x.I * x.I * x.R,
          I: (x) => Math.sqrt(x.P / x.R),
          R: (x) => x.P / (x.I * x.I),
        },
      },
      {
        id: "charge", name: "Electric Charge", equation: "Q = I × t",
        variables: [
          { symbol: "Q", name: "Charge", unit: "C" },
          { symbol: "I", name: "Current", unit: "A" },
          { symbol: "t", name: "Time", unit: "s" },
        ],
        solve: {
          Q: (x) => x.I * x.t,
          I: (x) => x.Q / x.t,
          t: (x) => x.Q / x.I,
        },
      },
      {
        id: "energy-elec", name: "Electrical Energy", equation: "E = P × t",
        variables: [
          { symbol: "E", name: "Energy", unit: "J" },
          { symbol: "P", name: "Power", unit: "W" },
          { symbol: "t", name: "Time", unit: "s" },
        ],
        solve: {
          E: (x) => x.P * x.t,
          P: (x) => x.E / x.t,
          t: (x) => x.E / x.P,
        },
      },
    ],
  },
  {
    name: "Waves & Optics",
    formulas: [
      {
        id: "wave-speed", name: "Wave Speed", equation: "v = f × λ",
        variables: [
          { symbol: "v", name: "Wave speed", unit: "m/s" },
          { symbol: "f", name: "Frequency", unit: "Hz" },
          { symbol: "λ", name: "Wavelength", unit: "m" },
        ],
        solve: {
          v: (x) => x.f * x["λ"],
          f: (x) => x.v / x["λ"],
          λ: (x) => x.v / x.f,
        },
      },
      {
        id: "period-freq", name: "Period & Frequency", equation: "T = 1 / f",
        variables: [
          { symbol: "T", name: "Period", unit: "s" },
          { symbol: "f", name: "Frequency", unit: "Hz" },
        ],
        solve: {
          T: (x) => 1 / x.f,
          f: (x) => 1 / x.T,
        },
      },
      {
        id: "snell", name: "Snell's Law", equation: "n₁ × sin(θ₁) = n₂ × sin(θ₂)",
        variables: [
          { symbol: "n₁", name: "Refractive index 1", unit: "" },
          { symbol: "θ₁", name: "Angle of incidence", unit: "°" },
          { symbol: "n₂", name: "Refractive index 2", unit: "" },
          { symbol: "θ₂", name: "Angle of refraction", unit: "°" },
        ],
        solve: {
          "n₁": (x) => x["n₂"] * Math.sin(x["θ₂"] * Math.PI / 180) / Math.sin(x["θ₁"] * Math.PI / 180),
          "θ₁": (x) => Math.asin(x["n₂"] * Math.sin(x["θ₂"] * Math.PI / 180) / x["n₁"]) * 180 / Math.PI,
          "n₂": (x) => x["n₁"] * Math.sin(x["θ₁"] * Math.PI / 180) / Math.sin(x["θ₂"] * Math.PI / 180),
          "θ₂": (x) => Math.asin(x["n₁"] * Math.sin(x["θ₁"] * Math.PI / 180) / x["n₂"]) * 180 / Math.PI,
        },
      },
      {
        id: "lens", name: "Lens / Mirror Formula", equation: "1/f = 1/v + 1/u",
        variables: [
          { symbol: "f", name: "Focal length", unit: "m" },
          { symbol: "v", name: "Image distance", unit: "m" },
          { symbol: "u", name: "Object distance", unit: "m" },
        ],
        solve: {
          f: (x) => 1 / (1 / x.v + 1 / x.u),
          v: (x) => 1 / (1 / x.f - 1 / x.u),
          u: (x) => 1 / (1 / x.f - 1 / x.v),
        },
      },
    ],
  },
  {
    name: "Thermodynamics",
    formulas: [
      {
        id: "heat", name: "Heat Energy", equation: "Q = m × c × ΔT",
        variables: [
          { symbol: "Q", name: "Heat energy", unit: "J" },
          { symbol: "m", name: "Mass", unit: "kg" },
          { symbol: "c", name: "Specific heat capacity", unit: "J/kg·K" },
          { symbol: "ΔT", name: "Temperature change", unit: "°C or K" },
        ],
        solve: {
          Q: (x) => x.m * x.c * x["ΔT"],
          m: (x) => x.Q / (x.c * x["ΔT"]),
          c: (x) => x.Q / (x.m * x["ΔT"]),
          ΔT: (x) => x.Q / (x.m * x.c),
        },
      },
      {
        id: "ideal-gas", name: "Ideal Gas Law", equation: "PV = nRT  (R = 8.314)",
        variables: [
          { symbol: "P", name: "Pressure", unit: "Pa" },
          { symbol: "V", name: "Volume", unit: "m³" },
          { symbol: "n", name: "Moles", unit: "mol" },
          { symbol: "T", name: "Temperature", unit: "K" },
        ],
        solve: {
          P: (x) => x.n * R * x.T / x.V,
          V: (x) => x.n * R * x.T / x.P,
          n: (x) => x.P * x.V / (R * x.T),
          T: (x) => x.P * x.V / (x.n * R),
        },
      },
      {
        id: "efficiency", name: "Efficiency", equation: "η = (useful output / total input) × 100",
        variables: [
          { symbol: "η", name: "Efficiency", unit: "%" },
          { symbol: "E_out", name: "Useful output energy", unit: "J" },
          { symbol: "E_in", name: "Total input energy", unit: "J" },
        ],
        solve: {
          η: (x) => (x.E_out / x.E_in) * 100,
          E_out: (x) => (x["η"] / 100) * x.E_in,
          E_in: (x) => x.E_out / (x["η"] / 100),
        },
      },
    ],
  },
  {
    name: "Nuclear & Modern",
    formulas: [
      {
        id: "half-life-remaining", name: "Radioactive Decay (remaining)", equation: "N = N₀ × (½)^(t/t½)",
        variables: [
          { symbol: "N", name: "Remaining quantity", unit: "atoms / g" },
          { symbol: "N₀", name: "Initial quantity", unit: "atoms / g" },
          { symbol: "t", name: "Elapsed time", unit: "s / yr" },
          { symbol: "t½", name: "Half-life", unit: "s / yr" },
        ],
        solve: {
          N:    (x) => x["N₀"] * Math.pow(0.5, x.t / x["t½"]),
          "N₀": (x) => x.N / Math.pow(0.5, x.t / x["t½"]),
          t:    (x) => x["t½"] * Math.log(x.N / x["N₀"]) / Math.log(0.5),
          "t½": (x) => x.t * Math.log(0.5) / Math.log(x.N / x["N₀"]),
        },
      },
      {
        id: "einstein", name: "Mass-Energy Equivalence", equation: "E = mc²",
        variables: [
          { symbol: "E", name: "Energy", unit: "J" },
          { symbol: "m", name: "Mass", unit: "kg" },
          { symbol: "c", name: "Speed of light", unit: "m/s" },
        ],
        solve: {
          E: (x) => x.m * x.c * x.c,
          m: (x) => x.E / (x.c * x.c),
          c: (x) => Math.sqrt(x.E / x.m),
        },
      },
    ],
  },
];

function fmtResult(n: number): string {
  if (!isFinite(n) || isNaN(n)) return "undefined";
  if (Math.abs(n) >= 1e6 || (Math.abs(n) < 1e-3 && n !== 0)) return n.toExponential(4);
  return parseFloat(n.toPrecision(6)).toString();
}

export default function PhysicsCalculator() {
  const [catIdx, setCatIdx] = useState(0);
  const [formulaIdx, setFormulaIdx] = useState(0);
  const [solveFor, setSolveFor] = useState<string>("");
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ symbol: string; value: string; unit: string } | null>(null);

  const cat = CATEGORIES[catIdx];
  const formula = cat.formulas[formulaIdx];

  function selectCat(i: number) {
    setCatIdx(i);
    setFormulaIdx(0);
    setSolveFor("");
    setInputs({});
    setResult(null);
  }

  function selectFormula(i: number) {
    setFormulaIdx(i);
    setSolveFor("");
    setInputs({});
    setResult(null);
  }

  function selectSolveFor(sym: string) {
    setSolveFor(sym);
    setInputs({});
    setResult(null);
  }

  function calculate() {
    if (!solveFor) { toast.error("Select which variable to solve for"); return; }
    const vals: Record<string, number> = {};
    for (const v of formula.variables) {
      if (v.symbol === solveFor) continue;
      const s = inputs[v.symbol];
      if (s === undefined || s === "") { toast.error(`Enter a value for ${v.name} (${v.symbol})`); return; }
      const n = parseFloat(s);
      if (isNaN(n)) { toast.error(`Invalid value for ${v.symbol}`); return; }
      vals[v.symbol] = n;
    }
    const fn = formula.solve[solveFor];
    const val = fn(vals);
    if (!isFinite(val) || isNaN(val)) {
      toast.error("Cannot compute — check your input values.");
      return;
    }
    const variable = formula.variables.find((x) => x.symbol === solveFor)!;
    setResult({ symbol: solveFor, value: fmtResult(val), unit: variable.unit });
    toast.success("Calculated!");
  }

  return (
    <ToolLayout
      title="Physics Formula Calculator"
      description="Pick any formula, enter the known values, and instantly solve for the unknown variable"
      category="Science"
      categoryHref="/"
      icon={<Atom className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />}
      iconBg="bg-emerald-100 dark:bg-emerald-900/40"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c, i) => (
            <button
              key={c.name}
              onClick={() => selectCat(i)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${catIdx === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {cat.formulas.map((f, i) => (
            <button
              key={f.id}
              onClick={() => selectFormula(i)}
              className={`text-left px-4 py-3 rounded-xl border text-sm transition-all ${formulaIdx === i ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border bg-card text-foreground hover:border-primary/40"}`}
            >
              <span className="block font-medium">{f.name}</span>
              <span className="block text-xs text-muted-foreground font-mono mt-0.5">{f.equation}</span>
            </button>
          ))}
        </div>

        <div className="bg-card border border-card-border rounded-2xl p-5 space-y-5">
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Formula</p>
            <p className="text-xl font-bold font-mono text-primary">{formula.equation}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Solve for</p>
            <div className="flex flex-wrap gap-2">
              {formula.variables.map((v) => (
                <button
                  key={v.symbol}
                  onClick={() => selectSolveFor(v.symbol)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-mono font-semibold border transition-all ${solveFor === v.symbol ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40 text-foreground border-border hover:border-primary/50"}`}
                >
                  {v.symbol}
                  <span className="ml-1 font-sans font-normal text-xs opacity-70">({v.unit || "—"})</span>
                </button>
              ))}
            </div>
          </div>

          {solveFor && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Known values</p>
              {formula.variables.filter((v) => v.symbol !== solveFor).map((v) => (
                <div key={v.symbol} className="flex items-center gap-3">
                  <div className="w-24 shrink-0">
                    <span className="font-mono font-semibold text-sm text-primary">{v.symbol}</span>
                    <span className="block text-xs text-muted-foreground">{v.name}</span>
                  </div>
                  <Input
                    type="number"
                    placeholder={`Enter ${v.unit ? `(${v.unit})` : "value"}`}
                    value={inputs[v.symbol] || ""}
                    onChange={(e) => { setInputs((p) => ({ ...p, [v.symbol]: e.target.value })); setResult(null); }}
                    className="flex-1 font-mono"
                  />
                </div>
              ))}
              <Button onClick={calculate} className="w-full">Calculate {solveFor}</Button>
            </div>
          )}

          {!solveFor && (
            <p className="text-center text-sm text-muted-foreground py-2">Select which variable you want to solve for above</p>
          )}

          {result && (
            <div className="bg-primary/10 border border-primary/30 rounded-xl px-5 py-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Result</p>
              <p className="text-3xl font-bold font-mono text-primary">
                {result.value}
                {result.unit && <span className="text-lg font-normal ml-2 text-muted-foreground">{result.unit}</span>}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{formula.variables.find((v) => v.symbol === result.symbol)?.name}</p>
            </div>
          )}
        </div>

        <div className="bg-muted/30 rounded-xl px-4 py-3 text-xs text-muted-foreground space-y-0.5">
          <p>Constants used: G = 6.674×10⁻¹¹ N⋅m²/kg² · R = 8.314 J/mol⋅K · c = 3×10⁸ m/s (enter manually)</p>
          <p>Gravity on Earth ≈ 9.81 m/s² · Speed of light ≈ 3×10⁸ m/s</p>
        </div>
      </div>
    </ToolLayout>
  );
}
