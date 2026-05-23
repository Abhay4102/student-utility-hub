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
        <linearGradient id="treoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="55%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="treoShine" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Rounded badge */}
      <rect x="4" y="4" width="92" height="92" rx="24" fill="url(#treoGrad)" />
      {/* Top shine overlay */}
      <rect x="4" y="4" width="92" height="92" rx="24" fill="url(#treoShine)" />

      {/* Bold modern "T" */}
      <path
        d="M26 30
           h48
           a3 3 0 0 1 3 3
           v7
           a3 3 0 0 1 -3 3
           h-16
           v30
           a3 3 0 0 1 -3 3
           h-9
           a3 3 0 0 1 -3 -3
           v-30
           h-17
           a3 3 0 0 1 -3 -3
           v-7
           a3 3 0 0 1 3 -3
           z"
        fill="#ffffff"
      />

      {/* Triangle accent (hints at TREO = three) */}
      <path d="M68 64 L82 64 L75 78 Z" fill="#ffffff" fillOpacity="0.85" />
    </svg>
  );
}
