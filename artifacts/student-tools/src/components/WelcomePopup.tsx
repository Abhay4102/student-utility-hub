import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";

const SESSION_KEY = "treo-splash-shown";
const DURATION_MS = 2000;

let sharedCtx: AudioContext | null = null;
let tonePlayed = false;

function getCtx(): AudioContext | null {
  if (sharedCtx) return sharedCtx;
  const AC: typeof AudioContext | undefined =
    window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  try {
    sharedCtx = new AC();
    return sharedCtx;
  } catch {
    return null;
  }
}

function scheduleNotes(ctx: AudioContext) {
  const now = ctx.currentTime;
  const notes = [
    { freq: 523.25, start: 0.0, dur: 1.2 }, // C5
    { freq: 783.99, start: 0.5, dur: 1.4 }, // G5
  ];

  for (const n of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = n.freq;

    const t0 = now + n.start;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.16, t0 + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + n.dur);

    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + n.dur + 0.05);
  }
}

function playStartupTone() {
  if (tonePlayed) return;
  const ctx = getCtx();
  if (!ctx) return;

  const fire = () => {
    if (tonePlayed) return;
    if (ctx.state !== "running") return;
    tonePlayed = true;
    try {
      scheduleNotes(ctx);
    } catch {
      tonePlayed = false;
    }
  };

  if (ctx.state === "suspended") {
    ctx.resume().then(fire).catch(() => { /* still blocked, wait for interaction */ });
  } else {
    fire();
  }
}

export function WelcomePopup() {
  const [open, setOpen] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    let shown = false;
    try { shown = sessionStorage.getItem(SESSION_KEY) === "1"; } catch { /* ignore */ }
    if (shown) return;
    try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* ignore */ }

    setOpen(true);
    playStartupTone();

    // If the browser blocked autoplay before any user gesture, retry on first interaction.
    const onFirstInteract = () => {
      playStartupTone();
      window.removeEventListener("pointerdown", onFirstInteract);
      window.removeEventListener("keydown", onFirstInteract);
    };
    window.addEventListener("pointerdown", onFirstInteract, { once: true });
    window.addEventListener("keydown", onFirstInteract, { once: true });

    const fadeT = window.setTimeout(() => setFadingOut(true), DURATION_MS - 400);
    const closeT = window.setTimeout(() => setOpen(false), DURATION_MS);

    return () => {
      window.clearTimeout(fadeT);
      window.clearTimeout(closeT);
      window.removeEventListener("pointerdown", onFirstInteract);
      window.removeEventListener("keydown", onFirstInteract);
    };
  }, []);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-400 pointer-events-none ${
        fadingOut ? "opacity-0" : "opacity-100"
      }`}
      aria-hidden="true"
      data-testid="welcome-splash"
    >
      <div className="relative flex flex-col items-center">
        {/* Soft glow halo */}
        <div className="absolute inset-0 -m-8 rounded-full bg-primary/20 blur-3xl animate-[pulseGlow_2s_ease-in-out_infinite]" />

        {/* Spinning logo */}
        <div className="relative animate-[spinSlow_2s_linear] [animation-iteration-count:1]">
          <Logo size={96} />
        </div>

        {/* Wordmark fades in shortly after the logo starts spinning */}
        <p className="relative mt-5 text-xl font-extrabold tracking-[0.2em] text-foreground animate-[fadeUp_1s_ease-out_0.4s_both]">
          TREO TOOL&apos;S
        </p>
      </div>

      <style>{`
        @keyframes spinSlow {
          from { transform: rotate(0deg) scale(0.92); opacity: 0; }
          20%  { opacity: 1; }
          to   { transform: rotate(360deg) scale(1); opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.35; transform: scale(0.95); }
          50%      { opacity: 0.7;  transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
