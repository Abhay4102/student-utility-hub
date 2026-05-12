import { Link } from "wouter";
import { ChevronRight, Home } from "lucide-react";

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
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground flex items-center gap-1 transition-colors">
          <Home className="w-3.5 h-3.5" />
          Home
        </Link>
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
    </div>
  );
}
