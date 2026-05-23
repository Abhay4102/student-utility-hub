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

const T_PATH =
  "M 22 14 H 78 Q 82 14 82 18 V 36 Q 82 42 76 42 H 60 Q 56 42 56 46 V 80 Q 56 86 50 86 Q 44 86 44 80 V 46 Q 44 42 40 42 H 24 Q 18 42 18 36 V 18 Q 18 14 22 14 Z";

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
        <linearGradient id="treoBg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0f1a2e" />
          <stop offset="100%" stopColor="#070d1c" />
        </linearGradient>
      </defs>

      <rect x="2" y="2" width="96" height="96" rx="14" fill="url(#treoBg)" />
      <rect x="2" y="2" width="96" height="96" rx="14" fill="none" stroke="#fbbf24" strokeWidth="0.5" strokeOpacity="0.18" />

      {/* Outer yellow */}
      <path d={T_PATH} fill="#fbbf24" />
      {/* Dark gap */}
      <path d={T_PATH} fill="#0a1020" transform="translate(50 50) scale(0.88) translate(-50 -50)" />
      {/* Middle orange */}
      <path d={T_PATH} fill="#f97316" transform="translate(50 50) scale(0.78) translate(-50 -50)" />
      {/* Dark gap */}
      <path d={T_PATH} fill="#0a1020" transform="translate(50 50) scale(0.62) translate(-50 -50)" />
      {/* Inner red core */}
      <path d={T_PATH} fill="#dc2626" transform="translate(50 50) scale(0.5) translate(-50 -50)" />
    </svg>
  );
}
