import { useState } from "react";
import { Link } from "wouter";
import { Search, Calculator, FileImage, FileText, FileOutput, FileInput, Minimize2, Eraser, FilePlus, FileEdit, Lock, Unlock, Merge, Scissors, Archive, FileType2, ArrowLeftRight } from "lucide-react";
import { Input } from "@/components/ui/input";

const tools = [
  { title: "Calculator", description: "Scientific calculator with history", href: "/calculator", icon: Calculator, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400", category: "Utilities", badge: "amber" },
  { title: "Unit Converter", description: "Convert length, weight, temperature, speed, volume & more", href: "/tools/unit-converter", icon: ArrowLeftRight, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400", category: "Utilities", badge: "amber" },
  { title: "JPG to PDF", description: "Convert JPG images to PDF documents", href: "/image/jpg-to-pdf", icon: FileOutput, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400", category: "Image Tools", badge: "blue" },
  { title: "PDF to JPG", description: "Extract pages from PDF as JPG images", href: "/image/pdf-to-jpg", icon: FileInput, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400", category: "Image Tools", badge: "blue" },
  { title: "JPG to PNG", description: "Convert JPG to transparent-friendly PNG", href: "/image/jpg-to-png", icon: FileImage, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400", category: "Image Tools", badge: "blue" },
  { title: "PNG to JPG", description: "Convert PNG images to JPG format", href: "/image/png-to-jpg", icon: FileImage, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400", category: "Image Tools", badge: "blue" },
  { title: "PNG to PDF", description: "Convert PNG images to PDF documents", href: "/image/png-to-pdf", icon: FileOutput, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400", category: "Image Tools", badge: "blue" },
  { title: "PDF to PNG", description: "Extract PDF pages as PNG images", href: "/image/pdf-to-png", icon: FileInput, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400", category: "Image Tools", badge: "blue" },
  { title: "Photo Resizer", description: "Resize images by pixels or compress to KB/MB", href: "/image/resize", icon: Minimize2, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400", category: "Image Tools", badge: "blue" },
  { title: "Background Remover", description: "Remove and replace image backgrounds", href: "/image/background", icon: Eraser, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400", category: "Image Tools", badge: "blue" },
  { title: "PDF Maker", description: "Create PDF files from text and content", href: "/pdf/maker", icon: FilePlus, color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", category: "PDF Tools", badge: "red" },
  { title: "PDF Editor", description: "View and annotate PDF documents", href: "/pdf/editor", icon: FileEdit, color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", category: "PDF Tools", badge: "red" },
  { title: "PDF Locker", description: "Password-protect your PDF files", href: "/pdf/lock", icon: Lock, color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", category: "PDF Tools", badge: "red" },
  { title: "PDF Unlocker", description: "Remove password protection from PDFs", href: "/pdf/unlock", icon: Unlock, color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", category: "PDF Tools", badge: "red" },
  { title: "PDF Merger", description: "Combine multiple PDFs into one file", href: "/pdf/merge", icon: Merge, color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", category: "PDF Tools", badge: "red" },
  { title: "PDF Splitter", description: "Split PDF into separate pages", href: "/pdf/split", icon: Scissors, color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", category: "PDF Tools", badge: "red" },
  { title: "PDF Compressor", description: "Reduce PDF file size efficiently", href: "/pdf/compress", icon: Archive, color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", category: "PDF Tools", badge: "red" },
  { title: "Word File Maker", description: "Create .docx Word documents with ease", href: "/docs/word-maker", icon: FileType2, color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400", category: "Document Tools", badge: "green" },
  { title: "Text to PDF", description: "Convert plain text to a PDF document", href: "/pdf/text-to-pdf", icon: FileText, color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", category: "PDF Tools", badge: "red" },
];

const categories = ["All", "Image Tools", "PDF Tools", "Document Tools", "Utilities"];

const badgeColors: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  red: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  green: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
};

export default function Home() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = tools.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || t.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-14 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full mb-4">
            Student Tools Hub
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3">
            Your all-in-one student toolkit
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Convert files, edit PDFs, resize images, and more — all free, all in your browser.
          </p>
          <div className="max-w-lg mx-auto relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              data-testid="search-tools"
              placeholder="Search tools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 text-base shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 flex-wrap mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              data-testid={`category-${cat}`}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                category === cat
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No tools found</p>
            <p className="text-sm mt-1">Try a different search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((tool) => (
              <Link key={tool.href} href={tool.href}>
                <div
                  data-testid={`tool-card-${tool.title.replace(/\s/g, "-").toLowerCase()}`}
                  className="group bg-card border border-card-border rounded-xl p-5 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer"
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
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{tool.description}</p>
                      <span className={`inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-md ${badgeColors[tool.badge]}`}>
                        {tool.category}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
