import { Link, useLocation } from "wouter";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useSEO } from "@/hooks/useSEO";
import { getSeo } from "@/lib/seo";
import { ToolContent } from "@/components/ToolContent";

interface ToolLayoutProps {
  title: string;
  description: string;
  category: string;
  categoryHref: string;
  icon: React.ReactNode;
  iconBg: string;
  children: React.ReactNode;
}

export function ToolLayout({ title, description, category, categoryHref, icon, iconBg, children }: ToolLayoutProps) {
  useSEO();
  const [pathname] = useLocation();
  const seo = getSeo(pathname);
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
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={categoryHref} className="hover:text-foreground transition-colors">{category}</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">{title}</span>
      </nav>

      <div className="flex items-start gap-4 mb-8">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
      </div>

      {children}

      <ToolContent seo={seo} />
    </div>
  );
}
