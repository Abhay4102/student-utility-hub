import { Link } from "wouter";
import { ChevronRight, ListChecks, Sparkles, HelpCircle, ArrowUpRight } from "lucide-react";
import type { SeoEntry } from "@/lib/seo";

interface ToolContentProps {
  seo: SeoEntry;
}

export function ToolContent({ seo }: ToolContentProps) {
  if (seo.noContent) return null;
  const { intro, howToSteps, benefits, faqs, related } = seo;
  if (!intro && !howToSteps?.length && !benefits?.length && !faqs?.length && !related?.length) {
    return null;
  }

  return (
    <section className="mt-12 space-y-10 text-foreground" aria-label="About this tool">
      {intro ? (
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <p className="text-base leading-relaxed text-muted-foreground">{intro}</p>
        </div>
      ) : null}

      {howToSteps && howToSteps.length > 0 ? (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ListChecks className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">How to use</h2>
          </div>
          <ol className="space-y-2.5">
            {howToSteps.map((step, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-semibold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed text-foreground/90">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {benefits && benefits.length > 0 ? (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">Benefits</h2>
          </div>
          <ul className="space-y-2">
            {benefits.map((b, i) => (
              <li key={i} className="flex gap-2.5 items-start">
                <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="text-sm leading-relaxed text-foreground/90">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {faqs && faqs.length > 0 ? (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <details
                key={i}
                className="group rounded-xl border border-card-border bg-card/40 p-4 transition-colors hover:bg-card/70"
              >
                <summary className="cursor-pointer list-none flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-foreground">{f.q}</h3>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5 transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      ) : null}

      {related && related.length > 0 ? (
        <div>
          <h2 className="text-xl font-bold mb-3">Related tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {related.map((r, i) => (
              <Link
                key={i}
                href={r.href}
                className="group flex items-center justify-between rounded-xl border border-card-border bg-card/40 px-4 py-3 hover:bg-card/80 hover:border-primary/40 transition-all"
              >
                <span className="text-sm font-medium text-foreground">{r.title}</span>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
