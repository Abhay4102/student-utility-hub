import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";

const SESSION_KEY = "treo-splash-shown";
const DURATION_MS = 2800;

const BRAND = "TREO TOOL'S";

export function WelcomePopup() {
  const [open, setOpen] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    let shown = false;
    try { shown = sessionStorage.getItem(SESSION_KEY) === "1"; } catch { /* ignore */ }
    if (shown) return;
    try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* ignore */ }

    setOpen(true);

    const fadeT = window.setTimeout(() => setFadingOut(true), DURATION_MS - 500);
    const closeT = window.setTimeout(() => setOpen(false), DURATION_MS);

    return () => {
      window.clearTimeout(fadeT);
      window.clearTimeout(closeT);
    };
  }, []);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-background transition-opacity duration-500 pointer-events-none ${
        fadingOut ? "opacity-0" : "opacity-100"
      }`}
      aria-hidden="true"
      data-testid="welcome-splash"
    >
      {/* Animated gradient backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.18),transparent_60%)] animate-[bgPulse_2.8s_ease-out_forwards]" />

      {/* Concentric expanding rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="absolute h-40 w-40 rounded-full border border-primary/40 animate-[ringExpand_2.2s_ease-out_0.0s_forwards] opacity-0" />
        <span className="absolute h-40 w-40 rounded-full border border-primary/30 animate-[ringExpand_2.2s_ease-out_0.35s_forwards] opacity-0" />
        <span className="absolute h-40 w-40 rounded-full border border-primary/25 animate-[ringExpand_2.2s_ease-out_0.7s_forwards] opacity-0" />
      </div>

      {/* Floating sparkles */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <span
            key={i}
            className="absolute h-1.5 w-1.5 rounded-full bg-primary/70 shadow-[0_0_8px_2px_hsl(var(--primary)/0.6)] opacity-0"
            style={{
              animation: `sparkle 1.8s ease-out ${0.5 + i * 0.08}s forwards`,
              transform: `rotate(${i * 45}deg) translateY(-90px)`,
            }}
          />
        ))}
      </div>

      <div className="relative flex flex-col items-center">
        {/* Soft glow halo behind logo */}
        <div className="absolute inset-0 -m-10 rounded-full bg-primary/30 blur-3xl animate-[haloPulse_2.4s_ease-in-out_infinite]" />

        {/* Logo with entrance animation */}
        <div className="relative animate-[logoEntrance_1.4s_cubic-bezier(0.22,1,0.36,1)_forwards] opacity-0">
          <Logo size={104} />
        </div>

        {/* Brand name - letter by letter reveal */}
        <p className="relative mt-6 flex text-2xl font-extrabold tracking-[0.22em] text-foreground">
          {BRAND.split("").map((char, i) => (
            <span
              key={i}
              className="inline-block opacity-0"
              style={{
                animation: `letterReveal 0.6s cubic-bezier(0.22,1,0.36,1) ${0.9 + i * 0.05}s forwards`,
                minWidth: char === " " ? "0.4em" : undefined,
              }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </p>

        {/* Tagline fades in last */}
        <p
          className="relative mt-3 text-xs uppercase tracking-[0.35em] text-muted-foreground opacity-0"
          style={{ animation: "fadeIn 0.7s ease-out 1.7s forwards" }}
        >
          Student Toolkit
        </p>

        {/* Loading bar */}
        <div className="relative mt-8 h-[2px] w-48 overflow-hidden rounded-full bg-primary/15">
          <span className="absolute inset-y-0 left-0 w-full origin-left scale-x-0 bg-gradient-to-r from-primary/50 via-primary to-primary/50 animate-[loadBar_2.2s_cubic-bezier(0.4,0,0.2,1)_0.4s_forwards]" />
        </div>
      </div>

      <style>{`
        @keyframes logoEntrance {
          0%   { transform: rotate(-180deg) scale(0.3); opacity: 0; filter: blur(8px); }
          50%  { opacity: 1; filter: blur(0); }
          100% { transform: rotate(0deg) scale(1); opacity: 1; filter: blur(0); }
        }
        @keyframes letterReveal {
          0%   { opacity: 0; transform: translateY(12px) scale(0.9); filter: blur(4px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 0.7; transform: translateY(0); }
        }
        @keyframes haloPulse {
          0%, 100% { opacity: 0.4; transform: scale(0.9); }
          50%      { opacity: 0.85; transform: scale(1.15); }
        }
        @keyframes ringExpand {
          0%   { transform: scale(0.2); opacity: 0.9; }
          80%  { opacity: 0.3; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes sparkle {
          0%   { opacity: 0; transform: rotate(var(--rot, 0deg)) translateY(-40px) scale(0); }
          40%  { opacity: 1; transform: rotate(var(--rot, 0deg)) translateY(-90px) scale(1); }
          100% { opacity: 0; transform: rotate(var(--rot, 0deg)) translateY(-140px) scale(0.3); }
        }
        @keyframes loadBar {
          0%   { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
        @keyframes bgPulse {
          0%   { opacity: 0; }
          30%  { opacity: 1; }
          100% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
