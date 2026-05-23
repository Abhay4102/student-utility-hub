import { useMemo, useState, useEffect } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { Input } from "@/components/ui/input";
import { FlaskConical, X, Search, Layers, Thermometer, Atom, Info, ArrowRight, ArrowLeft, ArrowDown, ArrowUp, TrendingUp } from "lucide-react";
import {
  ELEMENTS, CATEGORY_STYLES, getBlock, getShells,
  type ElementData, type Block, type Phase,
} from "./periodicData";
import { BohrDiagram } from "./BohrDiagram";

type ViewMode = "category" | "electronegativity" | "radius" | "density" | "phase";

const VIEW_MODES: Array<{ id: ViewMode; label: string; icon: React.ReactNode }> = [
  { id: "category",         label: "By category",          icon: <Atom className="w-3.5 h-3.5" /> },
  { id: "electronegativity", label: "Electronegativity",   icon: <Layers className="w-3.5 h-3.5" /> },
  { id: "radius",           label: "Atomic radius",        icon: <Atom className="w-3.5 h-3.5" /> },
  { id: "density",          label: "Density",              icon: <Layers className="w-3.5 h-3.5" /> },
  { id: "phase",            label: "Phase at 25°C",        icon: <Thermometer className="w-3.5 h-3.5" /> },
];

const PHASE_COLORS: Record<Phase, string> = {
  solid:     "bg-stone-300 dark:bg-stone-700 text-stone-900 dark:text-stone-100 border-stone-400 dark:border-stone-500",
  liquid:    "bg-blue-300 dark:bg-blue-700/60 text-blue-900 dark:text-blue-100 border-blue-400 dark:border-blue-500",
  gas:       "bg-cyan-200 dark:bg-cyan-800/60 text-cyan-900 dark:text-cyan-100 border-cyan-400 dark:border-cyan-500",
  synthetic: "bg-purple-200 dark:bg-purple-900/60 text-purple-900 dark:text-purple-100 border-purple-400 dark:border-purple-500",
};

const BLOCK_COLORS: Record<Block, string> = {
  s: "bg-rose-500", p: "bg-sky-500", d: "bg-amber-500", f: "bg-pink-500",
};

// Heatmap helpers — 5-step ramp from cool to hot.
function heatColor(t: number): string {
  // t in [0, 1]
  if (t < 0.2)  return "bg-indigo-200 dark:bg-indigo-900/60 text-indigo-900 dark:text-indigo-100 border-indigo-300 dark:border-indigo-700";
  if (t < 0.4)  return "bg-cyan-200 dark:bg-cyan-900/60 text-cyan-900 dark:text-cyan-100 border-cyan-300 dark:border-cyan-700";
  if (t < 0.6)  return "bg-emerald-200 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-100 border-emerald-300 dark:border-emerald-700";
  if (t < 0.8)  return "bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 border-amber-300 dark:border-amber-700";
  return            "bg-rose-300 dark:bg-rose-900/60 text-rose-900 dark:text-rose-100 border-rose-400 dark:border-rose-700";
}

const UNKNOWN_CLS = "bg-muted/60 text-muted-foreground border-border/60";

function classForCell(el: ElementData, view: ViewMode, ranges: Ranges): string {
  if (view === "category") {
    const s = CATEGORY_STYLES[el.category];
    return `${s.cell} ${s.cellHover} ${s.text}`;
  }
  if (view === "phase") {
    return PHASE_COLORS[el.phase];
  }
  const value =
    view === "electronegativity" ? el.en :
    view === "radius"            ? el.radius :
    view === "density"           ? el.density : undefined;
  if (value === undefined) return UNKNOWN_CLS;
  const range = view === "electronegativity" ? ranges.en : view === "radius" ? ranges.radius : ranges.density;
  if (!range) return UNKNOWN_CLS;
  const t = (value - range.min) / (range.max - range.min || 1);
  return heatColor(Math.max(0, Math.min(1, t)));
}

interface Ranges { en?: { min: number; max: number }; radius?: { min: number; max: number }; density?: { min: number; max: number } }

function computeRanges(): Ranges {
  const collect = (key: keyof ElementData): { min: number; max: number } | undefined => {
    const vals = ELEMENTS.map((e) => e[key]).filter((v): v is number => typeof v === "number");
    if (!vals.length) return undefined;
    return { min: Math.min(...vals), max: Math.max(...vals) };
  };
  return { en: collect("en"), radius: collect("radius"), density: collect("density") };
}

function ElementCell({
  el, onClick, isMatch, dim, view, ranges,
}: {
  el: ElementData; onClick: (e: ElementData) => void; isMatch: boolean; dim: boolean;
  view: ViewMode; ranges: Ranges;
}) {
  const cls = classForCell(el, view, ranges);
  return (
    <button
      onClick={() => onClick(el)}
      title={`${el.name} (${el.symbol}) · #${el.number}`}
      className={`group relative w-full aspect-square flex flex-col items-center justify-center rounded-md border transition-all duration-150 ${cls} ${
        dim ? "opacity-25 saturate-50" : "hover:scale-[1.15] hover:z-20 hover:shadow-lg hover:-translate-y-0.5"
      } ${isMatch ? "ring-2 ring-primary scale-105 z-10 shadow-md" : ""}`}
      data-testid={`element-${el.symbol}`}
    >
      <span className="text-[0.42rem] leading-none opacity-60 absolute top-0.5 left-1">{el.number}</span>
      <span className="text-[0.7rem] sm:text-[0.8rem] font-bold leading-none">{el.symbol}</span>
      <span className="hidden sm:block text-[0.38rem] leading-none opacity-60 mt-0.5 truncate max-w-full px-0.5">{el.name}</span>
    </button>
  );
}

export default function PeriodicTable() {
  const [selected, setSelected] = useState<ElementData | null>(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("category");
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [filterBlock, setFilterBlock] = useState<Block | null>(null);
  const [filterPhase, setFilterPhase] = useState<Phase | null>(null);

  const ranges = useMemo(computeRanges, []);

  const byPos = useMemo(() => {
    const m: Record<string, ElementData> = {};
    ELEMENTS.forEach((el) => { m[`${el.period}-${el.group}`] = el; });
    return m;
  }, []);

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    return new Set(
      ELEMENTS.filter((e) => {
        if (filterCat && e.category !== filterCat) return false;
        if (filterBlock && getBlock(e) !== filterBlock) return false;
        if (filterPhase && e.phase !== filterPhase) return false;
        if (!q) return true;
        return (
          e.symbol.toLowerCase() === q ||
          e.symbol.toLowerCase().startsWith(q) ||
          e.name.toLowerCase().includes(q) ||
          String(e.number) === q
        );
      }).map((e) => e.number),
    );
  }, [search, filterCat, filterBlock, filterPhase]);

  const anyFilter = !!(search.trim() || filterCat || filterBlock || filterPhase);

  // Keyboard: Esc closes detail
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setSelected(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const rows = [1, 2, 3, 4, 5, 6, 7];
  const cols = Array.from({ length: 18 }, (_, i) => i + 1);

  return (
    <ToolLayout
      title="Periodic Table"
      description="All 118 elements with electronegativity, atomic radius, density, electron shells and more — explore by category or property heatmap"
      category="Science"
      categoryHref="/"
      icon={<FlaskConical className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />}
      iconBg="bg-emerald-100 dark:bg-emerald-900/40"
    >
      <div className="space-y-4">
        {/* Controls bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, symbol or atomic number…"
              className="pl-9 pr-9"
              data-testid="search-input"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted text-muted-foreground"
                aria-label="Clear"
              ><X className="w-3.5 h-3.5" /></button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {VIEW_MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setView(m.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                  view === m.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted"
                }`}
                data-testid={`view-${m.id}`}
              >{m.icon} {m.label}</button>
            ))}
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mr-1">Block</span>
          {(["s", "p", "d", "f"] as Block[]).map((b) => (
            <button
              key={b}
              onClick={() => setFilterBlock(filterBlock === b ? null : b)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                filterBlock === b
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              }`}
              data-testid={`block-${b}`}
            ><span className={`w-2 h-2 rounded-full ${BLOCK_COLORS[b]}`} />{b}-block</button>
          ))}
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide ml-2 mr-1">Phase</span>
          {(["solid", "liquid", "gas", "synthetic"] as Phase[]).map((p) => (
            <button
              key={p}
              onClick={() => setFilterPhase(filterPhase === p ? null : p)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors capitalize ${
                filterPhase === p
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              }`}
              data-testid={`phase-${p}`}
            >{p}</button>
          ))}
          {anyFilter && (
            <button
              onClick={() => { setSearch(""); setFilterCat(null); setFilterBlock(null); setFilterPhase(null); }}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground underline"
            >Clear filters</button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto pb-2 -mx-2 px-2">
          <div style={{ minWidth: 720 }}>
            <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(18, minmax(0, 1fr))" }}>
              {rows.map((period) =>
                cols.map((group) => {
                  const el = byPos[`${period}-${group}`];
                  if (!el) {
                    if (period === 6 && group === 3) {
                      return (
                        <div key={`${period}-${group}`}
                          className="w-full aspect-square flex flex-col items-center justify-center rounded-md border border-pink-300 dark:border-pink-500/30 bg-pink-100/60 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300 text-[0.42rem] font-bold leading-tight text-center">
                          57-71<br/>La-Lu
                        </div>
                      );
                    }
                    if (period === 7 && group === 3) {
                      return (
                        <div key={`${period}-${group}`}
                          className="w-full aspect-square flex flex-col items-center justify-center rounded-md border border-fuchsia-300 dark:border-fuchsia-500/30 bg-fuchsia-100/60 dark:bg-fuchsia-950/30 text-fuchsia-700 dark:text-fuchsia-300 text-[0.42rem] font-bold leading-tight text-center">
                          89-103<br/>Ac-Lr
                        </div>
                      );
                    }
                    return <div key={`${period}-${group}`} />;
                  }
                  return (
                    <ElementCell
                      key={el.number}
                      el={el}
                      onClick={setSelected}
                      isMatch={selected?.number === el.number || (anyFilter && matches.has(el.number))}
                      dim={anyFilter && !matches.has(el.number)}
                      view={view}
                      ranges={ranges}
                    />
                  );
                }),
              )}
            </div>

            {/* Lanthanide + Actinide rows */}
            <div className="mt-2 grid gap-1" style={{ gridTemplateColumns: "repeat(18, minmax(0, 1fr))" }}>
              <div className="col-span-3" />
              {[9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((group) => {
                const lant = byPos[`9-${group}`];
                const act = byPos[`10-${group}`];
                return (
                  <div key={group} className="flex flex-col gap-1">
                    {lant && (
                      <ElementCell el={lant} onClick={setSelected}
                        isMatch={selected?.number === lant.number || (anyFilter && matches.has(lant.number))}
                        dim={anyFilter && !matches.has(lant.number)}
                        view={view} ranges={ranges} />
                    )}
                    {act && (
                      <ElementCell el={act} onClick={setSelected}
                        isMatch={selected?.number === act.number || (anyFilter && matches.has(act.number))}
                        dim={anyFilter && !matches.has(act.number)}
                        view={view} ranges={ranges} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Category legend (only meaningful in category view) */}
        {view === "category" && (
          <div className="flex flex-wrap gap-1.5">
            {(Object.entries(CATEGORY_STYLES) as Array<[string, typeof CATEGORY_STYLES["nonmetal"]]>).map(([key, c]) => (
              <button
                key={key}
                onClick={() => setFilterCat(filterCat === key ? null : key)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${c.badgeBg} ${c.badgeText} ${filterCat === key ? "ring-2 ring-primary" : "opacity-80 hover:opacity-100"}`}
                data-testid={`cat-${key}`}
              >
                <span className={`w-2 h-2 rounded-full ${c.cell.split(" ")[0]}`} />
                {c.label}
              </button>
            ))}
          </div>
        )}

        {/* Heatmap legend */}
        {(view === "electronegativity" || view === "radius" || view === "density") && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Low</span>
            <div className="flex gap-0.5">
              {[0.1, 0.3, 0.5, 0.7, 0.9].map((t) => (
                <div key={t} className={`w-6 h-3 rounded ${heatColor(t).split(" ").slice(0, 2).join(" ")} border border-border/40`} />
              ))}
            </div>
            <span>High</span>
            <span className="ml-2 opacity-70">
              ({view === "electronegativity" ? "Pauling scale" : view === "radius" ? "pm" : "g/cm³"})
            </span>
            <div className={`ml-3 px-2 py-0.5 rounded ${UNKNOWN_CLS} border`}>unknown</div>
          </div>
        )}

        {view === "phase" && (
          <div className="flex flex-wrap gap-1.5">
            {(["solid", "liquid", "gas", "synthetic"] as Phase[]).map((p) => (
              <div key={p} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${PHASE_COLORS[p]}`}>
                {p}
              </div>
            ))}
          </div>
        )}

        {!selected ? (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-3 border border-dashed border-border rounded-xl">
            <Info className="w-4 h-4" /> Click any element to see its full atomic profile.
          </div>
        ) : (
          <ElementDetail el={selected} onClose={() => setSelected(null)} />
        )}

        <PeriodicTrends />
      </div>
    </ToolLayout>
  );
}

/* -------------------- Periodic Trends explainer -------------------- */

type TrendDir = "left" | "right" | "up" | "down";

interface Trend {
  name: string;
  groupDir: TrendDir;   // direction along a group (vertical)
  periodDir: TrendDir;  // direction along a period (horizontal)
  reason: string;
  example: string;
  accent: string;
  ring: string;
}

const TRENDS: Trend[] = [
  {
    name: "Atomic Radius",
    groupDir: "down",
    periodDir: "left",
    reason: "Moving down a group adds a new electron shell, so the atom grows larger. Moving left to right across a period, nuclear charge increases while electrons stay in the same shell, pulling them in tighter and shrinking the atom.",
    example: "Caesium (Cs) is the largest stable atom; Helium (He) is the smallest.",
    accent: "bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 border-sky-300 dark:border-sky-700",
    ring: "ring-sky-400",
  },
  {
    name: "Ionization Energy",
    groupDir: "up",
    periodDir: "right",
    reason: "The energy needed to remove the outermost electron. It increases up a group (outer electron is closer to the nucleus and held more strongly) and increases left to right across a period (rising effective nuclear charge with no extra shell).",
    example: "Helium has the highest (~2372 kJ/mol); Caesium and Francium are the lowest.",
    accent: "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700",
    ring: "ring-rose-400",
  },
  {
    name: "Electronegativity",
    groupDir: "up",
    periodDir: "right",
    reason: "How strongly an atom attracts bonded electrons. It increases up a group and across a period for the same reasons as ionization energy: smaller size and greater effective nuclear charge.",
    example: "Fluorine is the highest (3.98 on the Pauling scale); Francium is the lowest (~0.7).",
    accent: "bg-violet-100 dark:bg-violet-950/60 text-violet-800 dark:text-violet-200 border-violet-300 dark:border-violet-700",
    ring: "ring-violet-400",
  },
  {
    name: "Electron Affinity",
    groupDir: "up",
    periodDir: "right",
    reason: "The energy released when a neutral atom gains an electron. It generally increases across a period and up a group. Halogens have the highest values because gaining one electron completes a noble-gas configuration.",
    example: "Chlorine has the highest electron affinity (~349 kJ/mol).",
    accent: "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700",
    ring: "ring-amber-400",
  },
  {
    name: "Metallic Character",
    groupDir: "down",
    periodDir: "left",
    reason: "The tendency of an atom to lose electrons and form positive ions. It increases down a group and from right to left across a period. The top-right corner is the most non-metallic; the bottom-left is the most metallic.",
    example: "Caesium and Francium are the most metallic elements; Fluorine is the least.",
    accent: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700",
    ring: "ring-emerald-400",
  },
];

function TrendIcon({ dir, className = "" }: { dir: TrendDir; className?: string }) {
  const Cmp = dir === "left" ? ArrowLeft : dir === "right" ? ArrowRight : dir === "up" ? ArrowUp : ArrowDown;
  return <Cmp className={`w-3.5 h-3.5 ${className}`} />;
}

function MiniGrid({ groupDir, periodDir }: { groupDir: TrendDir; periodDir: TrendDir }) {
  // 4x4 mini grid of empty cells with two arrows overlaid showing direction of INCREASE.
  return (
    <div className="relative w-full max-w-[150px] aspect-square mx-auto select-none">
      <div className="grid grid-cols-4 gap-0.5 w-full h-full">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="rounded-sm bg-foreground/5 dark:bg-foreground/10 border border-foreground/10" />
        ))}
      </div>
      {/* Horizontal arrow (period) */}
      <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex items-center justify-center pointer-events-none">
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-background/90 border border-border shadow-sm">
          {periodDir === "left" && <ArrowLeft className="w-3.5 h-3.5" />}
          <span className="text-[9px] font-bold uppercase tracking-wide">Period</span>
          {periodDir === "right" && <ArrowRight className="w-3.5 h-3.5" />}
        </div>
      </div>
      {/* Vertical arrow (group) */}
      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center pointer-events-none">
        <div className="flex flex-col items-center gap-0.5 px-1.5 py-2 rounded-full bg-background/90 border border-border shadow-sm">
          {groupDir === "up" && <ArrowUp className="w-3.5 h-3.5" />}
          <span className="text-[9px] font-bold uppercase tracking-wide [writing-mode:vertical-rl] rotate-180">Group</span>
          {groupDir === "down" && <ArrowDown className="w-3.5 h-3.5" />}
        </div>
      </div>
    </div>
  );
}

function PeriodicTrends() {
  return (
    <section className="mt-6 rounded-2xl border border-border bg-card overflow-hidden" data-testid="periodic-trends">
      <header className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40">
        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <TrendingUp className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-bold text-sm sm:text-base">Periodic Trends — how properties change</h3>
          <p className="text-[11px] sm:text-xs text-muted-foreground">Arrows show the direction of <b>increase</b>. The property decreases in the opposite direction.</p>
        </div>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
        {TRENDS.map((t) => (
          <article
            key={t.name}
            className={`rounded-xl border p-3 sm:p-4 flex flex-col gap-3 ${t.accent}`}
          >
            <div>
              <h4 className="font-bold text-sm sm:text-base leading-tight">{t.name}</h4>
            </div>

            <MiniGrid groupDir={t.groupDir} periodDir={t.periodDir} />

            <div className="grid grid-cols-2 gap-1.5 text-[10px] sm:text-[11px]">
              <div className="rounded-md bg-background/60 border border-border/60 px-2 py-1.5 flex items-center justify-between gap-1">
                <span className="opacity-70 font-semibold">Across period</span>
                <span className="flex items-center gap-0.5 font-bold">
                  {t.periodDir === "right" ? "Increases" : "Decreases"}
                  <TrendIcon dir={t.periodDir} />
                </span>
              </div>
              <div className="rounded-md bg-background/60 border border-border/60 px-2 py-1.5 flex items-center justify-between gap-1">
                <span className="opacity-70 font-semibold">Down group</span>
                <span className="flex items-center gap-0.5 font-bold">
                  {t.groupDir === "down" ? "Increases" : "Decreases"}
                  <TrendIcon dir={t.groupDir} />
                </span>
              </div>
            </div>

            <p className="text-[11px] sm:text-xs leading-snug opacity-90">{t.reason}</p>

            <div className="text-[10px] sm:text-[11px] rounded-md bg-background/60 border border-border/60 px-2 py-1.5">
              <span className="opacity-60 uppercase tracking-wide font-bold mr-1">e.g.</span>
              {t.example}
            </div>
          </article>
        ))}
      </div>

      {/* Quick cheat-sheet diagonal map */}
      <div className="mx-4 mb-4 rounded-xl border border-dashed border-border p-3 sm:p-4 bg-muted/30">
        <h4 className="text-xs sm:text-sm font-bold mb-2 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5" /> Quick reference
        </h4>
        <ul className="text-[11px] sm:text-xs space-y-1 text-muted-foreground leading-relaxed">
          <li><b className="text-foreground">Top-right corner</b> (F, Cl, O) — highest ionization energy, electronegativity and electron affinity; smallest atomic radius.</li>
          <li><b className="text-foreground">Bottom-left corner</b> (Cs, Fr) — largest atomic radius and most metallic; lowest ionization energy and electronegativity.</li>
          <li>Noble gases have the highest ionization energy in their period due to a fully filled, stable electron shell.</li>
          <li>Exception: ionization energy dips slightly from Group 2 to Group 13 (B is lower than Be) because the first electron of the p-orbital is easier to remove.</li>
          <li>Exception: ionization energy dips slightly from Group 15 to Group 16 (O is lower than N) because pairing in the p-orbital introduces electron-electron repulsion.</li>
        </ul>
      </div>
    </section>
  );
}

function ElementDetail({ el, onClose }: { el: ElementData; onClose: () => void }) {
  const style = CATEGORY_STYLES[el.category];
  const shells = useMemo(() => getShells(el.number), [el.number]);
  const block = getBlock(el);
  const totalElectrons = shells.reduce((a, b) => a + b, 0);

  return (
    <div
      className={`relative rounded-2xl border overflow-hidden ${style.cell.replace("hover:", "")}`}
      data-testid="element-detail"
    >
      {/* Decorative gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} pointer-events-none`} />

      <button
        onClick={onClose}
        className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-background/40 hover:bg-background/70 text-foreground/70 hover:text-foreground transition-colors"
        aria-label="Close"
      ><X className="w-4 h-4" /></button>

      <div className="relative p-5 grid grid-cols-1 md:grid-cols-[180px_220px_1fr] gap-5">
        {/* Big element card */}
        <div className={`rounded-2xl border p-5 text-center backdrop-blur-sm ${style.text} ${style.cell.split(" ").filter((c) => c.startsWith("border-")).join(" ")} bg-background/30`}>
          <div className="text-xs opacity-70 mb-1 flex justify-between">
            <span>#{el.number}</span>
            <span>{el.mass}</span>
          </div>
          <div className="text-6xl font-extrabold leading-none my-2">{el.symbol}</div>
          <div className="text-sm font-semibold">{el.name}</div>
          <div className="text-[10px] mt-1 opacity-60">{style.label}</div>
        </div>

        {/* Bohr diagram */}
        <div className="flex flex-col items-center">
          <div className={`w-full aspect-square ${style.text}`}>
            <BohrDiagram shells={shells} symbol={el.symbol} number={el.number} color={style.text} />
          </div>
          <p className={`text-[11px] mt-1 text-center opacity-70 ${style.text}`}>
            Electron shells: {shells.filter((s) => s > 0).join(" · ")} = {totalElectrons} e⁻
          </p>
        </div>

        {/* Details grid */}
        <div className={`min-w-0 ${style.text}`}>
          {el.note && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-background/40 backdrop-blur-sm text-sm">
              <span className="opacity-70 text-[10px] uppercase tracking-wide block mb-0.5">Did you know?</span>
              {el.note}
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
            <Detail label="Group" value={el.period <= 8 ? String(el.group) : el.category === "lanthanide" ? "Lanthanides" : "Actinides"} />
            <Detail label="Period" value={String(el.period <= 8 ? el.period : el.period === 9 ? 6 : 7)} />
            <Detail label="Block" value={`${block.toUpperCase()}-block`} />
            <Detail label="Phase (25°C)" value={cap(el.phase)} />
            <Detail label="Atomic mass" value={`${el.mass} u`} />
            <Detail label="Electron config" value={el.config} mono />
            {el.en !== undefined && <Detail label="Electronegativity" value={`${el.en} (Pauling)`} />}
            {el.radius !== undefined && <Detail label="Atomic radius" value={`${el.radius} pm`} />}
            {el.density !== undefined && <Detail label="Density" value={`${el.density} ${el.phase === "gas" ? "g/L" : "g/cm³"}`} />}
            {el.melt && <Detail label="Melting point" value={el.melt} />}
            {el.boil && <Detail label="Boiling point" value={el.boil} />}
            {el.discovered && <Detail label="Discovered" value={el.discovered} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="block text-[10px] uppercase tracking-wider opacity-60">{label}</span>
      <span className={`font-semibold ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}

function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }
