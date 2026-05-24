import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useSEO } from "@/hooks/useSEO";

interface InfoPageLayoutProps {
  title: string;
  subtitle?: string;
  updated?: string;
  children: React.ReactNode;
}

export function InfoPageLayout({ title, subtitle, updated, children }: InfoPageLayoutProps) {
  useSEO();
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Logo size={24} />
          <span className="font-bold tracking-tight text-foreground text-sm">TREO TOOL&apos;S</span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-card-border text-sm text-foreground hover:bg-muted/40 transition-colors"
          data-testid="link-back-home"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
        {updated && (
          <p className="text-xs text-muted-foreground/70 mt-3">Last updated: {updated}</p>
        )}
      </header>

      <article className="prose-treo space-y-5 text-sm leading-relaxed text-foreground/90">
        {children}
      </article>

      <footer className="mt-16 pt-6 border-t border-border text-xs text-muted-foreground text-center">
        © {new Date().getFullYear()} TREO TOOL&apos;S
      </footer>
    </div>
  );
}
