import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  Search, Calculator, FileImage, FileText, FileOutput, FileInput, Minimize2, Eraser,
  FilePlus, FileEdit, Lock, Unlock, Merge, Scissors, Archive, FileType2, ArrowLeftRight,
  FlaskConical, Atom, BookOpen, NotebookPen, GraduationCap, CalendarCheck,
  Sparkles, Image as ImageIcon, FileStack, Wrench, Microscope, FileSignature,
  ArrowRight, Star, Clock, Command, X, Wand2, ScanSearch, Quote,
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
  keywords?: string[];
  featured?: boolean;
};

const tools: Tool[] = [
  { title: "Study Assistant", description: "Ask any academic question — text, voice or image, get clear AI answers", href: "/ai/study-assistant", icon: BookOpen, color: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400", category: "AI", badge: "violet", featured: true, keywords: ["ai", "tutor", "homework", "doubt", "chat", "gpt"] },
  { title: "AI Notes Maker", description: "Generate clean, structured study notes from any topic or source text", href: "/ai/notes-maker", icon: NotebookPen, color: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400", category: "AI", badge: "violet", featured: true, keywords: ["ai", "summary", "summarize", "revision", "study", "notes"] },
  { title: "AI Paraphraser", description: "Rewrite essays, paragraphs and assignments to be unique and plagiarism-safe — 7 tones", href: "/ai/paraphraser", icon: Wand2, color: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400", category: "AI", badge: "violet", featured: true, keywords: ["paraphrase", "rewrite", "plagiarism", "unique", "rewriter", "spinner", "humanize", "essay"] },
  { title: "Advanced AI Detector", description: "2-pass ensemble — statistical analysis + GPT-5.1 reasoning, with sentence-by-sentence AI highlighting", href: "/ai/ai-detector", icon: ScanSearch, color: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400", category: "AI", badge: "violet", keywords: ["ai detector", "chatgpt detector", "gptzero", "ai check", "plagiarism", "originality", "burstiness"] },
  { title: "Citation Generator", description: "APA 7, MLA 9, Harvard, Chicago, IEEE & Vancouver references for books, journals & websites", href: "/ai/citation-generator", icon: Quote, color: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400", category: "AI", badge: "violet", keywords: ["citation", "bibliography", "apa", "mla", "harvard", "ieee", "reference"] },
  { title: "GPA Calculator (India)", description: "Calculate CGPA, SGPA and percentage on India's 10-point grading scale", href: "/tools/gpa-calculator", icon: GraduationCap, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400", category: "Utilities", badge: "amber", keywords: ["gpa", "cgpa", "sgpa", "grade", "percentage", "marks"] },
  { title: "Attendance Calculator", description: "How many classes can you skip / must attend to stay above 75%", href: "/tools/attendance-calculator", icon: CalendarCheck, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400", category: "Utilities", badge: "amber", featured: true, keywords: ["attendance", "bunk", "skip", "classes", "75"] },
  { title: "Calculator", description: "Scientific calculator with history", href: "/calculator", icon: Calculator, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400", category: "Utilities", badge: "amber", keywords: ["calc", "scientific", "math", "trig", "sin", "cos", "log"] },
  { title: "Unit Converter", description: "Convert length, weight, temperature, speed, volume & more", href: "/tools/unit-converter", icon: ArrowLeftRight, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400", category: "Utilities", badge: "amber", keywords: ["convert", "meter", "kg", "celsius", "fahrenheit", "miles", "km"] },
  { title: "Periodic Table", description: "All 118 elements with atomic mass, config, melting & boiling points", href: "/science/periodic-table", icon: FlaskConical, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400", category: "Science", badge: "emerald", keywords: ["chemistry", "elements", "atomic", "mendeleev"] },
  { title: "Physics Calculator", description: "Solve for any variable in 20+ physics formulas across mechanics, electricity, waves & more", href: "/science/physics-calculator", icon: Atom, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400", category: "Science", badge: "emerald", keywords: ["physics", "formula", "mechanics", "electricity", "waves", "ohm", "newton"] },
  { title: "JPG to PDF", description: "Convert JPG images to PDF documents", href: "/image/jpg-to-pdf", icon: FileOutput, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400", category: "Image Tools", badge: "blue", keywords: ["jpg", "jpeg", "pdf", "convert", "image to pdf"] },
  { title: "PDF to JPG", description: "Extract pages from PDF as JPG images", href: "/image/pdf-to-jpg", icon: FileInput, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400", category: "Image Tools", badge: "blue", keywords: ["pdf", "jpg", "jpeg", "extract", "pages"] },
  { title: "JPG to PNG", description: "Convert JPG to transparent-friendly PNG", href: "/image/jpg-to-png", icon: FileImage, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400", category: "Image Tools", badge: "blue", keywords: ["jpg", "png", "convert", "transparent"] },
  { title: "PNG to JPG", description: "Convert PNG images to JPG format", href: "/image/png-to-jpg", icon: FileImage, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400", category: "Image Tools", badge: "blue", keywords: ["png", "jpg", "convert"] },
  { title: "PNG to PDF", description: "Convert PNG images to PDF documents", href: "/image/png-to-pdf", icon: FileOutput, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400", category: "Image Tools", badge: "blue", keywords: ["png", "pdf", "convert"] },
  { title: "PDF to PNG", description: "Extract PDF pages as PNG images", href: "/image/pdf-to-png", icon: FileInput, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400", category: "Image Tools", badge: "blue", keywords: ["pdf", "png", "extract"] },
  { title: "Photo Resizer", description: "Resize images by pixels or compress to KB/MB", href: "/image/resize", icon: Minimize2, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400", category: "Image Tools", badge: "blue", keywords: ["resize", "compress", "shrink", "small", "kb", "mb"] },
  { title: "Background Remover", description: "Remove and replace image backgrounds", href: "/image/background", icon: Eraser, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400", category: "Image Tools", badge: "blue", featured: true, keywords: ["bg", "background", "remove", "transparent", "cutout"] },
  { title: "PDF Maker", description: "Create PDF files from text and content", href: "/pdf/maker", icon: FilePlus, color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", category: "PDF Tools", badge: "red", keywords: ["pdf", "create", "make", "new"] },
  { title: "PDF Editor", description: "View and annotate PDF documents", href: "/pdf/editor", icon: FileEdit, color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", category: "PDF Tools", badge: "red", keywords: ["pdf", "edit", "annotate", "view"] },
  { title: "PDF Locker", description: "Password-protect your PDF files", href: "/pdf/lock", icon: Lock, color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", category: "PDF Tools", badge: "red", keywords: ["pdf", "lock", "password", "protect", "encrypt"] },
  { title: "PDF Unlocker", description: "Remove password protection from PDFs", href: "/pdf/unlock", icon: Unlock, color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", category: "PDF Tools", badge: "red", keywords: ["pdf", "unlock", "remove password", "decrypt"] },
  { title: "PDF Merger", description: "Combine multiple PDFs into one file", href: "/pdf/merge", icon: Merge, color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", category: "PDF Tools", badge: "red", featured: true, keywords: ["pdf", "merge", "combine", "join"] },
  { title: "PDF Splitter", description: "Split PDF into separate pages", href: "/pdf/split", icon: Scissors, color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", category: "PDF Tools", badge: "red", keywords: ["pdf", "split", "divide", "separate"] },
  { title: "PDF Compressor", description: "Reduce PDF file size efficiently", href: "/pdf/compress", icon: Archive, color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", category: "PDF Tools", badge: "red", keywords: ["pdf", "compress", "smaller", "size", "reduce"] },
  { title: "Word File Maker", description: "Create .docx Word documents with ease", href: "/docs/word-maker", icon: FileType2, color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400", category: "Document Tools", badge: "green", keywords: ["word", "docx", "doc", "create"] },
  { title: "Text to PDF", description: "Convert plain text to a PDF document", href: "/pdf/text-to-pdf", icon: FileText, color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", category: "PDF Tools", badge: "red", keywords: ["text", "pdf", "convert", "txt"] },
  { title: "PDF to Word", description: "Extract text from PDF and convert to editable .docx", href: "/pdf/pdf-to-word", icon: FileType2, color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", category: "PDF Tools", badge: "red", keywords: ["pdf", "word", "docx", "convert", "editable"] },
  { title: "Word to PDF", description: "Convert .docx Word documents to professional PDFs", href: "/pdf/word-to-pdf", icon: FileType2, color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", category: "PDF Tools", badge: "red", keywords: ["word", "docx", "pdf", "convert"] },
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

const FAVORITES_KEY = "treo-favorites-v1";
const RECENTS_KEY = "treo-recents-v1";
const MAX_RECENTS = 6;

function readList(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeList(key: string, list: string[]) {
  try { localStorage.setItem(key, JSON.stringify(list)); } catch { /* ignore */ }
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recents, setRecents] = useState<string[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const stickyRef = useRef<HTMLInputElement>(null);

  // Load persisted favorites / recents
  useEffect(() => {
    setFavorites(readList(FAVORITES_KEY));
    setRecents(readList(RECENTS_KEY));
    setIsMac(typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform));
  }, []);

  // Sticky search threshold
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 360);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Keyboard shortcuts: "/" or ⌘K / Ctrl+K to focus search, Esc to clear
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        (scrolled ? stickyRef.current : searchRef.current)?.focus();
        return;
      }
      if (e.key === "/" && !isTyping) {
        e.preventDefault();
        (scrolled ? stickyRef.current : searchRef.current)?.focus();
        return;
      }
      if (e.key === "Escape" && isTyping && target === (scrolled ? stickyRef.current : searchRef.current)) {
        setSearch("");
        (target as HTMLInputElement).blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scrolled]);

  const toggleFavorite = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => {
      const next = prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href];
      writeList(FAVORITES_KEY, next);
      return next;
    });
  };

  const recordOpen = (href: string) => {
    setRecents((prev) => {
      const next = [href, ...prev.filter((h) => h !== href)].slice(0, MAX_RECENTS);
      writeList(RECENTS_KEY, next);
      return next;
    });
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: tools.length };
    for (const t of tools) c[t.category] = (c[t.category] ?? 0) + 1;
    return c;
  }, []);

  const featured = useMemo(() => tools.filter((t) => t.featured), []);
  const recentTools = useMemo(
    () => recents.map((h) => tools.find((t) => t.href === h)).filter((t): t is Tool => Boolean(t)),
    [recents],
  );
  const favoriteTools = useMemo(
    () => favorites.map((h) => tools.find((t) => t.href === h)).filter((t): t is Tool => Boolean(t)),
    [favorites],
  );

  const q = search.trim().toLowerCase();
  const filtered = tools.filter((t) => {
    const haystack = `${t.title} ${t.description} ${(t.keywords ?? []).join(" ")} ${t.category}`.toLowerCase();
    const matchesSearch = q === "" || haystack.includes(q);
    const matchesCategory = category === "All" || t.category === category;
    return matchesSearch && matchesCategory;
  });

  const isSearching = q.length > 0;
  const showHeroSections = !isSearching && category === "All";

  return (
    <div className="min-h-screen bg-background">
      {/* ───────────────────────── STICKY HEADER (on scroll) ───────────────────────── */}
      <header
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
          scrolled
            ? "translate-y-0 opacity-100 bg-background/85 backdrop-blur-md border-b border-border shadow-sm"
            : "-translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <Logo size={28} showWordmark wordmarkClassName="text-sm hidden sm:inline" />
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={stickyRef}
              data-testid="search-tools-sticky"
              placeholder="Search tools…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-10 h-9 text-sm"
            />
            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <kbd className="hidden md:inline-flex items-center gap-1 px-2 h-7 rounded-md border border-border bg-muted text-[10px] font-mono text-muted-foreground">
            {isMac ? <><Command className="w-3 h-3" /> K</> : "Ctrl K"}
          </kbd>
        </div>
      </header>

      {/* ───────────────────────── HERO ───────────────────────── */}
      <div className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
          <div className="absolute -top-24 -left-24 w-[28rem] h-[28rem] rounded-full bg-primary/20 blur-3xl animate-[blob_18s_ease-in-out_infinite]" />
          <div className="absolute -bottom-24 -right-16 w-[26rem] h-[26rem] rounded-full bg-violet-500/20 blur-3xl animate-[blob_22s_ease-in-out_infinite_reverse]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[20rem] h-[20rem] rounded-full bg-fuchsia-500/10 blur-3xl animate-[blob_26s_ease-in-out_infinite]" />
          <div
            className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />
        </div>

        <div className="max-w-6xl mx-auto px-4 pt-16 pb-14 sm:pt-24 sm:pb-16 text-center">
          <Logo size={80} className="mx-auto justify-center" />

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-foreground mb-3">
            TREO TOOL&apos;S
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Student toolkit for files, PDFs, images and AI study help.
          </p>

          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              ref={searchRef}
              data-testid="search-tools"
              placeholder="Search tools…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 pr-24 h-14 text-base shadow-lg shadow-primary/5 border-2 focus-visible:ring-primary/30"
            />
            <kbd className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-1 px-2 h-7 rounded-md border border-border bg-muted text-[10px] font-mono text-muted-foreground">
              Press <span className="font-bold">/</span>
            </kbd>
          </div>
        </div>
      </div>

      {/* ─────────────────────── RECENTS + FAVORITES (compact rows) ─────────────────────── */}
      {showHeroSections && (recentTools.length > 0 || favoriteTools.length > 0) && (
        <div className="max-w-6xl mx-auto px-4 pt-10 space-y-8">
          {favoriteTools.length > 0 && (
            <CompactRow
              icon={<Star className="w-5 h-5 text-amber-500 fill-amber-500" />}
              title="Your favorites"
              subtitle="Pinned for one-click access"
              items={favoriteTools}
              onOpen={recordOpen}
              isFavorite={(h) => favorites.includes(h)}
              toggleFavorite={toggleFavorite}
            />
          )}
          {recentTools.length > 0 && (
            <CompactRow
              icon={<Clock className="w-5 h-5 text-primary" />}
              title="Recently used"
              subtitle="Pick up right where you left off"
              items={recentTools}
              onOpen={recordOpen}
              isFavorite={(h) => favorites.includes(h)}
              toggleFavorite={toggleFavorite}
            />
          )}
        </div>
      )}

      {/* ─────────────────────── CATEGORY QUICK-PICK ─────────────────────── */}
      {showHeroSections && (
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
                  onClick={() => {
                    setCategory(cat);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
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
      {showHeroSections && (
        <div className="max-w-6xl mx-auto px-4 pt-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Most-used tools</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featured.map((tool) => (
              <Link key={tool.href} href={tool.href}>
                <div
                  onClick={() => recordOpen(tool.href)}
                  data-testid={`featured-${tool.title.replace(/\s/g, "-").toLowerCase()}`}
                  className="group relative h-full bg-card border border-card-border rounded-xl p-5 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/40 hover:-translate-y-0.5 transition-all cursor-pointer overflow-hidden"
                >
                  <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors" />
                  <button
                    type="button"
                    aria-label={favorites.includes(tool.href) ? "Remove from favorites" : "Add to favorites"}
                    onClick={(e) => toggleFavorite(tool.href, e)}
                    className="absolute top-3 right-3 w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors z-10"
                  >
                    <Star className={`w-4 h-4 ${favorites.includes(tool.href) ? "fill-amber-500 text-amber-500" : ""}`} />
                  </button>
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
              {isSearching && <> matching <span className="text-foreground font-medium">&quot;{search}&quot;</span></>}
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
                  onClick={() => recordOpen(tool.href)}
                  data-testid={`tool-card-${tool.title.replace(/\s/g, "-").toLowerCase()}`}
                  className="group relative h-full bg-card border border-card-border rounded-xl p-5 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/40 hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  <button
                    type="button"
                    aria-label={favorites.includes(tool.href) ? "Remove from favorites" : "Add to favorites"}
                    onClick={(e) => toggleFavorite(tool.href, e)}
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors z-10"
                  >
                    <Star className={`w-4 h-4 ${favorites.includes(tool.href) ? "fill-amber-500 text-amber-500" : ""}`} />
                  </button>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${tool.color}`}>
                      <tool.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors truncate">
                          {tool.title}
                        </h3>
                        {tool.featured && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">
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
            <Logo size={32} showWordmark wordmarkClassName="text-base" />
            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <Link href="/about" className="hover:text-foreground transition-colors" data-testid="link-about">About</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors" data-testid="link-contact">Contact</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors" data-testid="link-privacy">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors" data-testid="link-terms">Terms of Service</Link>
              <Link href="/copyright" className="hover:text-foreground transition-colors" data-testid="link-copyright">Copyright</Link>
            </nav>
          </div>
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              © {new Date().getFullYear()} TREO TOOL&apos;S
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

function CompactRow({
  icon, title, subtitle, items, onOpen, isFavorite, toggleFavorite,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  items: Tool[];
  onOpen: (href: string) => void;
  isFavorite: (href: string) => boolean;
  toggleFavorite: (href: string, e: React.MouseEvent) => void;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <span className="text-xs text-muted-foreground hidden sm:inline">· {subtitle}</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
        {items.map((tool) => (
          <Link key={tool.href} href={tool.href}>
            <div
              onClick={() => onOpen(tool.href)}
              className="group relative snap-start shrink-0 w-56 bg-card border border-card-border rounded-xl p-4 hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <button
                type="button"
                aria-label={isFavorite(tool.href) ? "Remove from favorites" : "Add to favorites"}
                onClick={(e) => toggleFavorite(tool.href, e)}
                className="absolute top-2 right-2 w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors z-10"
              >
                <Star className={`w-3.5 h-3.5 ${isFavorite(tool.href) ? "fill-amber-500 text-amber-500" : ""}`} />
              </button>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${tool.color}`}>
                <tool.icon className="w-4.5 h-4.5" />
              </div>
              <div className="text-sm font-semibold text-foreground truncate pr-6 group-hover:text-primary transition-colors">
                {tool.title}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{tool.category}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
