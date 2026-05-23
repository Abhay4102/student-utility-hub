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
        <linearGradient id="treoBg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0f1a2e" />
          <stop offset="100%" stopColor="#070d1c" />
        </linearGradient>
      </defs>

      {/* Dark navy badge */}
      <rect x="2" y="2" width="96" height="96" rx="16" fill="url(#treoBg)" />
      <rect x="2" y="2" width="96" height="96" rx="16" fill="none" stroke="#fbbf24" strokeWidth="0.6" strokeOpacity="0.18" />

      {/* Nested flame-colored T (3 concentric bands with dark gaps) */}
      <g strokeLinecap="round" fill="none">
        {/* OUTER yellow band */}
        <g stroke="#fbbf24" strokeWidth="14">
          <line x1="22" y1="30" x2="78" y2="30" />
          <line x1="50" y1="30" x2="50" y2="80" />
        </g>
        {/* dark gap */}
        <g stroke="#0a1020" strokeWidth="10">
          <line x1="22" y1="30" x2="78" y2="30" />
          <line x1="50" y1="30" x2="50" y2="80" />
        </g>
        {/* MIDDLE orange band */}
        <g stroke="#f97316" strokeWidth="7.5">
          <line x1="22" y1="30" x2="78" y2="30" />
          <line x1="50" y1="30" x2="50" y2="80" />
        </g>
        {/* dark gap */}
        <g stroke="#0a1020" strokeWidth="4">
          <line x1="22" y1="30" x2="78" y2="30" />
          <line x1="50" y1="30" x2="50" y2="80" />
        </g>
        {/* INNER red core */}
        <g stroke="#dc2626" strokeWidth="2.5">
          <line x1="22" y1="30" x2="78" y2="30" />
          <line x1="50" y1="30" x2="50" y2="80" />
        </g>
      </g>
    </svg>
  );
}
