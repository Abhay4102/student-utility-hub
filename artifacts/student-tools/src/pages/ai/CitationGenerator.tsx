import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Quote, Copy, Check, RotateCcw, Plus, Trash2, Download, BookOpen, Globe, Newspaper, Film, GraduationCap } from "lucide-react";
import { toast } from "sonner";

type SourceType = "book" | "journal" | "website" | "newspaper" | "video";
type Style = "apa" | "mla" | "harvard" | "chicago" | "ieee" | "vancouver";

interface Author { first: string; last: string }

interface Source {
  type: SourceType;
  authors: Author[];
  year: string;
  title: string;
  publisher: string;        // book publisher, website name, newspaper, channel
  city: string;             // book city
  url: string;
  accessed: string;         // ISO date
  journal: string;
  volume: string;
  issue: string;
  pages: string;
  doi: string;
}

const STYLES: Array<{ id: Style; label: string }> = [
  { id: "apa",       label: "APA 7" },
  { id: "mla",       label: "MLA 9" },
  { id: "harvard",   label: "Harvard" },
  { id: "chicago",   label: "Chicago" },
  { id: "ieee",      label: "IEEE" },
  { id: "vancouver", label: "Vancouver" },
];

const TYPE_META: Record<SourceType, { label: string; icon: typeof BookOpen; hint: string }> = {
  book:      { label: "Book",      icon: BookOpen,       hint: "Books, textbooks, edited volumes" },
  journal:   { label: "Journal",   icon: GraduationCap,  hint: "Academic journal article" },
  website:   { label: "Website",   icon: Globe,          hint: "Web page or online article" },
  newspaper: { label: "Newspaper", icon: Newspaper,      hint: "Newspaper or magazine article" },
  video:     { label: "Video",     icon: Film,           hint: "YouTube, lecture or online video" },
};

function emptySource(type: SourceType = "website"): Source {
  return {
    type,
    authors: [{ first: "", last: "" }],
    year: "", title: "", publisher: "", city: "", url: "",
    accessed: new Date().toISOString().slice(0, 10),
    journal: "", volume: "", issue: "", pages: "", doi: "",
  };
}

/* -------- helpers -------- */

function cleanList(authors: Author[]): Author[] {
  return authors.filter((a) => (a.first.trim() || a.last.trim()));
}

function initials(name: string): string {
  return name.trim().split(/\s+/).map((p) => p[0]?.toUpperCase() + ".").join(" ");
}

function authorsAPA(authors: Author[]): string {
  const list = cleanList(authors);
  if (!list.length) return "";
  const formatted = list.map((a) => `${a.last}, ${initials(a.first)}`);
  if (formatted.length === 1) return formatted[0];
  if (formatted.length <= 20) {
    return formatted.slice(0, -1).join(", ") + ", & " + formatted[formatted.length - 1];
  }
  return formatted.slice(0, 19).join(", ") + ", … " + formatted[formatted.length - 1];
}

function authorsMLA(authors: Author[]): string {
  const list = cleanList(authors);
  if (!list.length) return "";
  if (list.length === 1) return `${list[0].last}, ${list[0].first}`;
  if (list.length === 2) return `${list[0].last}, ${list[0].first}, and ${list[1].first} ${list[1].last}`;
  return `${list[0].last}, ${list[0].first}, et al`;
}

function authorsHarvard(authors: Author[]): string {
  const list = cleanList(authors);
  if (!list.length) return "";
  const formatted = list.map((a) => `${a.last}, ${initials(a.first)}`);
  if (formatted.length === 1) return formatted[0];
  if (formatted.length <= 3) return formatted.slice(0, -1).join(", ") + " and " + formatted[formatted.length - 1];
  return `${formatted[0]} et al.`;
}

function authorsChicago(authors: Author[]): string {
  const list = cleanList(authors);
  if (!list.length) return "";
  if (list.length === 1) return `${list[0].last}, ${list[0].first}`;
  const first = `${list[0].last}, ${list[0].first}`;
  const rest = list.slice(1).map((a) => `${a.first} ${a.last}`);
  if (list.length <= 10) return [first, ...rest.slice(0, -1)].join(", ") + ", and " + rest[rest.length - 1];
  return `${first} et al.`;
}

function authorsIEEE(authors: Author[]): string {
  const list = cleanList(authors);
  if (!list.length) return "";
  const formatted = list.map((a) => `${initials(a.first)} ${a.last}`);
  if (formatted.length === 1) return formatted[0];
  if (formatted.length <= 6) return formatted.slice(0, -1).join(", ") + ", and " + formatted[formatted.length - 1];
  return `${formatted[0]} et al.`;
}

function authorsVancouver(authors: Author[]): string {
  const list = cleanList(authors);
  if (!list.length) return "";
  const formatted = list.map((a) => `${a.last} ${a.first.trim().split(/\s+/).map((p) => p[0]?.toUpperCase()).join("")}`);
  if (formatted.length <= 6) return formatted.join(", ");
  return formatted.slice(0, 6).join(", ") + ", et al";
}

function italic(s: string) { return s ? `*${s}*` : ""; }
function fmtDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
/** Join non-empty fragments with single spaces, then collapse stray punctuation. */
function assemble(parts: Array<string | false | null | undefined>): string {
  const out = parts.filter((p): p is string => typeof p === "string" && p.trim().length > 0).join(" ");
  return out
    .replace(/\s+([,;.:])/g, "$1")   // no space before punctuation
    .replace(/([,;:])\s*\./g, ".")   // ",." → "."
    .replace(/\.{2,}/g, ".")          // multiple dots
    .replace(/\s{2,}/g, " ")          // double spaces
    .replace(/,\s*,/g, ",")           // double commas
    .replace(/^[,;:.\s]+/, "")        // leading punctuation
    .replace(/[,;:\s]+$/, ".")        // tidy trailing
    .trim();
}
/** End with single period. */
function period(s: string): string {
  const t = s.trim().replace(/[.,;:\s]+$/, "");
  return t ? t + "." : "";
}

/* -------- citation builders (return markdown-ish: *italic*) -------- */

function buildAPA(s: Source): string {
  const a = authorsAPA(s.authors);
  const year = `(${s.year || "n.d."}).`;
  switch (s.type) {
    case "book": {
      // APA 7: drop city; only publisher
      return assemble([
        a && period(a), year, period(italic(s.title)), period(s.publisher),
      ]);
    }
    case "journal": {
      const jrnl = s.journal
        ? italic(s.journal) + (s.volume ? `, ${italic(s.volume)}` : "") + (s.issue ? `(${s.issue})` : "") + (s.pages ? `, ${s.pages}` : "")
        : "";
      const doi = s.doi
        ? `https://doi.org/${s.doi.replace(/^https?:\/\/doi\.org\//, "")}`
        : (s.url || "");
      return assemble([a && period(a), year, period(s.title), period(jrnl), doi]);
    }
    case "website":
      return assemble([a && period(a), year, period(italic(s.title)), s.publisher && period(s.publisher), s.url]);
    case "newspaper":
      return assemble([a && period(a), year, period(s.title), period(italic(s.publisher)), s.url]);
    case "video":
      return assemble([a && period(a), year, period(italic(s.title) + " [Video]"), s.publisher && period(s.publisher), s.url]);
  }
}

function buildMLA(s: Source): string {
  const a = authorsMLA(s.authors);
  const qTitle = s.title ? `"${s.title}."` : "";
  switch (s.type) {
    case "book": {
      const pub = [s.publisher, s.year].filter(Boolean).join(", ");
      return assemble([a && period(a), period(italic(s.title)), period(pub)]);
    }
    case "journal": {
      const vi = [s.volume && `vol. ${s.volume}`, s.issue && `no. ${s.issue}`, s.year, s.pages && `pp. ${s.pages}`].filter(Boolean).join(", ");
      const doi = s.doi ? `doi:${s.doi.replace(/^https?:\/\/doi\.org\//, "")}.` : "";
      const block = [italic(s.journal), vi].filter(Boolean).join(", ");
      return assemble([a && period(a), qTitle, period(block), doi]);
    }
    case "website":
    case "newspaper": {
      const block = [italic(s.publisher), s.year, s.url].filter(Boolean).join(", ");
      return assemble([a && period(a), qTitle, period(block)]);
    }
    case "video": {
      const block = [italic(s.publisher), s.year, s.url].filter(Boolean).join(", ");
      return assemble([a && period(a), qTitle, period(block)]);
    }
  }
}

function buildHarvard(s: Source): string {
  const a = authorsHarvard(s.authors);
  const year = `(${s.year || "n.d."})`;
  switch (s.type) {
    case "book": {
      const pub = [s.city, s.publisher].filter(Boolean).join(": ");
      return assemble([a, period(year), period(italic(s.title)), period(pub)]);
    }
    case "journal": {
      const vi = [s.volume, s.issue && `(${s.issue})`].filter(Boolean).join("");
      const tail = [italic(s.journal) + (vi ? `, ${vi}` : ""), s.pages && `pp. ${s.pages}`].filter(Boolean).join(", ");
      return assemble([a, period(year), period(s.title), period(tail)]);
    }
    case "website":
      return assemble([
        a, period(year), period(italic(s.title)),
        s.publisher && period(s.publisher),
        s.url && `Available at: ${s.url}`,
        s.accessed && `(Accessed: ${fmtDate(s.accessed)}).`,
      ]);
    case "newspaper":
      return assemble([
        a, period(year), period(s.title), period(italic(s.publisher)),
        s.url && `Available at: ${s.url}.`,
      ]);
    case "video":
      return assemble([
        a, period(year), period(italic(s.title) + " [video]"),
        s.publisher && period(s.publisher),
        s.url && `Available at: ${s.url}.`,
      ]);
  }
}

function buildChicago(s: Source): string {
  const a = authorsChicago(s.authors);
  switch (s.type) {
    case "book": {
      const pub = [s.city && `${s.city}:`, s.publisher, s.year].filter(Boolean).join(" ").replace(/,\s*$/, "").trim();
      const pubFmt = [s.city && `${s.city}:`, s.publisher].filter(Boolean).join(" ");
      const combined = [pubFmt, s.year].filter(Boolean).join(", ");
      return assemble([a && period(a), period(italic(s.title)), period(combined || pub)]);
    }
    case "journal": {
      const vi = [s.volume, s.issue && `no. ${s.issue}`].filter(Boolean).join(", ");
      const yr = s.year ? `(${s.year})` : "";
      const pg = s.pages ? `: ${s.pages}` : "";
      const block = [italic(s.journal), vi, yr].filter(Boolean).join(" ") + pg;
      return assemble([a && period(a), s.title && period(`"${s.title}"`), period(block)]);
    }
    case "website": {
      const meta = [s.publisher, s.year].filter(Boolean).join(", ");
      return assemble([a && period(a), s.title && period(`"${s.title}"`), period(meta), s.url]);
    }
    case "newspaper": {
      const meta = [italic(s.publisher), s.year].filter(Boolean).join(", ");
      return assemble([a && period(a), s.title && period(`"${s.title}"`), period(meta), s.url]);
    }
    case "video": {
      const meta = [s.publisher, s.year].filter(Boolean).join(", ");
      return assemble([a && period(a), s.title && period(`"${s.title}"`), period(meta), "Video.", s.url]);
    }
  }
}

function buildIEEE(s: Source): string {
  const a = authorsIEEE(s.authors);
  switch (s.type) {
    case "book": {
      const pub = [s.city, s.publisher].filter(Boolean).join(": ");
      const tail = [italic(s.title), pub, s.year].filter(Boolean).join(", ");
      return assemble([a && `${a},`, period(tail)]);
    }
    case "journal": {
      const tailParts = [
        italic(s.journal),
        s.volume && `vol. ${s.volume}`,
        s.issue && `no. ${s.issue}`,
        s.pages && `pp. ${s.pages}`,
        s.year,
      ].filter(Boolean).join(", ");
      return assemble([a && `${a},`, s.title && `"${s.title},"`, period(tailParts)]);
    }
    case "website": {
      const meta = [s.publisher, s.year].filter(Boolean).join(", ");
      return assemble([
        a && `${a},`, s.title && `"${s.title},"`, period(meta),
        s.url && `[Online]. Available: ${s.url}.`,
        s.accessed && `[Accessed: ${fmtDate(s.accessed)}].`,
      ]);
    }
    case "newspaper": {
      const meta = [italic(s.publisher), s.year].filter(Boolean).join(", ");
      return assemble([a && `${a},`, s.title && `"${s.title},"`, period(meta), s.url && `[Online]. Available: ${s.url}.`]);
    }
    case "video": {
      const meta = [s.publisher, s.year].filter(Boolean).join(", ");
      return assemble([a && `${a},`, s.title && `"${s.title},"`, period(meta), "[Online Video].", s.url && `Available: ${s.url}.`]);
    }
  }
}

function buildVancouver(s: Source): string {
  const a = authorsVancouver(s.authors);
  switch (s.type) {
    case "book": {
      const pub = [s.city, s.publisher].filter(Boolean).join(": ");
      const tail = [pub, s.year].filter(Boolean).join("; ");
      return assemble([a && `${a}.`, s.title && period(s.title), period(tail)]);
    }
    case "journal": {
      const ref = [
        s.year,
        s.volume && (s.year ? `;${s.volume}` : s.volume),
        s.issue && `(${s.issue})`,
        s.pages && (s.year || s.volume || s.issue ? `:${s.pages}` : s.pages),
      ].filter(Boolean).join("");
      return assemble([a && `${a}.`, s.title && period(s.title), s.journal && period(s.journal), ref && period(ref)]);
    }
    case "website":
      return assemble([
        a && `${a}.`,
        s.title && period(`${s.title} [Internet]`),
        s.publisher && (s.year ? `${s.publisher};` : `${s.publisher}.`),
        s.year && period(s.year),
        s.url && `Available from: ${s.url}`,
      ]);
    case "newspaper":
      return assemble([
        a && `${a}.`, s.title && period(s.title), s.publisher && period(s.publisher),
        s.year && period(s.year), s.url && `Available from: ${s.url}.`,
      ]);
    case "video":
      return assemble([
        a && `${a}.`, s.title && period(`${s.title} [video]`),
        s.publisher && (s.year ? `${s.publisher};` : `${s.publisher}.`),
        s.year && period(s.year),
        s.url && `Available from: ${s.url}`,
      ]);
  }
}

const BUILDERS: Record<Style, (s: Source) => string> = {
  apa: buildAPA, mla: buildMLA, harvard: buildHarvard, chicago: buildChicago, ieee: buildIEEE, vancouver: buildVancouver,
};

/* Render markdown-ish *italic* to JSX */
function renderCit(s: string) {
  const parts = s.split(/(\*[^*]+\*)/g);
  return parts.map((p, i) => p.startsWith("*") && p.endsWith("*") ? <em key={i}>{p.slice(1, -1)}</em> : <span key={i}>{p}</span>);
}

/* -------- Component -------- */

export default function CitationGenerator() {
  const [source, setSource] = useState<Source>(emptySource("website"));
  const [style, setStyle] = useState<Style>("apa");
  const [bibliography, setBibliography] = useState<Array<{ id: string; source: Source }>>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const citation = useMemo(() => {
    if (!source.title.trim()) return "";
    try { return BUILDERS[style](source); } catch { return ""; }
  }, [source, style]);

  const allStyles = useMemo(() => {
    if (!source.title.trim()) return null;
    return STYLES.map((s) => ({ id: s.id, label: s.label, text: BUILDERS[s.id](source) }));
  }, [source]);

  const update = <K extends keyof Source>(k: K, v: Source[K]) => setSource((p) => ({ ...p, [k]: v }));

  const updateAuthor = (i: number, k: keyof Author, v: string) => {
    setSource((p) => {
      const next = [...p.authors];
      next[i] = { ...next[i], [k]: v };
      return { ...p, authors: next };
    });
  };

  const addAuthor = () => setSource((p) => ({ ...p, authors: [...p.authors, { first: "", last: "" }] }));
  const removeAuthor = (i: number) => setSource((p) => ({ ...p, authors: p.authors.filter((_, idx) => idx !== i) }));

  const addToBibliography = () => {
    if (!source.title.trim()) { toast.error("Add at least a title before saving"); return; }
    setBibliography((b) => [...b, { id: Date.now().toString(36), source: { ...source } }]);
    toast.success("Added to bibliography");
  };

  const removeFromBibliography = (id: string) => setBibliography((b) => b.filter((x) => x.id !== id));

  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text.replace(/\*/g, ""));
    setCopied(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(null), 1500);
  };

  const exportBibliography = () => {
    if (!bibliography.length) return;
    const sorted = [...bibliography].sort((a, b) => {
      const an = a.source.authors[0]?.last || a.source.title;
      const bn = b.source.authors[0]?.last || b.source.title;
      return an.localeCompare(bn);
    });
    const lines = sorted.map((b) => BUILDERS[style](b.source).replace(/\*/g, ""));
    const styleLabel = STYLES.find((s) => s.id === style)?.label || style;
    const text = `Bibliography (${styleLabel})\n\n${lines.join("\n\n")}\n`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `bibliography-${style}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ToolLayout
      title="Citation Generator"
      description="Generate APA 7, MLA 9, Harvard, Chicago, IEEE and Vancouver references for books, journals, websites, newspapers and videos"
      category="AI"
      categoryHref="/?cat=AI"
      icon={<Quote className="w-6 h-6" />}
      iconBg="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400"
    >
      {/* Source type */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Source type</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {(Object.keys(TYPE_META) as SourceType[]).map((t) => {
            const M = TYPE_META[t];
            const Icon = M.icon;
            return (
              <button
                key={t}
                data-testid={`type-${t}`}
                onClick={() => update("type", t)}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                  source.type === t ? "border-primary bg-primary/10 ring-1 ring-primary/30" : "border-border bg-card hover:bg-muted/50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-semibold">{M.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        {/* Authors */}
        <div>
          <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Author(s)</Label>
          <div className="space-y-2 mt-2">
            {source.authors.map((a, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input placeholder="First name" value={a.first} onChange={(e) => updateAuthor(i, "first", e.target.value)} className="flex-1" data-testid={`author-first-${i}`} />
                <Input placeholder="Last name" value={a.last} onChange={(e) => updateAuthor(i, "last", e.target.value)} className="flex-1" data-testid={`author-last-${i}`} />
                {source.authors.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeAuthor(i)} className="shrink-0 h-9 w-9 text-muted-foreground hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addAuthor} className="gap-1.5" data-testid="add-author">
              <Plus className="w-3.5 h-3.5" /> Add author
            </Button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label={source.type === "journal" ? "Article title" : source.type === "website" ? "Page title" : "Title"}>
            <Input value={source.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. The Effects of Climate Change…" data-testid="title-input" />
          </Field>
          <Field label="Year">
            <Input value={source.year} onChange={(e) => update("year", e.target.value)} placeholder="2024" maxLength={4} data-testid="year-input" />
          </Field>

          {source.type === "book" && (
            <>
              <Field label="Publisher"><Input value={source.publisher} onChange={(e) => update("publisher", e.target.value)} placeholder="e.g. Oxford University Press" /></Field>
              <Field label="City of publication"><Input value={source.city} onChange={(e) => update("city", e.target.value)} placeholder="e.g. London" /></Field>
            </>
          )}

          {source.type === "journal" && (
            <>
              <Field label="Journal name"><Input value={source.journal} onChange={(e) => update("journal", e.target.value)} placeholder="e.g. Nature" /></Field>
              <Field label="Volume"><Input value={source.volume} onChange={(e) => update("volume", e.target.value)} placeholder="42" /></Field>
              <Field label="Issue"><Input value={source.issue} onChange={(e) => update("issue", e.target.value)} placeholder="3" /></Field>
              <Field label="Pages"><Input value={source.pages} onChange={(e) => update("pages", e.target.value)} placeholder="120-135" /></Field>
              <Field label="DOI (optional)"><Input value={source.doi} onChange={(e) => update("doi", e.target.value)} placeholder="10.1038/s41586…" /></Field>
              <Field label="URL (if no DOI)"><Input value={source.url} onChange={(e) => update("url", e.target.value)} placeholder="https://…" /></Field>
            </>
          )}

          {source.type === "website" && (
            <>
              <Field label="Website name"><Input value={source.publisher} onChange={(e) => update("publisher", e.target.value)} placeholder="e.g. BBC News" /></Field>
              <Field label="URL"><Input value={source.url} onChange={(e) => update("url", e.target.value)} placeholder="https://…" data-testid="url-input" /></Field>
              <Field label="Date accessed"><Input type="date" value={source.accessed} onChange={(e) => update("accessed", e.target.value)} /></Field>
            </>
          )}

          {source.type === "newspaper" && (
            <>
              <Field label="Newspaper name"><Input value={source.publisher} onChange={(e) => update("publisher", e.target.value)} placeholder="e.g. The Times of India" /></Field>
              <Field label="URL"><Input value={source.url} onChange={(e) => update("url", e.target.value)} placeholder="https://…" /></Field>
            </>
          )}

          {source.type === "video" && (
            <>
              <Field label="Channel / uploader"><Input value={source.publisher} onChange={(e) => update("publisher", e.target.value)} placeholder="e.g. YouTube — Khan Academy" /></Field>
              <Field label="URL"><Input value={source.url} onChange={(e) => update("url", e.target.value)} placeholder="https://youtube.com/…" /></Field>
            </>
          )}
        </div>
      </div>

      {/* Output */}
      <div className="mt-4 grid lg:grid-cols-[1fr_220px] gap-4">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30 gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Quote className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Current style: {STYLES.find((s) => s.id === style)?.label}</span>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => copy(citation, "current")} disabled={!citation} className="gap-1.5 h-7">
                {copied === "current" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-xs">Copy</span>
              </Button>
              <Button size="sm" onClick={addToBibliography} disabled={!source.title.trim()} className="gap-1.5 h-7" data-testid="add-bibliography">
                <Plus className="w-3.5 h-3.5" /><span className="text-xs">Add to Bibliography</span>
              </Button>
            </div>
          </div>
          <div className="p-4 min-h-[100px] text-sm leading-relaxed font-serif" data-testid="citation-output">
            {citation ? renderCit(citation) : <span className="text-muted-foreground italic font-sans">Fill in the form above to see your formatted citation here…</span>}
          </div>
        </div>

        {/* All styles preview */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-border bg-muted/30">
            <span className="text-xs font-semibold text-muted-foreground">Style</span>
          </div>
          <div className="flex flex-col">
            {STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                data-testid={`style-${s.id}`}
                className={`text-left px-3 py-2 text-sm border-b border-border last:border-b-0 transition-colors ${
                  style === s.id ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted/50 text-foreground"
                }`}
              >{s.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* All styles output */}
      {allStyles && (
        <details className="mt-4 bg-card border border-border rounded-xl overflow-hidden">
          <summary className="px-4 py-3 cursor-pointer text-sm font-semibold hover:bg-muted/30">
            👁️ Show this citation in all 6 styles at once
          </summary>
          <div className="divide-y divide-border">
            {allStyles.map((s) => (
              <div key={s.id} className="p-3 flex items-start gap-3">
                <span className="text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded bg-muted text-foreground shrink-0 min-w-[80px] text-center">{s.label}</span>
                <div className="flex-1 text-sm font-serif">{renderCit(s.text)}</div>
                <Button variant="ghost" size="icon" onClick={() => copy(s.text, s.id)} className="h-7 w-7 shrink-0">
                  {copied === s.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Bibliography */}
      {bibliography.length > 0 && (
        <div className="mt-6 bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30 gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <h4 className="font-bold text-sm">Bibliography ({bibliography.length})</h4>
            </div>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={exportBibliography} className="gap-1.5 h-7" data-testid="export-bibliography">
                <Download className="w-3.5 h-3.5" /><span className="text-xs">Export .txt</span>
              </Button>
            </div>
          </div>
          <ol className="p-4 space-y-3 list-decimal list-inside font-serif text-sm">
            {bibliography.map((b) => (
              <li key={b.id} className="group">
                <span className="inline">{renderCit(BUILDERS[style](b.source))}</span>
                <button
                  onClick={() => removeFromBibliography(b.id)}
                  className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 text-xs font-sans"
                  aria-label="Remove"
                >
                  ✕
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <Button onClick={() => { setSource(emptySource(source.type)); }} variant="outline" className="gap-2" data-testid="reset-form">
          <RotateCcw className="w-4 h-4" /> Clear form
        </Button>
      </div>

      <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/30 p-4">
        <p className="text-xs sm:text-sm font-bold text-foreground mb-2">📚 How to use</p>
        <ul className="text-[11px] sm:text-xs text-muted-foreground space-y-1 leading-relaxed list-disc pl-4">
          <li>Pick the source type — book, journal article, website, newspaper or video.</li>
          <li>Fill in as much detail as you have. Empty fields are skipped gracefully.</li>
          <li>Pick your required style — APA 7, MLA 9, Harvard, Chicago, IEEE or Vancouver.</li>
          <li>Click <b>Add to Bibliography</b> to save multiple references, then export them as a single .txt file in the style you chose.</li>
          <li>Citations are generated locally on your device — nothing is sent to a server.</li>
        </ul>
      </div>
    </ToolLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}
