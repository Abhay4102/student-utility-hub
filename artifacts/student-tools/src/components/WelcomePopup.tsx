import { useEffect, useState } from "react";
import { X, Sparkles, Volume2, VolumeX } from "lucide-react";
import { Logo } from "@/components/Logo";

const STORAGE_KEY = "treo-welcome-shown-v1";

function playWelcomeChime() {
  try {
    const AC: typeof AudioContext | undefined =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const now = ctx.currentTime;

    // Three rising notes — a friendly "ding-ding-ding" chime.
    const notes = [
      { freq: 523.25, start: 0.0,  dur: 0.35 }, // C5
      { freq: 659.25, start: 0.12, dur: 0.4 },  // E5
      { freq: 783.99, start: 0.24, dur: 0.6 },  // G5
    ];

    for (const n of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = n.freq;

      const t0 = now + n.start;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + n.dur);

      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + n.dur + 0.05);
    }

    setTimeout(() => { ctx.close().catch(() => {}); }, 1500);
  } catch {
    // Audio may be blocked — silently ignore.
  }
}

export function WelcomePopup() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let shown = false;
    try { shown = localStorage.getItem(STORAGE_KEY) === "1"; } catch { /* ignore */ }
    if (shown) return;

    setOpen(true);
    requestAnimationFrame(() => setVisible(true));
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
  }, []);

  const close = () => {
    setVisible(false);
    window.setTimeout(() => setOpen(false), 250);
  };

  const playAndClose = () => {
    // Sound only plays as a direct result of the user's click — no autoplay.
    playWelcomeChime();
    window.setTimeout(close, 300);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to TREO TOOL'S"
      onClick={close}
      data-testid="welcome-popup"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md rounded-3xl border border-border bg-card shadow-2xl shadow-primary/20 overflow-hidden transition-all duration-300 ${
          visible ? "scale-100 translate-y-0" : "scale-95 translate-y-2"
        }`}
      >
        {/* Decorative brand background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-violet-500/20 blur-3xl" />
        </div>

        <button
          onClick={close}
          aria-label="Close welcome"
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-background/60 hover:bg-background flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          data-testid="welcome-close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative px-8 py-10 text-center">
          <div className="mx-auto mb-5 w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/30 via-violet-500/20 to-primary/10 flex items-center justify-center shadow-lg shadow-primary/30 animate-[fadeInScale_0.5s_ease-out]">
            <Logo size={64} />
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
            TREO TOOL&apos;S
          </h2>

          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            All-in-one Student Toolkit
          </div>

          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            PDF tools, image converters, AI study help, calculators and more —
            <span className="text-foreground font-medium"> 100% free</span> and runs right in your browser.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
            <button
              onClick={playAndClose}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-md shadow-primary/30"
              data-testid="welcome-continue"
              title="Play welcome chime and continue"
            >
              <Volume2 className="w-4 h-4" />
              Let&apos;s go
            </button>
            <button
              onClick={close}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-card border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
              data-testid="welcome-mute"
            >
              <VolumeX className="w-4 h-4" />
              Skip
            </button>
          </div>

          <p className="mt-5 text-[10px] text-muted-foreground/70 tracking-wider uppercase">
            #1 Trending Student App
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
