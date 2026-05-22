import logoSrc from "@/assets/treo-logo.png";
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
      <img
        src={logoSrc}
        alt="TREO TOOL'S logo"
        width={size}
        height={size}
        className="object-contain dark:invert"
        style={{ width: size, height: size }}
      />
      {showWordmark && (
        <span className={cn("font-bold tracking-tight text-foreground", wordmarkClassName)}>
          TREO TOOL&apos;S
        </span>
      )}
    </div>
  );
}
