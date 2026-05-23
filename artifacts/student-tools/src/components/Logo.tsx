import { useRef } from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
  animated?: boolean;
}

export function Logo({
  size = 32,
  className,
  showWordmark = false,
  wordmarkClassName,
  animated = true,
}: LogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} animated={animated} />
      {showWordmark && (
        <span className={cn("font-bold tracking-tight text-foreground", wordmarkClassName)}>
          TREO TOOL&apos;S
        </span>
      )}
    </div>
  );
}

function LogoMark({ size, animated }: { size: number; animated: boolean }) {
  const ref = useRef<SVGSVGElement>(null);
  const timerRef = useRef<number | null>(null);

  const triggerSpin = () => {
    const el = ref.current;
    if (!el) return;
    el.classList.add("treo-spinning");
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      el.classList.remove("treo-spinning");
    }, 2800);
  };

  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="TREO TOOL'S logo"
      className={animated ? "treo-logo" : undefined}
      style={{ flexShrink: 0, overflow: "visible" }}
      onClick={animated ? triggerSpin : undefined}
      onTouchStart={animated ? triggerSpin : undefined}
    >
      <defs>
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

      <g className="treo-prism" transform="translate(50 54)">
        <path className="treo-face" d="M0 -46 L-42 26 L0 6 Z" fill="url(#treoFace1)" />
        <path className="treo-face treo-face-2" d="M0 -46 L42 26 L0 6 Z" fill="url(#treoFace2)" />
        <path className="treo-face treo-face-3" d="M-42 26 L42 26 L0 6 Z" fill="url(#treoFace3)" />
        <path
          d="M0 -46 L-42 26 L42 26 Z M0 -46 L0 6 M-42 26 L0 6 M42 26 L0 6"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.35"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
