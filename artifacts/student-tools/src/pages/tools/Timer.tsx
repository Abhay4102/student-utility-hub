import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Clock, Timer as TimerIcon, AlarmClock, Globe2,
  Play, Pause, RotateCcw, Plus, Trash2, Flag,
} from "lucide-react";
import { toast } from "sonner";

type Tab = "stopwatch" | "countdown" | "alarm" | "world";

const TABS: { id: Tab; label: string; icon: typeof Clock }[] = [
  { id: "stopwatch", label: "Stopwatch", icon: Clock },
  { id: "countdown", label: "Timer", icon: TimerIcon },
  { id: "alarm", label: "Alarm", icon: AlarmClock },
  { id: "world", label: "World Clock", icon: Globe2 },
];

/* -------- Shared sound -------- */
function playAlarmSound(times = 3) {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const play = (freq: number, start: number, dur: number, vol = 0.4) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.02);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + start + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };
    for (let i = 0; i < times; i++) {
      const t = i * 0.5;
      play(880, t, 0.22);
      play(660, t + 0.25, 0.22);
    }
    setTimeout(() => ctx.close(), times * 600 + 500);
  } catch { /* ignore */ }
}

function notify(title: string, body: string) {
  if ("Notification" in window && Notification.permission === "granted") {
    try { new Notification(title, { body }); } catch { /* ignore */ }
  }
}

function pad(n: number, w = 2) { return String(n).padStart(w, "0"); }

/* ==================== STOPWATCH ==================== */

interface Lap { id: number; time: number; split: number; }

function Stopwatch() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // ms
  const [laps, setLaps] = useState<Lap[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const baseRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    startedAtRef.current = performance.now();
    const tick = () => {
      const start = startedAtRef.current;
      if (start !== null) setElapsed(baseRef.current + (performance.now() - start));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      const start = startedAtRef.current;
      if (start !== null) baseRef.current += performance.now() - start;
      startedAtRef.current = null;
    };
  }, [running]);

  const reset = () => { setRunning(false); baseRef.current = 0; setElapsed(0); setLaps([]); };
  const lap = () => {
    if (!running) return;
    setLaps((prev) => {
      const lastTime = prev[0]?.time ?? 0;
      return [{ id: prev.length + 1, time: elapsed, split: elapsed - lastTime }, ...prev];
    });
  };

  const h = Math.floor(elapsed / 3600000);
  const m = Math.floor((elapsed % 3600000) / 60000);
  const s = Math.floor((elapsed % 60000) / 1000);
  const ms = Math.floor((elapsed % 1000) / 10);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-card-border bg-gradient-to-br from-indigo-500/5 to-violet-500/5 p-10 flex flex-col items-center">
        <div className="font-mono text-5xl sm:text-7xl font-bold tabular-nums text-foreground tracking-tight">
          {pad(h)}:{pad(m)}:{pad(s)}<span className="text-3xl sm:text-5xl text-muted-foreground">.{pad(ms)}</span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-3">
        <Button variant="outline" size="lg" onClick={reset} disabled={!running && elapsed === 0}>
          <RotateCcw className="w-5 h-5" />
        </Button>
        <Button size="lg" onClick={() => setRunning((r) => !r)} className="px-10 h-14 text-base font-semibold">
          {running ? <><Pause className="w-5 h-5 mr-2" /> Pause</> : <><Play className="w-5 h-5 mr-2" /> Start</>}
        </Button>
        <Button variant="outline" size="lg" onClick={lap} disabled={!running}>
          <Flag className="w-5 h-5" />
        </Button>
      </div>
      {laps.length > 0 && (
        <div className="rounded-xl border border-card-border bg-card">
          <div className="px-4 py-3 border-b border-card-border flex items-center justify-between">
            <h3 className="font-semibold text-sm text-foreground">Laps ({laps.length})</h3>
            <button onClick={() => setLaps([])} className="text-xs text-muted-foreground hover:text-rose-500">Clear</button>
          </div>
          <ul className="max-h-64 overflow-y-auto divide-y divide-card-border">
            {laps.map((l) => {
              const lh = Math.floor(l.split / 3600000);
              const lm = Math.floor((l.split % 3600000) / 60000);
              const ls = Math.floor((l.split % 60000) / 1000);
              const lms = Math.floor((l.split % 1000) / 10);
              const th = Math.floor(l.time / 3600000);
              const tm = Math.floor((l.time % 3600000) / 60000);
              const ts = Math.floor((l.time % 60000) / 1000);
              return (
                <li key={l.id} className="px-4 py-2 flex items-center justify-between text-sm font-mono tabular-nums">
                  <span className="text-muted-foreground">Lap {l.id}</span>
                  <span className="text-foreground">+{pad(lh)}:{pad(lm)}:{pad(ls)}.{pad(lms)}</span>
                  <span className="text-muted-foreground text-xs">{pad(th)}:{pad(tm)}:{pad(ts)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ==================== COUNTDOWN TIMER ==================== */

const TIMER_PRESETS = [
  { label: "1 min", seconds: 60 },
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
  { label: "15 min", seconds: 900 },
  { label: "30 min", seconds: 1800 },
  { label: "45 min", seconds: 2700 },
  { label: "1 hr", seconds: 3600 },
  { label: "2 hr", seconds: 7200 },
];

function Countdown() {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [totalMs, setTotalMs] = useState(0);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(0); // ms

  const total = useMemo(() => (hours * 3600 + minutes * 60 + seconds) * 1000, [hours, minutes, seconds]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      if (endsAt === null) return;
      const ms = Math.max(0, endsAt - Date.now());
      setRemaining(ms);
      if (ms === 0) {
        setRunning(false);
        setEndsAt(null);
        playAlarmSound(4);
        notify("⏰ Timer finished!", "Your countdown is up.");
        toast.success("Timer finished! ⏰");
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [running, endsAt]);

  const start = () => {
    const base = remaining > 0 && totalMs === total ? remaining : total;
    if (base <= 0) return;
    setTotalMs(total);
    setEndsAt(Date.now() + base);
    setRemaining(base);
    setRunning(true);
  };
  const pause = () => {
    setRunning(false);
    setEndsAt(null);
  };
  const reset = () => { setRunning(false); setEndsAt(null); setRemaining(0); setTotalMs(0); };
  const usePreset = (s: number) => {
    reset();
    setHours(Math.floor(s / 3600));
    setMinutes(Math.floor((s % 3600) / 60));
    setSeconds(s % 60);
  };

  const display = running || remaining > 0 ? remaining : total;
  const dh = Math.floor(display / 3600000);
  const dm = Math.floor((display % 3600000) / 60000);
  const ds = Math.floor((display % 60000) / 1000);
  const progress = totalMs > 0 ? (totalMs - remaining) / totalMs : 0;
  const circumference = 2 * Math.PI * 120;
  const dashOffset = circumference * (1 - progress);
  const isSetup = !running && remaining === 0;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-card-border bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-8 flex flex-col items-center">
        <svg width="280" height="280" viewBox="0 0 280 280" className="-rotate-90">
          <circle cx="140" cy="140" r="120" strokeWidth="10" className="stroke-muted/30" fill="none" />
          <circle cx="140" cy="140" r="120" strokeWidth="10" fill="none" strokeLinecap="round"
            className="stroke-amber-500 transition-all duration-200"
            strokeDasharray={circumference} strokeDashoffset={isSetup ? 0 : dashOffset} />
        </svg>
        <div className="absolute flex flex-col items-center justify-center" style={{ height: 280 }}>
          <div className="font-mono text-5xl sm:text-6xl font-bold tabular-nums text-foreground tracking-tight">
            {pad(dh)}:{pad(dm)}:{pad(ds)}
          </div>
          {!isSetup && (
            <div className="mt-2 text-xs text-muted-foreground">{Math.round(progress * 100)}% complete</div>
          )}
        </div>
      </div>

      {isSetup && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Hours</Label>
              <Input type="number" min={0} max={23} value={hours} onChange={(e) => setHours(Math.max(0, Math.min(23, Number(e.target.value) || 0)))} />
            </div>
            <div>
              <Label className="text-xs">Minutes</Label>
              <Input type="number" min={0} max={59} value={minutes} onChange={(e) => setMinutes(Math.max(0, Math.min(59, Number(e.target.value) || 0)))} />
            </div>
            <div>
              <Label className="text-xs">Seconds</Label>
              <Input type="number" min={0} max={59} value={seconds} onChange={(e) => setSeconds(Math.max(0, Math.min(59, Number(e.target.value) || 0)))} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {TIMER_PRESETS.map((p) => (
              <button key={p.label} onClick={() => usePreset(p.seconds)}
                className="px-3 py-1.5 rounded-lg border border-card-border text-xs font-medium text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors">
                {p.label}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="flex items-center justify-center gap-3">
        <Button variant="outline" size="lg" onClick={reset} disabled={isSetup}>
          <RotateCcw className="w-5 h-5" />
        </Button>
        {running ? (
          <Button size="lg" onClick={pause} className="px-10 h-14 text-base font-semibold">
            <Pause className="w-5 h-5 mr-2" /> Pause
          </Button>
        ) : (
          <Button size="lg" onClick={start} disabled={total <= 0 && remaining <= 0} className="px-10 h-14 text-base font-semibold">
            <Play className="w-5 h-5 mr-2" /> {remaining > 0 ? "Resume" : "Start"}
          </Button>
        )}
      </div>
    </div>
  );
}

/* ==================== ALARM CLOCK ==================== */

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Alarm {
  id: string;
  time: string; // "HH:MM"
  label: string;
  enabled: boolean;
  repeat: number[]; // 0-6, empty = once (one-shot)
  lastFired?: string; // "YYYY-MM-DD-HH:MM"
}

const ALARMS_KEY = "treo-alarms-v1";

function Alarms() {
  const [alarms, setAlarms] = useState<Alarm[]>(() => {
    try {
      const raw = localStorage.getItem(ALARMS_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return [];
  });
  const [newTime, setNewTime] = useState("07:00");
  const [newLabel, setNewLabel] = useState("");
  const [newRepeat, setNewRepeat] = useState<number[]>([]);
  const [now, setNow] = useState(new Date());
  const [notifPerm, setNotifPerm] = useState<NotificationPermission | "unsupported">(
    "Notification" in window ? Notification.permission : "unsupported",
  );

  useEffect(() => { localStorage.setItem(ALARMS_KEY, JSON.stringify(alarms)); }, [alarms]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Check alarms each tick.
  useEffect(() => {
    const hh = pad(now.getHours());
    const mm = pad(now.getMinutes());
    const time = `${hh}:${mm}`;
    const dow = now.getDay();
    const fireKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${time}`;

    let changed = false;
    const updated = alarms.map((a) => {
      if (!a.enabled) return a;
      if (a.time !== time) return a;
      if (a.lastFired === fireKey) return a;
      const matches = a.repeat.length === 0 ? true : a.repeat.includes(dow);
      if (!matches) return a;
      changed = true;
      playAlarmSound(5);
      notify(`⏰ ${a.label || "Alarm"}`, `It's ${a.time}`);
      toast.success(`⏰ Alarm: ${a.label || a.time}`, { duration: 8000 });
      return { ...a, lastFired: fireKey, enabled: a.repeat.length === 0 ? false : true };
    });
    if (changed) setAlarms(updated);
  }, [now, alarms]);

  const addAlarm = () => {
    if (!/^\d{2}:\d{2}$/.test(newTime)) {
      toast.error("Invalid time");
      return;
    }
    setAlarms((prev) => [{
      id: crypto.randomUUID(),
      time: newTime,
      label: newLabel.trim() || "Alarm",
      enabled: true,
      repeat: [...newRepeat].sort(),
    }, ...prev]);
    setNewLabel("");
    setNewRepeat([]);
    toast.success("Alarm added");
  };

  const toggleRepeat = (d: number) => {
    setNewRepeat((r) => r.includes(d) ? r.filter((x) => x !== d) : [...r, d]);
  };

  const requestPerm = () => {
    if (!("Notification" in window)) return;
    Notification.requestPermission().then((p) => {
      setNotifPerm(p);
      if (p === "granted") toast.success("Notifications enabled");
    });
  };

  const sortedAlarms = useMemo(() => [...alarms].sort((a, b) => a.time.localeCompare(b.time)), [alarms]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-card-border bg-gradient-to-br from-rose-500/5 to-orange-500/5 p-6 flex flex-col items-center">
        <div className="text-xs text-muted-foreground mb-1">Current time</div>
        <div className="font-mono text-4xl sm:text-5xl font-bold tabular-nums text-foreground tracking-tight">
          {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          {now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
        </div>
      </div>

      {notifPerm === "default" && (
        <button onClick={requestPerm} className="w-full p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-sm flex items-center justify-between hover:bg-amber-500/15">
          <span>🔔 Enable notifications so alarms ring even when tab isn't focused</span>
          <span className="font-semibold">Enable</span>
        </button>
      )}

      {/* Add alarm */}
      <div className="rounded-xl border border-card-border bg-card p-4 space-y-3">
        <h3 className="font-semibold text-foreground">Add new alarm</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Time</Label>
            <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Label (optional)</Label>
            <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="e.g. Wake up" />
          </div>
        </div>
        <div>
          <Label className="text-xs">Repeat on (leave empty for one-time)</Label>
          <div className="grid grid-cols-7 gap-1.5 mt-1">
            {WEEKDAYS.map((d, i) => (
              <button key={d} onClick={() => toggleRepeat(i)}
                className={`py-2 rounded-md text-xs font-medium transition-colors ${
                  newRepeat.includes(i) ? "bg-primary text-primary-foreground" : "bg-muted/40 text-foreground hover:bg-muted"
                }`}>{d}</button>
            ))}
          </div>
        </div>
        <Button onClick={addAlarm} className="w-full"><Plus className="w-4 h-4 mr-2" /> Add alarm</Button>
      </div>

      {/* Alarm list */}
      {sortedAlarms.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No alarms yet.</p>
      ) : (
        <div className="rounded-xl border border-card-border bg-card divide-y divide-card-border">
          {sortedAlarms.map((a) => (
            <div key={a.id} className="p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className={`font-mono text-2xl font-bold tabular-nums ${a.enabled ? "text-foreground" : "text-muted-foreground"}`}>{a.time}</span>
                  <span className="text-sm text-muted-foreground truncate">{a.label}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {a.repeat.length === 0 ? "Once" : a.repeat.length === 7 ? "Every day" : a.repeat.map((d) => WEEKDAYS[d]).join(" · ")}
                </div>
              </div>
              <Switch checked={a.enabled} onCheckedChange={(v) => setAlarms((prev) => prev.map((x) => x.id === a.id ? { ...x, enabled: v, lastFired: v ? undefined : x.lastFired } : x))} />
              <button onClick={() => setAlarms((prev) => prev.filter((x) => x.id !== a.id))}
                className="text-muted-foreground hover:text-rose-500 transition-colors p-2" aria-label="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ==================== WORLD CLOCK ==================== */

interface City { id: string; name: string; timeZone: string; }

const POPULAR_CITIES: City[] = [
  { id: "ny", name: "New York", timeZone: "America/New_York" },
  { id: "la", name: "Los Angeles", timeZone: "America/Los_Angeles" },
  { id: "ldn", name: "London", timeZone: "Europe/London" },
  { id: "par", name: "Paris", timeZone: "Europe/Paris" },
  { id: "ber", name: "Berlin", timeZone: "Europe/Berlin" },
  { id: "dub", name: "Dubai", timeZone: "Asia/Dubai" },
  { id: "del", name: "New Delhi", timeZone: "Asia/Kolkata" },
  { id: "mum", name: "Mumbai", timeZone: "Asia/Kolkata" },
  { id: "blr", name: "Bengaluru", timeZone: "Asia/Kolkata" },
  { id: "sin", name: "Singapore", timeZone: "Asia/Singapore" },
  { id: "hkg", name: "Hong Kong", timeZone: "Asia/Hong_Kong" },
  { id: "tok", name: "Tokyo", timeZone: "Asia/Tokyo" },
  { id: "sea", name: "Seoul", timeZone: "Asia/Seoul" },
  { id: "syd", name: "Sydney", timeZone: "Australia/Sydney" },
  { id: "akl", name: "Auckland", timeZone: "Pacific/Auckland" },
  { id: "tor", name: "Toronto", timeZone: "America/Toronto" },
  { id: "sf", name: "San Francisco", timeZone: "America/Los_Angeles" },
  { id: "mex", name: "Mexico City", timeZone: "America/Mexico_City" },
  { id: "sao", name: "São Paulo", timeZone: "America/Sao_Paulo" },
  { id: "cai", name: "Cairo", timeZone: "Africa/Cairo" },
  { id: "jhb", name: "Johannesburg", timeZone: "Africa/Johannesburg" },
  { id: "ist", name: "Istanbul", timeZone: "Europe/Istanbul" },
  { id: "mos", name: "Moscow", timeZone: "Europe/Moscow" },
  { id: "bkk", name: "Bangkok", timeZone: "Asia/Bangkok" },
  { id: "shg", name: "Shanghai", timeZone: "Asia/Shanghai" },
];

const CITIES_KEY = "treo-world-cities-v1";
const DEFAULT_CITY_IDS = ["ny", "ldn", "del", "tok", "syd"];

function getOffsetLabel(timeZone: string, now: Date): string {
  try {
    const tzDate = new Date(now.toLocaleString("en-US", { timeZone }));
    const utcDate = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
    const diffMin = Math.round((tzDate.getTime() - utcDate.getTime()) / 60000);
    const sign = diffMin >= 0 ? "+" : "-";
    const abs = Math.abs(diffMin);
    return `UTC${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
  } catch { return ""; }
}

function getCityTimeParts(timeZone: string, now: Date) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone, hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit",
    weekday: "short", day: "numeric", month: "short",
  });
  const parts = fmt.formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    time: `${get("hour")}:${get("minute")}:${get("second")}`,
    date: `${get("weekday")}, ${get("day")} ${get("month")}`,
  };
}

function dayDiff(timeZone: string, now: Date): number {
  try {
    const localDay = now.getDate();
    const cityDateStr = new Intl.DateTimeFormat("en-US", { timeZone, day: "numeric" }).format(now);
    const cityDay = Number(cityDateStr);
    if (Number.isNaN(cityDay)) return 0;
    if (cityDay === localDay) return 0;
    // Compare with tomorrow / yesterday.
    const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
    if (cityDay === tomorrow.getDate()) return 1;
    const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
    if (cityDay === yesterday.getDate()) return -1;
    return 0;
  } catch { return 0; }
}

function WorldClock() {
  const [now, setNow] = useState(new Date());
  const [cityIds, setCityIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(CITIES_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return DEFAULT_CITY_IDS;
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => { localStorage.setItem(CITIES_KEY, JSON.stringify(cityIds)); }, [cityIds]);
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const selectedCities = useMemo(() => cityIds.map((id) => POPULAR_CITIES.find((c) => c.id === id)).filter((c): c is City => Boolean(c)), [cityIds]);
  const availableCities = useMemo(() => {
    const q = search.trim().toLowerCase();
    return POPULAR_CITIES.filter((c) => !cityIds.includes(c.id) && (q === "" || c.name.toLowerCase().includes(q) || c.timeZone.toLowerCase().includes(q)));
  }, [cityIds, search]);

  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-card-border bg-gradient-to-br from-sky-500/5 to-indigo-500/5 p-6 flex flex-col items-center">
        <div className="text-xs text-muted-foreground mb-1">Your local time · {localTz}</div>
        <div className="font-mono text-4xl sm:text-5xl font-bold tabular-nums text-foreground tracking-tight">
          {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          {now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </div>
      </div>

      {selectedCities.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No cities added yet.</p>
      ) : (
        <div className="space-y-2">
          {selectedCities.map((city) => {
            const t = getCityTimeParts(city.timeZone, now);
            const offset = getOffsetLabel(city.timeZone, now);
            const diff = dayDiff(city.timeZone, now);
            return (
              <div key={city.id} className="rounded-xl border border-card-border bg-card p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{city.name}</span>
                    {diff === 1 && <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">Tomorrow</span>}
                    {diff === -1 && <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">Yesterday</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">{t.date} · {offset}</div>
                </div>
                <div className="font-mono text-2xl sm:text-3xl font-bold tabular-nums text-foreground">{t.time}</div>
                <button onClick={() => setCityIds((ids) => ids.filter((id) => id !== city.id))}
                  className="text-muted-foreground hover:text-rose-500 transition-colors p-2" aria-label="Remove">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <button onClick={() => setPickerOpen((p) => !p)}
        className="w-full p-3 rounded-xl border border-dashed border-card-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors flex items-center justify-center gap-2">
        <Plus className="w-4 h-4" /> {pickerOpen ? "Close" : "Add city"}
      </button>

      {pickerOpen && (
        <div className="rounded-xl border border-card-border bg-card p-4 space-y-3">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search city or timezone…" />
          {availableCities.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">No matches{cityIds.length === POPULAR_CITIES.length ? " — all cities added!" : ""}.</p>
          ) : (
            <div className="max-h-72 overflow-y-auto grid grid-cols-2 gap-2">
              {availableCities.map((c) => (
                <button key={c.id} onClick={() => { setCityIds((ids) => [...ids, c.id]); setSearch(""); }}
                  className="text-left p-2 rounded-lg border border-card-border hover:border-primary/40 hover:bg-primary/5 transition-colors">
                  <div className="text-sm font-medium text-foreground">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.timeZone}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ==================== MAIN PAGE ==================== */

const TAB_KEY = "treo-timer-tab-v1";

export default function Timer() {
  const [tab, setTab] = useState<Tab>(() => {
    try {
      const raw = localStorage.getItem(TAB_KEY);
      if (raw && TABS.some((t) => t.id === raw)) return raw as Tab;
    } catch { /* ignore */ }
    return "stopwatch";
  });
  useEffect(() => { localStorage.setItem(TAB_KEY, tab); }, [tab]);

  return (
    <ToolLayout
      title="Timer & Clock"
      description="Stopwatch, countdown timer, alarm clock and world clock — all in one place."
      category="Utilities"
      categoryHref="/?category=Utilities"
      icon={<Clock className="w-5 h-5" />}
      iconBg="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-muted/40 rounded-xl">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  tab === t.id ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}>
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {tab === "stopwatch" && <Stopwatch />}
        {tab === "countdown" && <Countdown />}
        {tab === "alarm" && <Alarms />}
        {tab === "world" && <WorldClock />}
      </div>
    </ToolLayout>
  );
}
