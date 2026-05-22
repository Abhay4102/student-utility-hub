import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Search, Calculator, FileImage, FileText, FileOutput, FileInput, Minimize2, Eraser,
  FilePlus, FileEdit, Lock, Unlock, Merge, Scissors, Archive, FileType2, ArrowLeftRight,
  FlaskConical, Atom, BookOpen, NotebookPen, GraduationCap, CalendarCheck,
  Sparkles, Image as ImageIcon, FileStack, Wrench, Microscope, FileSignature,
  ShieldCheck, Zap, MousePointerClick, Globe, ArrowRight, TrendingUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";

type Tool = {
  title: string;
  description: string;
  href: string;
  icon: typeof Calculator;
  color: string;
  category: string;
  badge: string;
  featured?: boolean;
};

const tools: Tool[] = [
  { title: "Study Assistant", description: "Ask any academic question — text, voice or image, get clear AI answers", href: "/ai/study-assistant", icon: BookOpen, color: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400", category: "AI", badge: "violet", featured: true },
  { title: "AI Notes Maker", description: "Generate clean, structured study notes from any topic or source text", href: "/ai/notes-maker", icon: NotebookPen, color: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400", category: "AI", badge: "violet", featured: true },
  { title: "GPA Calculator (India)", description: "Calculate CGPA, SGPA and percentage on India's 10-point grading scale", href: "/tools/gpa-calculator", icon: GraduationCap, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400", category: "Utilities", badge: "amber" },
  { title: "Attendance Calculator", description: "How many classes can you skip / must attend to stay above 75%", href: "/tools/attendance-calculator", icon: CalendarCheck, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400", category: "Utilities", badge: "amber", featured: true },
  { title: "Calculator", description: "Scientific calculator with history", href: "/calculator", icon: Calculator, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400", category: "Utilities", badge: "amber" },
  { title: "Unit Converter", description: "Convert length, weight, temperature, speed, volume & more", href: "/tools/unit-converter", icon: ArrowLeftRight, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400", category: "Utilities", badge: "amber" },
  { title: "Periodic Table", description: "All 118 elements with atomic mass, config, melting & boiling points", href: "/science/periodic-table", icon: FlaskConical, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400", category: "Science", badge: "emerald" },
  { title: "Physics Calculator", description: "Solve for any variable in 20+ physics formulas across mechanics, electricity, waves & more", href: "/science/physics-calculator", icon: Atom, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400", category: "Science", badge: "emerald" },
  { title: "JPG to PDF", description: "Convert JPG images to PDF documents", href: "/image/jpg-to-pdf", icon: FileOutput, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400", category: "Image Tools", badge: "blue" },
  { title: "PDF to JPG", description: "Extract pages from PDF as JPG images", href: "/image/pdf-to-jpg", icon: FileInput, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400", category: "Image Tools", badge: "blue" },
  { title: "JPG to PNG", description: "Convert JPG to transparent-friendly PNG", href: "/image/jpg-to-png", icon: FileImage, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400", category: "Image Tools", badge: "blue" },
  { title: "PNG to JPG", description: "Convert PNG images to JPG format", href: "/image/png-to-jpg", icon: FileImage, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400", category: "Image Tools", badge: "blue" },
  { title: "PNG to PDF", description: "Convert PNG images to PDF documents", href: "/image/png-to-pdf", icon: FileOutput, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400", category: "Image Tools", badge: "blue" },
  { title: "PDF to PNG", description: "Extract PDF pages as PNG images", href: "/image/pdf-to-png", icon: FileInput, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400", category: "Image Tools", badge: "blue" },
  { title: "Photo Resizer", description: "Resize images by pixels or compress to KB/MB", href: "/image/resize", icon: Minimize2, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400", category: "Image Tools", badge: "blue" },
  { title: "Background Remover", description: "Remove and replace image backgrounds", href: "/image/background", icon: Eraser, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400", category: "Image Tools", badge: "blue", featured: true },
  { title: "PDF Maker", description: "Create PDF files from text and content", href: "/pdf/maker", icon: FilePlus, color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", category: "PDF Tools", badge: "red" },
  { title: "PDF Editor", description: "View and annotate PDF documents", href: "/pdf/editor", icon: FileEdit, color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", category: "PDF Tools", badge: "red" },
  { title: "PDF Locker", description: "Password-protect your PDF files", href: "/pdf/lock", icon: Lock, color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", category: "PDF Tools", badge: "red" },
  { title: "PDF Unlocker", description: "Remove password protection from PDFs", href: "/pdf/unlock", icon: Unlock, color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", category: "PDF Tools", badge: "red" },
  { title: "PDF Merger", description: "Combine multiple PDFs into one file", href: "/pdf/merge", icon: Merge, color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", category: "PDF Tools", badge: "red", featured: true },
  { title: "PDF Splitter", description: "Split PDF into separate pages", href: "/pdf/split", icon: Scissors, color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", category: "PDF Tools", badge: "red" },
  { title: "PDF Compressor", description: "Reduce PDF file size efficiently", href: "/pdf/compress", icon: Archive, color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", category: "PDF Tools", badge: "red" },
  { title: "Word File Maker", description: "Create .docx Word documents with ease", href: "/docs/word-maker", icon: FileType2, color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400", category: "Document Tools", badge: "green" },
  { title: "Text to PDF", description: "Convert plain text to a PDF document", href: "/pdf/text-to-pdf", icon: FileText, color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", category: "PDF Tools", badge: "red" },
  { title: "PDF to Word", description: "Extract text from PDF and convert to editable .docx", href: "/pdf/pdf-to-word", icon: FileType2, color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", category: "PDF Tools", badge: "red" },
  { title: "Word to PDF", description: "Convert .docx Word documents to professional PDFs", href: "/pdf/word-to-pdf", icon: FileType2, color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", category: "PDF Tools", badge: "red" },
];

const categoryMeta: Record<string, { icon: typeof Calculator; gradient: string; ring: string }> = {
  AI: { icon: Sparkles, gradient: "from-violet-500/20 to-fuchsia-500/10", ring: "ring-violet-500/30" },
  "Image Tools": { icon: ImageIcon, gradient: "from-blue-500/20 to-cyan-500/10", ring: "ring-blue-500/30" },
  "PDF Tools": { icon: FileStack, gradient: "from-red-500/20 to-orange-500/10", ring: "ring-red-500/30" },
  "Document Tools": { icon: FileSignature, gradient: "from-green-500/20 to-emerald-500/10", ring: "ring-green-500/30" },
  Utilities: { icon: Wrench, gradient: "from-amber-500/20 to-yellow-500/10", ring: "ring-amber-500/30" },
  Science: { icon: Microscope, gradient: "from-emerald-500/20 to-teal-500/10", ring: "ring-emerald-500/30" },
};

const categories = ["All", "AI", "Image Tools", "PDF Tools", "Document Tools", "Utilities", "Science"];

const badgeColors: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  red: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  green: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400",
};

export default function Home() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: tools.length };
    for (const t of tools) c[t.category] = (c[t.category] ?? 0) + 1;
    return c;
  }, []);

  const featured = useMemo(() => tools.filter((t) => t.featured), []);

  const filtered = tools.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || t.category === category;
    return matchesSearch && matchesCategory;
  });

  const isSearching = search.trim().length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* ───────────────────────── HERO ───────────────────────── */}
      <div className="relative overflow-hidden border-b border-border">
        {/* Animated gradient mesh background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
          <div className="absolute -top-24 -left-24 w-[28rem] h-[28rem] rounded-full bg-primary/20 blur-3xl animate-[blob_18s_ease-in-out_infinite]" />
          <div className="absolute -bottom-24 -right-16 w-[26rem] h-[26rem] rounded-full bg-violet-500/20 blur-3xl animate-[blob_22s_ease-in-out_infinite_reverse]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[20rem] h-[20rem] rounded-full bg-fuchsia-500/10 blur-3xl animate-[blob_26s_ease-in-out_infinite]" />
          <div
            className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />
        </div>

        <div className="max-w-6xl mx-auto px-4 pt-14 pb-16 sm:pt-20 sm:pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-6">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>#1 free student toolkit · {tools.length} tools, zero uploads</span>
          </div>

          <Logo size={64} className="mx-auto mb-5 justify-center" />

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-foreground mb-3">
            TREO TOOL&apos;S
          </h1>
          <p className="text-base text-primary font-medium mb-4 tracking-wider uppercase">
            All-in-one student toolkit
          </p>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Convert files, edit PDFs, resize images, ask AI study questions and more.{" "}
            <span className="text-foreground font-semibold">100% free</span>, runs entirely in your browser.
          </p>

          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              data-testid="search-tools"
              placeholder={`Search ${tools.length} tools — try "pdf", "remove background", "gpa"…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 pr-4 h-14 text-base shadow-lg shadow-primary/5 border-2 focus-visible:ring-primary/30"
            />
          </div>

          {/* Stats bar */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {[
              { label: "Tools", value: tools.length.toString() },
              { label: "Categories", value: (categories.length - 1).toString() },
              { label: "Uploads", value: "0" },
              { label: "Free", value: "100%" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-card/60 backdrop-blur-sm px-3 py-3">
                <div className="text-2xl font-extrabold text-foreground">{s.value}</div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─────────────────────── WHY US STRIP ─────────────────────── */}
      <div className="border-b border-border bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: ShieldCheck, title: "100% Private", desc: "Files never leave your device" },
            { icon: Zap, title: "Instant", desc: "No queues, no waiting rooms" },
            { icon: MousePointerClick, title: "No sign-up", desc: "Just open and use" },
            { icon: Globe, title: "Works offline", desc: "Once the page loads, you're set" },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <f.icon className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground">{f.title}</div>
                <div className="text-xs text-muted-foreground leading-snug">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─────────────────────── CATEGORY QUICK-PICK ─────────────────────── */}
      {!isSearching && category === "All" && (
        <div className="max-w-6xl mx-auto px-4 pt-10">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">Browse by category</h2>
              <p className="text-sm text-muted-foreground">Jump straight to the kind of tool you need</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.slice(1).map((cat) => {
              const meta = categoryMeta[cat];
              const Icon = meta.icon;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  data-testid={`quick-category-${cat}`}
                  className={`group relative overflow-hidden rounded-xl border border-border bg-gradient-to-br ${meta.gradient} p-4 text-left hover:ring-2 ${meta.ring} hover:-translate-y-0.5 transition-all`}
                >
                  <Icon className="w-6 h-6 text-foreground/80 mb-2" />
                  <div className="text-sm font-semibold text-foreground">{cat}</div>
                  <div className="text-xs text-muted-foreground">{counts[cat] ?? 0} tools</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────── FEATURED TOOLS ─────────────────────── */}
      {!isSearching && category === "All" && (
        <div className="max-w-6xl mx-auto px-4 pt-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Most-used tools</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featured.map((tool) => (
              <Link key={tool.href} href={tool.href}>
                <div
                  data-testid={`featured-${tool.title.replace(/\s/g, "-").toLowerCase()}`}
                  className="group relative h-full bg-card border border-card-border rounded-xl p-5 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/40 hover:-translate-y-0.5 transition-all cursor-pointer overflow-hidden"
                >
                  <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors" />
                  <div className={`relative w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${tool.color}`}>
                    <tool.icon className="w-5 h-5" />
                  </div>
                  <h3 className="relative font-semibold text-foreground text-sm mb-1 group-hover:text-primary transition-colors">
                    {tool.title}
                  </h3>
                  <p className="relative text-xs text-muted-foreground leading-relaxed line-clamp-2">{tool.description}</p>
                  <div className="relative flex items-center gap-1 mt-3 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Open <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────── ALL TOOLS ─────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 pt-10 pb-12">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {isSearching ? "Search results" : category === "All" ? "All tools" : category}
            </h2>
            <p className="text-sm text-muted-foreground">
              {filtered.length} of {tools.length} tools
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              data-testid={`category-${cat}`}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                category === cat
                  ? "bg-primary text-primary-foreground shadow-sm border-primary"
                  : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
              }`}
            >
              {cat}
              <span className={`ml-1.5 text-[10px] font-semibold ${category === cat ? "opacity-80" : "opacity-60"}`}>
                {counts[cat] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground border border-dashed border-border rounded-2xl">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No tools found</p>
            <p className="text-sm mt-1">Try a different search term or clear the filter</p>
            {(search || category !== "All") && (
              <button
                onClick={() => { setSearch(""); setCategory("All"); }}
                className="mt-4 text-sm text-primary hover:underline font-medium"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((tool) => (
              <Link key={tool.href} href={tool.href}>
                <div
                  data-testid={`tool-card-${tool.title.replace(/\s/g, "-").toLowerCase()}`}
                  className="group relative h-full bg-card border border-card-border rounded-xl p-5 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/40 hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${tool.color}`}>
                      <tool.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                          {tool.title}
                        </h3>
                        {tool.featured && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                            Hot
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{tool.description}</p>
                      <div className="flex items-center justify-between mt-2.5">
                        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-md ${badgeColors[tool.badge]}`}>
                          {tool.category}
                        </span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ─────────────────────── FOOTER ─────────────────────── */}
      <footer className="border-t border-border bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Logo size={32} showWordmark wordmarkClassName="text-base" />
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <Link href="/about" className="hover:text-foreground transition-colors" data-testid="link-about">About</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors" data-testid="link-contact">Contact</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors" data-testid="link-privacy">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors" data-testid="link-terms">Terms of Service</Link>
              <Link href="/copyright" className="hover:text-foreground transition-colors" data-testid="link-copyright">Copyright</Link>
            </nav>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} TREO TOOL&apos;S · All tools run 100% in your browser
            </p>
            <p className="text-xs text-muted-foreground">
              Made with care for students worldwide
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%      { transform: translate(30px, -20px) scale(1.08); }
          66%      { transform: translate(-20px, 25px) scale(0.95); }
        }
      `}</style>
    </div>
  );
}
