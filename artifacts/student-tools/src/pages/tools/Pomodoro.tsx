import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Timer, Play, Pause, RotateCcw, SkipForward, Settings as SettingsIcon,
  Plus, Trash2, CheckCircle2, Circle, Flame, Volume2, VolumeX, Bell,
} from "lucide-react";
import { toast } from "sonner";

type Phase = "focus" | "shortBreak" | "longBreak";

interface Task {
  id: string;
  text: string;
  done: boolean;
  pomodoros: number;
}

interface Settings {
  focus: number;
  shortBreak: number;
  longBreak: number;
  cyclesBeforeLong: number;
  autoStartNext: boolean;
  sound: boolean;
  notifications: boolean;
}

interface DayStats {
  date: string;
  sessions: number;
  focusMinutes: number;
}

const SETTINGS_KEY = "treo-pomodoro-settings-v1";
const TASKS_KEY = "treo-pomodoro-tasks-v1";
const STATS_KEY = "treo-pomodoro-stats-v1";

const DEFAULTS: Settings = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15,
  cyclesBeforeLong: 4,
  autoStartNext: true,
  sound: true,
  notifications: false,
};

const PHASE_META: Record<Phase, { label: string; color: string; ring: string; bg: string }> = {
  focus: { label: "Focus", color: "text-rose-500", ring: "stroke-rose-500", bg: "from-rose-500/10 to-orange-500/5" },
  shortBreak: { label: "Short Break", color: "text-emerald-500", ring: "stroke-emerald-500", bg: "from-emerald-500/10 to-teal-500/5" },
  longBreak: { label: "Long Break", color: "text-sky-500", ring: "stroke-sky-500", bg: "from-sky-500/10 to-indigo-500/5" },
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function beep(volume = 0.4) {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const playTone = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + start + 0.02);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + start + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };
    playTone(880, 0, 0.18);
    playTone(660, 0.22, 0.18);
    playTone(990, 0.44, 0.28);
    setTimeout(() => ctx.close(), 1500);
  } catch { /* ignore */ }
}

export default function Pomodoro() {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return DEFAULTS;
  });
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const raw = localStorage.getItem(TASKS_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return [];
  });
  const [stats, setStats] = useState<DayStats[]>(() => {
    try {
      const raw = localStorage.getItem(STATS_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return [];
  });

  const [phase, setPhase] = useState<Phase>("focus");
  const [timeLeft, setTimeLeft] = useState(settings.focus * 60);
  const [running, setRunning] = useState(false);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [newTask, setNewTask] = useState("");
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem(TASKS_KEY, JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); }, [stats]);

  // Reset timer when phase or its duration changes while not running.
  useEffect(() => {
    if (!running) {
      const target = phase === "focus" ? settings.focus : phase === "shortBreak" ? settings.shortBreak : settings.longBreak;
      setTimeLeft(target * 60);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, settings.focus, settings.shortBreak, settings.longBreak]);

  // Tick — pure decrement; phase-completion is handled by a separate effect watching timeLeft.
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  // Stable ref to handlePhaseComplete so the watcher effect doesn't re-fire on every render.
  const phaseCompleteRef = useRef<() => void>(() => {});

  // Watcher — when timeLeft hits 0 mid-run, advance the phase.
  useEffect(() => {
    if (running && timeLeft === 0) phaseCompleteRef.current();
  }, [running, timeLeft]);

  // Wake lock — prevent screen sleep while running (mobile).
  useEffect(() => {
    let cancelled = false;
    async function acquire() {
      try {
        if ("wakeLock" in navigator) {
          const lock = await (navigator as Navigator & { wakeLock: { request: (t: "screen") => Promise<WakeLockSentinel> } }).wakeLock.request("screen");
          if (cancelled) { try { await lock.release(); } catch { /* ignore */ } return; }
          wakeLockRef.current = lock;
        }
      } catch { /* ignore */ }
    }
    async function release() {
      const lock = wakeLockRef.current;
      wakeLockRef.current = null;
      if (lock) { try { await lock.release(); } catch { /* ignore */ } }
    }
    if (running) acquire();
    else release();
    const onVis = () => { if (document.visibilityState === "visible" && running && !wakeLockRef.current) acquire(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      release();
    };
  }, [running]);

  // Document title shows time + phase.
  useEffect(() => {
    const original = document.title;
    if (running || timeLeft < (phase === "focus" ? settings.focus : phase === "shortBreak" ? settings.shortBreak : settings.longBreak) * 60) {
      document.title = `${fmt(timeLeft)} • ${PHASE_META[phase].label} — TREO`;
    }
    return () => { document.title = original; };
  }, [timeLeft, phase, running, settings]);

  function handlePhaseComplete() {
    if (settings.sound) beep();
    if (settings.notifications && "Notification" in window && Notification.permission === "granted") {
      try { new Notification(`${PHASE_META[phase].label} complete!`, { body: phase === "focus" ? "Great work! Time for a break." : "Break over — back to focus." }); } catch { /* ignore */ }
    }
    if (phase === "focus") {
      const newCycles = completedCycles + 1;
      setCompletedCycles(newCycles);
      // Update stats.
      const today = todayKey();
      setStats((prev) => {
        const idx = prev.findIndex((s) => s.date === today);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], sessions: updated[idx].sessions + 1, focusMinutes: updated[idx].focusMinutes + settings.focus };
          return updated;
        }
        return [{ date: today, sessions: 1, focusMinutes: settings.focus }, ...prev].slice(0, 30);
      });
      // Increment task pomodoros.
      if (activeTaskId) {
        setTasks((ts) => ts.map((t) => t.id === activeTaskId ? { ...t, pomodoros: t.pomodoros + 1 } : t));
      }
      const isLong = newCycles % settings.cyclesBeforeLong === 0;
      const next: Phase = isLong ? "longBreak" : "shortBreak";
      setPhase(next);
      setTimeLeft((next === "shortBreak" ? settings.shortBreak : settings.longBreak) * 60);
      toast.success(isLong ? "Focus done — take a long break! 🌴" : "Focus done — short break time ☕");
    } else {
      setPhase("focus");
      setTimeLeft(settings.focus * 60);
      toast.success("Break over — let's focus 🎯");
    }
    setRunning(settings.autoStartNext);
  }

  phaseCompleteRef.current = handlePhaseComplete;

  function toggle() {
    if (timeLeft === 0) reset();
    setRunning((r) => !r);
  }

  function reset() {
    setRunning(false);
    const target = phase === "focus" ? settings.focus : phase === "shortBreak" ? settings.shortBreak : settings.longBreak;
    setTimeLeft(target * 60);
  }

  function skip() {
    setRunning(false);
    setTimeLeft(0);
    handlePhaseComplete();
  }

  function requestNotifPermission() {
    if (!("Notification" in window)) {
      toast.error("Notifications not supported on this browser");
      return;
    }
    Notification.requestPermission().then((p) => {
      if (p === "granted") {
        setSettings((s) => ({ ...s, notifications: true }));
        toast.success("Notifications enabled");
      } else {
        toast.error("Permission denied");
      }
    });
  }

  const addTask = useCallback(() => {
    const text = newTask.trim();
    if (!text) return;
    setTasks((ts) => [{ id: crypto.randomUUID(), text, done: false, pomodoros: 0 }, ...ts]);
    setNewTask("");
  }, [newTask]);

  const totalDuration = useMemo(() =>
    (phase === "focus" ? settings.focus : phase === "shortBreak" ? settings.shortBreak : settings.longBreak) * 60,
    [phase, settings],
  );
  const progress = totalDuration > 0 ? (totalDuration - timeLeft) / totalDuration : 0;
  const today = todayKey();
  const todayStats = stats.find((s) => s.date === today) ?? { date: today, sessions: 0, focusMinutes: 0 };
  const streak = useMemo(() => {
    const sorted = [...stats].sort((a, b) => b.date.localeCompare(a.date));
    let streak = 0;
    for (let i = 0; i < sorted.length; i++) {
      const expected = new Date();
      expected.setDate(expected.getDate() - i);
      if (sorted[i].date === expected.toISOString().slice(0, 10) && sorted[i].sessions > 0) streak++;
      else break;
    }
    return streak;
  }, [stats]);

  const meta = PHASE_META[phase];
  const circumference = 2 * Math.PI * 120;
  const dashOffset = circumference * (1 - progress);

  return (
    <ToolLayout
      title="Pomodoro Timer"
      description="Focus timer with tasks, statistics, sounds & wake-lock — built for serious students."
      category="Utilities"
      categoryHref="/?category=Utilities"
      icon={<Timer className="w-5 h-5" />}
      iconBg="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
    >
      <div className="space-y-6">
        {/* Phase Tabs */}
        <div className="flex gap-2 p-1 bg-muted/40 rounded-xl">
          {(["focus", "shortBreak", "longBreak"] as Phase[]).map((p) => (
            <button
              key={p}
              onClick={() => { setRunning(false); setPhase(p); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                phase === p ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {PHASE_META[p].label}
            </button>
          ))}
        </div>

        {/* Timer Circle */}
        <div className={`relative rounded-2xl border border-card-border bg-gradient-to-br ${meta.bg} p-8 flex flex-col items-center`}>
          <svg width="280" height="280" viewBox="0 0 280 280" className="-rotate-90">
            <circle cx="140" cy="140" r="120" strokeWidth="10" className="stroke-muted/30" fill="none" />
            <circle
              cx="140" cy="140" r="120" strokeWidth="10" fill="none" strokeLinecap="round"
              className={`${meta.ring} transition-all duration-500`}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-sm font-medium ${meta.color} mb-2`}>{meta.label}</div>
            <div className="text-6xl sm:text-7xl font-bold tabular-nums text-foreground tracking-tight">{fmt(timeLeft)}</div>
            <div className="mt-2 text-xs text-muted-foreground">Cycle {completedCycles + (phase === "focus" ? 1 : 0)} • {Math.round(progress * 100)}%</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="lg" onClick={reset} aria-label="Reset"><RotateCcw className="w-5 h-5" /></Button>
          <Button size="lg" onClick={toggle} className="px-10 h-14 text-base font-semibold">
            {running ? <><Pause className="w-5 h-5 mr-2" /> Pause</> : <><Play className="w-5 h-5 mr-2" /> Start</>}
          </Button>
          <Button variant="outline" size="lg" onClick={skip} aria-label="Skip"><SkipForward className="w-5 h-5" /></Button>
        </div>

        {/* Today Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-card-border bg-card p-4 text-center">
            <div className="text-xs text-muted-foreground mb-1">Today</div>
            <div className="text-2xl font-bold text-foreground">{todayStats.sessions}</div>
            <div className="text-xs text-muted-foreground">sessions</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4 text-center">
            <div className="text-xs text-muted-foreground mb-1">Focus time</div>
            <div className="text-2xl font-bold text-foreground">{todayStats.focusMinutes}m</div>
            <div className="text-xs text-muted-foreground">today</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4 text-center">
            <div className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1"><Flame className="w-3 h-3 text-orange-500" /> Streak</div>
            <div className="text-2xl font-bold text-foreground">{streak}</div>
            <div className="text-xs text-muted-foreground">days</div>
          </div>
        </div>

        {/* Tasks */}
        <div className="rounded-xl border border-card-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Today's tasks</h3>
            <span className="text-xs text-muted-foreground">{tasks.filter((t) => t.done).length}/{tasks.length} done</span>
          </div>
          <div className="flex gap-2 mb-3">
            <Input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addTask(); }}
              placeholder="What will you work on?"
              className="flex-1"
            />
            <Button onClick={addTask} size="icon"><Plus className="w-4 h-4" /></Button>
          </div>
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No tasks yet — add one above.</p>
          ) : (
            <ul className="space-y-1.5">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                    activeTaskId === task.id ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted/40"
                  }`}
                >
                  <button
                    onClick={() => setTasks((ts) => ts.map((t) => t.id === task.id ? { ...t, done: !t.done } : t))}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Toggle done"
                  >
                    {task.done ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => setActiveTaskId(activeTaskId === task.id ? null : task.id)}
                    className={`flex-1 text-left text-sm ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}
                  >
                    {task.text}
                  </button>
                  {task.pomodoros > 0 && (
                    <span className="text-xs text-muted-foreground tabular-nums">🍅 {task.pomodoros}</span>
                  )}
                  <button
                    onClick={() => { setTasks((ts) => ts.filter((t) => t.id !== task.id)); if (activeTaskId === task.id) setActiveTaskId(null); }}
                    className="text-muted-foreground hover:text-rose-500 transition-colors"
                    aria-label="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {activeTaskId && (
            <p className="text-xs text-muted-foreground mt-3">Active task will earn a 🍅 each completed focus session.</p>
          )}
        </div>

        {/* Settings */}
        <div className="rounded-xl border border-card-border bg-card">
          <button
            onClick={() => setShowSettings((s) => !s)}
            className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors rounded-xl"
          >
            <span className="flex items-center gap-2 font-semibold text-foreground"><SettingsIcon className="w-4 h-4" /> Settings</span>
            <span className="text-xs text-muted-foreground">{showSettings ? "Hide" : "Show"}</span>
          </button>
          {showSettings && (
            <div className="p-4 pt-0 space-y-4 border-t border-card-border">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Focus (min)</Label>
                  <Input type="number" min={1} max={120} value={settings.focus} onChange={(e) => setSettings((s) => ({ ...s, focus: Math.max(1, Math.min(120, Number(e.target.value) || 1)) }))} />
                </div>
                <div>
                  <Label className="text-xs">Short Break</Label>
                  <Input type="number" min={1} max={60} value={settings.shortBreak} onChange={(e) => setSettings((s) => ({ ...s, shortBreak: Math.max(1, Math.min(60, Number(e.target.value) || 1)) }))} />
                </div>
                <div>
                  <Label className="text-xs">Long Break</Label>
                  <Input type="number" min={1} max={60} value={settings.longBreak} onChange={(e) => setSettings((s) => ({ ...s, longBreak: Math.max(1, Math.min(60, Number(e.target.value) || 1)) }))} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Long break after every N cycles</Label>
                <Input type="number" min={2} max={10} value={settings.cyclesBeforeLong} onChange={(e) => setSettings((s) => ({ ...s, cyclesBeforeLong: Math.max(2, Math.min(10, Number(e.target.value) || 4)) }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 cursor-pointer"><Play className="w-4 h-4" /> Auto-start next phase</Label>
                <Switch checked={settings.autoStartNext} onCheckedChange={(v) => setSettings((s) => ({ ...s, autoStartNext: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 cursor-pointer">{settings.sound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />} Sound on completion</Label>
                <Switch checked={settings.sound} onCheckedChange={(v) => setSettings((s) => ({ ...s, sound: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 cursor-pointer"><Bell className="w-4 h-4" /> Browser notifications</Label>
                {settings.notifications ? (
                  <Switch checked onCheckedChange={() => setSettings((s) => ({ ...s, notifications: false }))} />
                ) : (
                  <Button variant="outline" size="sm" onClick={requestNotifPermission}>Enable</Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
