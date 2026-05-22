import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";

function parseLocalDate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3];
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return dt;
}

function formatLocalISO(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

function daysInMonth(year: number, monthZeroIdx: number): number {
  return new Date(year, monthZeroIdx + 1, 0).getDate();
}

function addCalendar(base: Date, dy: number, dm: number, dd: number): Date {
  let y = base.getFullYear() + dy;
  let m = base.getMonth() + dm;
  y += Math.floor(m / 12);
  m = ((m % 12) + 12) % 12;
  const clampedDay = Math.min(base.getDate(), daysInMonth(y, m));
  const result = new Date(y, m, clampedDay);
  result.setDate(result.getDate() + dd);
  return result;
}

function diffDates(a: Date, b: Date) {
  const start = a < b ? a : b;
  const end = a < b ? b : a;
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();
  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  const totalMs = end.getTime() - start.getTime();
  const totalDays = Math.floor(totalMs / 86400000);
  const totalHours = Math.floor(totalMs / 3600000);
  const totalMinutes = Math.floor(totalMs / 60000);
  const totalWeeks = Math.floor(totalDays / 7);
  return { years, months, days, totalDays, totalWeeks, totalHours, totalMinutes };
}

const todayISO = () => formatLocalISO(new Date());

export default function DatePanel() {
  const [mode, setMode] = useState<"diff" | "add">("diff");
  const [d1, setD1] = useState(todayISO());
  const [d2, setD2] = useState(todayISO());
  const [baseDate, setBaseDate] = useState(todayISO());
  const [years, setYears] = useState("0");
  const [months, setMonths] = useState("0");
  const [days, setDays] = useState("0");
  const [direction, setDirection] = useState<"add" | "sub">("add");

  const diff = useMemo(() => {
    const a = parseLocalDate(d1);
    const b = parseLocalDate(d2);
    if (!a || !b) return null;
    return diffDates(a, b);
  }, [d1, d2]);

  const computed = useMemo(() => {
    const d = parseLocalDate(baseDate);
    if (!d) return null;
    const sign = direction === "add" ? 1 : -1;
    return addCalendar(d, sign * (parseInt(years) || 0), sign * (parseInt(months) || 0), sign * (parseInt(days) || 0));
  }, [baseDate, years, months, days, direction]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-1 mb-5">
          <button
            data-testid="mode-diff"
            onClick={() => setMode("diff")}
            className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${mode === "diff" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
          >Difference</button>
          <button
            data-testid="mode-add"
            onClick={() => setMode("add")}
            className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${mode === "add" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
          >Add / Subtract</button>
        </div>

        {mode === "diff" ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Start date</label>
              <Input data-testid="date-start" type="date" value={d1} onChange={(e) => setD1(e.target.value)} className="h-11" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">End date</label>
              <Input data-testid="date-end" type="date" value={d2} onChange={(e) => setD2(e.target.value)} className="h-11" />
            </div>
            <button
              data-testid="set-today-end"
              onClick={() => setD2(todayISO())}
              className="text-xs text-primary hover:underline font-medium"
            >Use today as end date</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Base date</label>
              <Input data-testid="date-base" type="date" value={baseDate} onChange={(e) => setBaseDate(e.target.value)} className="h-11" />
            </div>
            <div className="flex items-center gap-1">
              {(["add", "sub"] as const).map((d) => (
                <button
                  key={d}
                  data-testid={`dir-${d}`}
                  onClick={() => setDirection(d)}
                  className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${direction === d ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
                >{d === "add" ? "Add" : "Subtract"}</button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Years</label>
                <Input data-testid="years" type="number" value={years} onChange={(e) => setYears(e.target.value)} className="h-11" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Months</label>
                <Input data-testid="months" type="number" value={months} onChange={(e) => setMonths(e.target.value)} className="h-11" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Days</label>
                <Input data-testid="days" type="number" value={days} onChange={(e) => setDays(e.target.value)} className="h-11" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-foreground mb-4">Result</h3>
        {mode === "diff" ? (
          diff ? (
            <div className="space-y-3">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-5">
                <p className="text-xs text-muted-foreground mb-1">Calendar difference</p>
                <p data-testid="diff-calendar" className="text-2xl font-bold text-foreground">
                  {diff.years} year{diff.years === 1 ? "" : "s"}, {diff.months} month{diff.months === 1 ? "" : "s"}, {diff.days} day{diff.days === 1 ? "" : "s"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Total days" value={diff.totalDays.toLocaleString()} testId="total-days" />
                <Stat label="Total weeks" value={diff.totalWeeks.toLocaleString()} testId="total-weeks" />
                <Stat label="Total hours" value={diff.totalHours.toLocaleString()} testId="total-hours" />
                <Stat label="Total minutes" value={diff.totalMinutes.toLocaleString()} testId="total-minutes" />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Enter two valid dates.</p>
          )
        ) : (
          computed ? (
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-5">
              <p className="text-xs text-muted-foreground mb-1">Resulting date</p>
              <p data-testid="computed-date" className="text-2xl font-bold text-foreground">
                {computed.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
              <p className="text-xs text-muted-foreground mt-2">ISO: {formatLocalISO(computed)}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Enter a valid base date.</p>
          )
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, testId }: { label: string; value: string; testId: string }) {
  return (
    <div className="bg-muted/50 rounded-lg p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p data-testid={testId} className="text-lg font-bold text-foreground font-mono">{value}</p>
    </div>
  );
}
