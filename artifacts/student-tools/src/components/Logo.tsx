import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
}

export function Logo({ size = 32, className, showWordmark = false, wordmarkClassName }: LogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      {showWordmark && (
        <span className={cn("font-bold tracking-tight text-foreground", wordmarkClassName)}>
          TREO TOOL&apos;S
        </span>
      )}
    </div>
  );
}

function LogoMark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="TREO TOOL'S logo"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="treoBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f0f1e" />
          <stop offset="100%" stopColor="#020014" />
        </linearGradient>
        <linearGradient id="treoFace1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id="treoFace2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="treoFace3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#db2777" />
        </linearGradient>
      </defs>

      <rect x="2" y="2" width="96" height="96" rx="22" fill="url(#treoBg)" />

      <g transform="translate(50 52)">
        <path d="M0 -28 L-26 16 L0 4 Z" fill="url(#treoFace1)" />
        <path d="M0 -28 L26 16 L0 4 Z" fill="url(#treoFace2)" />
        <path d="M-26 16 L26 16 L0 4 Z" fill="url(#treoFace3)" />
        <path
          d="M0 -28 L-26 16 L26 16 Z M0 -28 L0 4 M-26 16 L0 4 M26 16 L0 4"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.25"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
      </g>

      <rect x="2" y="2" width="96" height="96" rx="22" fill="none" stroke="#a78bfa" strokeWidth="1" strokeOpacity="0.35" />
    </svg>
  );
}
