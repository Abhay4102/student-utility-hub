import { useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { ArrowLeftRight, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Category = {
  name: string;
  units: { label: string; toBase: (v: number) => number; fromBase: (v: number) => number }[];
};

const categories: Category[] = [
  {
    name: "Length",
    units: [
      { label: "Kilometer (km)", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { label: "Meter (m)", toBase: (v) => v, fromBase: (v) => v },
      { label: "Centimeter (cm)", toBase: (v) => v / 100, fromBase: (v) => v * 100 },
      { label: "Millimeter (mm)", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { label: "Mile (mi)", toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
      { label: "Yard (yd)", toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
      { label: "Foot (ft)", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
      { label: "Inch (in)", toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
    ],
  },
  {
    name: "Weight",
    units: [
      { label: "Kilogram (kg)", toBase: (v) => v, fromBase: (v) => v },
      { label: "Gram (g)", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { label: "Milligram (mg)", toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
      { label: "Metric Ton (t)", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { label: "Pound (lb)", toBase: (v) => v * 0.453592, fromBase: (v) => v / 0.453592 },
      { label: "Ounce (oz)", toBase: (v) => v * 0.0283495, fromBase: (v) => v / 0.0283495 },
    ],
  },
  {
    name: "Temperature",
    units: [
      { label: "Celsius (°C)", toBase: (v) => v, fromBase: (v) => v },
      { label: "Fahrenheit (°F)", toBase: (v) => (v - 32) * 5 / 9, fromBase: (v) => v * 9 / 5 + 32 },
      { label: "Kelvin (K)", toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
    ],
  },
  {
    name: "Area",
    units: [
      { label: "Square Meter (m²)", toBase: (v) => v, fromBase: (v) => v },
      { label: "Square Kilometer (km²)", toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
      { label: "Square Centimeter (cm²)", toBase: (v) => v / 10000, fromBase: (v) => v * 10000 },
      { label: "Hectare (ha)", toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
      { label: "Acre", toBase: (v) => v * 4046.86, fromBase: (v) => v / 4046.86 },
      { label: "Square Mile (mi²)", toBase: (v) => v * 2.59e6, fromBase: (v) => v / 2.59e6 },
      { label: "Square Foot (ft²)", toBase: (v) => v * 0.092903, fromBase: (v) => v / 0.092903 },
      { label: "Square Inch (in²)", toBase: (v) => v * 0.00064516, fromBase: (v) => v / 0.00064516 },
    ],
  },
  {
    name: "Speed",
    units: [
      { label: "Meter/second (m/s)", toBase: (v) => v, fromBase: (v) => v },
      { label: "Kilometer/hour (km/h)", toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
      { label: "Mile/hour (mph)", toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
      { label: "Knot", toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 },
      { label: "Foot/second (ft/s)", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
    ],
  },
  {
    name: "Volume",
    units: [
      { label: "Liter (L)", toBase: (v) => v, fromBase: (v) => v },
      { label: "Milliliter (mL)", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { label: "Cubic Meter (m³)", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { label: "Gallon (US gal)", toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
      { label: "Quart (qt)", toBase: (v) => v * 0.946353, fromBase: (v) => v / 0.946353 },
      { label: "Pint (pt)", toBase: (v) => v * 0.473176, fromBase: (v) => v / 0.473176 },
      { label: "Cup", toBase: (v) => v * 0.236588, fromBase: (v) => v / 0.236588 },
      { label: "Fluid Ounce (fl oz)", toBase: (v) => v * 0.0295735, fromBase: (v) => v / 0.0295735 },
      { label: "Cubic Foot (ft³)", toBase: (v) => v * 28.3168, fromBase: (v) => v / 28.3168 },
    ],
  },
  {
    name: "Data",
    units: [
      { label: "Byte (B)", toBase: (v) => v, fromBase: (v) => v },
      { label: "Kilobyte (KB)", toBase: (v) => v * 1024, fromBase: (v) => v / 1024 },
      { label: "Megabyte (MB)", toBase: (v) => v * 1024 ** 2, fromBase: (v) => v / 1024 ** 2 },
      { label: "Gigabyte (GB)", toBase: (v) => v * 1024 ** 3, fromBase: (v) => v / 1024 ** 3 },
      { label: "Terabyte (TB)", toBase: (v) => v * 1024 ** 4, fromBase: (v) => v / 1024 ** 4 },
      { label: "Bit", toBase: (v) => v / 8, fromBase: (v) => v * 8 },
      { label: "Kilobit (Kb)", toBase: (v) => v * 128, fromBase: (v) => v / 128 },
      { label: "Megabit (Mb)", toBase: (v) => v * 125000, fromBase: (v) => v / 125000 },
      { label: "Gigabit (Gb)", toBase: (v) => v * 1.25e8, fromBase: (v) => v / 1.25e8 },
    ],
  },
  {
    name: "Time",
    units: [
      { label: "Second (s)", toBase: (v) => v, fromBase: (v) => v },
      { label: "Millisecond (ms)", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { label: "Microsecond (μs)", toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
      { label: "Minute (min)", toBase: (v) => v * 60, fromBase: (v) => v / 60 },
      { label: "Hour (hr)", toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
      { label: "Day", toBase: (v) => v * 86400, fromBase: (v) => v / 86400 },
      { label: "Week", toBase: (v) => v * 604800, fromBase: (v) => v / 604800 },
      { label: "Month (avg)", toBase: (v) => v * 2.628e6, fromBase: (v) => v / 2.628e6 },
      { label: "Year", toBase: (v) => v * 3.156e7, fromBase: (v) => v / 3.156e7 },
    ],
  },
];

function fmt(n: number): string {
  if (!isFinite(n) || isNaN(n)) return "—";
  if (Math.abs(n) >= 1e9 || (Math.abs(n) < 1e-4 && n !== 0)) {
    return n.toExponential(6);
  }
  const s = parseFloat(n.toPrecision(10)).toString();
  return s;
}

export default function UnitConverter() {
  const [catIdx, setCatIdx] = useState(0);
  const [fromIdx, setFromIdx] = useState(0);
  const [toIdx, setToIdx] = useState(1);
  const [input, setInput] = useState("1");

  const cat = categories[catIdx];
  const fromUnit = cat.units[fromIdx];
  const toUnit = cat.units[toIdx];

  const inputNum = parseFloat(input);
  const result = isNaN(inputNum) ? "" : fmt(toUnit.fromBase(fromUnit.toBase(inputNum)));

  function swap() {
    setFromIdx(toIdx);
    setToIdx(fromIdx);
  }

  function selectCategory(i: number) {
    setCatIdx(i);
    setFromIdx(0);
    setToIdx(1);
    setInput("1");
  }

  return (
    <ToolLayout
      title="Unit Converter"
      description="Convert between units of length, weight, temperature, area, speed, volume, data, and time"
      category="Utilities"
      categoryHref="/"
      icon={<ArrowLeftRight className="w-6 h-6 text-amber-700 dark:text-amber-400" />}
      iconBg="bg-amber-100 dark:bg-amber-900/40"
    >
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {categories.map((c, i) => (
            <button
              key={c.name}
              data-testid={`cat-${c.name}`}
              onClick={() => selectCategory(i)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                catIdx === i
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="bg-card border border-card-border rounded-2xl p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-end">
            <div className="space-y-2">
              <Label>From</Label>
              <select
                data-testid="select-from"
                value={fromIdx}
                onChange={(e) => setFromIdx(Number(e.target.value))}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {cat.units.map((u, i) => (
                  <option key={u.label} value={i}>{u.label}</option>
                ))}
              </select>
              <Input
                data-testid="input-value"
                type="number"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter value"
                className="text-lg font-mono h-14"
              />
            </div>

            <button
              data-testid="swap-btn"
              onClick={swap}
              className="h-10 w-10 flex items-center justify-center rounded-full bg-muted hover:bg-muted/70 transition-colors self-end mb-[3.5rem] mx-auto"
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="space-y-2">
              <Label>To</Label>
              <select
                data-testid="select-to"
                value={toIdx}
                onChange={(e) => setToIdx(Number(e.target.value))}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {cat.units.map((u, i) => (
                  <option key={u.label} value={i}>{u.label}</option>
                ))}
              </select>
              <div className="h-14 rounded-md border border-input bg-muted/40 px-3 flex items-center">
                <span data-testid="result-value" className="text-lg font-mono font-semibold text-foreground">
                  {result || "—"}
                </span>
              </div>
            </div>
          </div>

          {!isNaN(inputNum) && result && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 text-sm text-center text-foreground">
              <span className="font-semibold font-mono">{input} {fromUnit.label}</span>
              <span className="text-muted-foreground mx-2">=</span>
              <span className="font-semibold font-mono text-primary">{result} {toUnit.label}</span>
            </div>
          )}
        </div>

        <div className="bg-card border border-card-border rounded-2xl p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">All {cat.name} Conversions from {input || "1"} {fromUnit.label}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {cat.units.map((u, i) => {
              if (i === fromIdx) return null;
              const val = isNaN(inputNum) ? "—" : fmt(u.fromBase(fromUnit.toBase(inputNum)));
              return (
                <button
                  key={u.label}
                  data-testid={`conversion-row-${i}`}
                  onClick={() => setToIdx(i)}
                  className={`flex items-center justify-between p-2.5 rounded-lg text-sm transition-colors text-left ${
                    toIdx === i ? "bg-primary/10 border border-primary/30" : "bg-muted/40 hover:bg-muted/70"
                  }`}
                >
                  <span className="text-muted-foreground">{u.label}</span>
                  <span className="font-mono font-semibold text-foreground">{val}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
