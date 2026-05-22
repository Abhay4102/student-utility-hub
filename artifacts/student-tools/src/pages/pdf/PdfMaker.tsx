import { useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { FilePlus, Download, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PDFDocument, StandardFonts, rgb, PageSizes, PDFFont, PDFPage } from "pdf-lib";
import { toast } from "sonner";
import { pdfBytesToBlob } from "@/lib/pdfHelpers";
import { downloadBlob } from "@/lib/convertHelpers";

type Align = "left" | "center" | "right";
type FontFamily = "Helvetica" | "Times" | "Courier";
type PageSizeKey = "A4" | "Letter" | "Legal" | "A5";
const PAGE_SIZES: Record<PageSizeKey, [number, number]> = {
  A4: PageSizes.A4 as [number, number],
  Letter: PageSizes.Letter as [number, number],
  Legal: PageSizes.Legal as [number, number],
  A5: PageSizes.A5 as [number, number],
};

interface Section { heading: string; body: string; }

export default function PdfMaker() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [sections, setSections] = useState<Section[]>([{ heading: "", body: "" }]);
  const [fontFamily, setFontFamily] = useState<FontFamily>("Helvetica");
  const [bodySize, setBodySize] = useState("12");
  const [align, setAlign] = useState<Align>("left");
  const [pageSize, setPageSize] = useState<PageSizeKey>("A4");
  const [coverPage, setCoverPage] = useState(true);
  const [pageNumbers, setPageNumbers] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const addSection = () => setSections((s) => [...s, { heading: "", body: "" }]);
  const removeSection = (i: number) => setSections((s) => s.filter((_, idx) => idx !== i));
  const update = (i: number, k: keyof Section, v: string) => setSections((s) => s.map((x, idx) => idx === i ? { ...x, [k]: v } : x));

  async function createPdf() {
    if (!title && sections.every((s) => !s.heading && !s.body)) {
      toast.error("Add a title or some content first."); return;
    }
    setLoading(true);
    setResultBlob(null);
    try {
      const doc = await PDFDocument.create();
      const fontMap: Record<FontFamily, { reg: StandardFonts; bold: StandardFonts; italic: StandardFonts }> = {
        Helvetica: { reg: StandardFonts.Helvetica, bold: StandardFonts.HelveticaBold, italic: StandardFonts.HelveticaOblique },
        Times: { reg: StandardFonts.TimesRoman, bold: StandardFonts.TimesRomanBold, italic: StandardFonts.TimesRomanItalic },
        Courier: { reg: StandardFonts.Courier, bold: StandardFonts.CourierBold, italic: StandardFonts.CourierOblique },
      };
      const regular = await doc.embedFont(fontMap[fontFamily].reg);
      const bold = await doc.embedFont(fontMap[fontFamily].bold);
      const italic = await doc.embedFont(fontMap[fontFamily].italic);

      const [pageW, pageH] = PAGE_SIZES[pageSize];
      const margin = 60;
      const contentW = pageW - margin * 2;
      const bodyPt = Math.min(36, Math.max(8, parseInt(bodySize) || 12));
      const lineH = bodyPt * 1.5;

      doc.setTitle(title || "Document");
      if (author) doc.setAuthor(author);
      doc.setCreator("TREO TOOL'S — PDF Maker");

      let page = doc.addPage([pageW, pageH]);
      let y = pageH - margin;

      const newPage = () => { page = doc.addPage([pageW, pageH]); y = pageH - margin; };

      function drawAligned(text: string, f: PDFFont, size: number, color: [number, number, number]) {
        if (!text) { y -= size * 1.5; return; }
        if (y - size < margin) newPage();
        const w = f.widthOfTextAtSize(text, size);
        let x = margin;
        if (align === "center") x = (pageW - w) / 2;
        else if (align === "right") x = pageW - margin - w;
        page.drawText(text, { x, y: y - size, font: f, size, color: rgb(...color) });
        y -= size * 1.4;
      }

      function wrap(text: string, f: PDFFont, size: number, color: [number, number, number]) {
        const lh = size * 1.5;
        const paras = text.split("\n");
        for (const para of paras) {
          if (para.trim() === "") { y -= lh; if (y < margin + lh) newPage(); continue; }
          const words = para.split(/\s+/);
          let line = "";
          for (const w of words) {
            const test = line ? `${line} ${w}` : w;
            if (f.widthOfTextAtSize(test, size) > contentW && line) {
              if (y < margin + lh) newPage();
              const lw = f.widthOfTextAtSize(line, size);
              let x = margin;
              if (align === "center") x = (pageW - lw) / 2;
              else if (align === "right") x = pageW - margin - lw;
              page.drawText(line, { x, y, font: f, size, color: rgb(...color) });
              y -= lh;
              line = w;
            } else line = test;
          }
          if (line) {
            if (y < margin + lh) newPage();
            const lw = f.widthOfTextAtSize(line, size);
            let x = margin;
            if (align === "center") x = (pageW - lw) / 2;
            else if (align === "right") x = pageW - margin - lw;
            page.drawText(line, { x, y, font: f, size, color: rgb(...color) });
            y -= lh;
          }
        }
      }

      const hasContent = sections.some((s) => s.heading || s.body);

      // Cover page
      if (coverPage && (title || author)) {
        if (title) {
          y = pageH * 0.55;
          drawAligned(title, bold, 32, [0.1, 0.1, 0.4]);
        }
        if (author) {
          y -= 20;
          drawAligned(`by ${author}`, italic, 14, [0.4, 0.4, 0.5]);
        }
        // Date
        y -= 12;
        drawAligned(new Date().toLocaleDateString(), regular, 10, [0.5, 0.5, 0.5]);
        // Only break to a new page when there's actual content to put on it
        if (hasContent) newPage();
      } else if (title) {
        drawAligned(title, bold, 24, [0.1, 0.1, 0.4]);
        y -= 6;
        page.drawLine({ start: { x: margin, y }, end: { x: pageW - margin, y }, thickness: 1, color: rgb(0.7, 0.7, 0.85) });
        y -= 20;
        if (author) { drawAligned(`Author: ${author}`, italic, 10, [0.4, 0.4, 0.5]); y -= 6; }
      }

      // Sections
      for (let i = 0; i < sections.length; i++) {
        const sec = sections[i];
        if (sec.heading) {
          y -= 12;
          if (y < margin + 40) newPage();
          drawAligned(sec.heading, bold, 16, [0.15, 0.15, 0.3]);
          y -= 6;
        }
        if (sec.body) wrap(sec.body, regular, bodyPt, [0.1, 0.1, 0.1]);
      }

      // Page numbers + footer
      if (pageNumbers) {
        const pages = doc.getPages();
        const skip = coverPage && (title || author) ? 1 : 0;
        pages.forEach((p: PDFPage, idx: number) => {
          if (idx < skip) return;
          const label = `${idx + 1 - skip} / ${pages.length - skip}`;
          const w = regular.widthOfTextAtSize(label, 9);
          p.drawText(label, { x: (pageW - w) / 2, y: 30, font: regular, size: 9, color: rgb(0.5, 0.5, 0.5) });
        });
      }

      const pdfBytes = await doc.save();
      setResultBlob(pdfBytesToBlob(pdfBytes));
      toast.success("PDF created");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create PDF.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolLayout
      title="PDF Maker"
      description="Build a polished PDF — cover page, sections, font family, alignment, page numbers"
      category="PDF Tools"
      categoryHref="/"
      icon={<FilePlus className="w-6 h-6 text-red-700 dark:text-red-400" />}
      iconBg="bg-red-100 dark:bg-red-900/40"
    >
      <div className="bg-card border border-card-border rounded-xl p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="pdf-title">Document title</Label>
            <Input id="pdf-title" data-testid="input-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My Document" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="pdf-author">Author (optional)</Label>
            <Input id="pdf-author" data-testid="input-author" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="John Doe" className="mt-1" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs">Page size</Label>
            <Select value={pageSize} onValueChange={(v) => setPageSize(v as PageSizeKey)}>
              <SelectTrigger className="mt-1" data-testid="page-size"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(PAGE_SIZES) as PageSizeKey[]).map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Font</Label>
            <Select value={fontFamily} onValueChange={(v) => setFontFamily(v as FontFamily)}>
              <SelectTrigger className="mt-1" data-testid="font-family"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Helvetica">Helvetica</SelectItem>
                <SelectItem value="Times">Times</SelectItem>
                <SelectItem value="Courier">Courier</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Body size (pt)</Label>
            <Input type="number" value={bodySize} onChange={(e) => setBodySize(e.target.value)} min="8" max="36" className="mt-1" data-testid="input-font-size" />
          </div>
          <div>
            <Label className="text-xs">Align</Label>
            <Select value={align} onValueChange={(v) => setAlign(v as Align)}>
              <SelectTrigger className="mt-1" data-testid="align"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={coverPage} onCheckedChange={(v) => setCoverPage(!!v)} data-testid="opt-cover" />
            Include cover page
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={pageNumbers} onCheckedChange={(v) => setPageNumbers(!!v)} data-testid="opt-page-numbers" />
            Page numbers
          </label>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Sections</Label>
            <Button variant="outline" size="sm" onClick={addSection} data-testid="add-section">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add section
            </Button>
          </div>
          {sections.map((sec, i) => (
            <div key={i} data-testid={`section-${i}`} className="border border-border rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground shrink-0 w-8">{i + 1}.</span>
                <Input value={sec.heading} onChange={(e) => update(i, "heading", e.target.value)} placeholder="Section heading (optional)" data-testid={`heading-${i}`} className="flex-1" />
                {sections.length > 1 && (
                  <button onClick={() => removeSection(i)} className="text-muted-foreground hover:text-destructive p-1" data-testid={`remove-section-${i}`}>
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Textarea value={sec.body} onChange={(e) => update(i, "body", e.target.value)} rows={5} placeholder="Body text — paragraphs separated by blank lines" data-testid={`body-${i}`} className="text-sm" />
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button onClick={createPdf} disabled={loading} className="flex-1" data-testid="create-pdf-btn">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating…</> : "Create PDF"}
          </Button>
          {resultBlob && (
            <Button onClick={() => downloadBlob(resultBlob, `${title || "document"}.pdf`)} className="flex-1" data-testid="download-btn">
              <Download className="w-4 h-4 mr-2" />Download
            </Button>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
