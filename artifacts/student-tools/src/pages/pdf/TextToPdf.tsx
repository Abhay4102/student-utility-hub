import { useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { FileText, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PDFDocument, StandardFonts, rgb, PageSizes, PDFFont, PDFPage } from "pdf-lib";
import { toast } from "sonner";
import { pdfBytesToBlob } from "@/lib/pdfHelpers";
import { downloadBlob } from "@/lib/convertHelpers";

type FontFamily = "Helvetica" | "Times" | "Courier";
type PageSizeKey = "A4" | "Letter" | "Legal" | "A5";
const PAGE_SIZES: Record<PageSizeKey, [number, number]> = {
  A4: PageSizes.A4 as [number, number],
  Letter: PageSizes.Letter as [number, number],
  Legal: PageSizes.Legal as [number, number],
  A5: PageSizes.A5 as [number, number],
};

export default function TextToPdf() {
  const [text, setText] = useState("");
  const [fontFamily, setFontFamily] = useState<FontFamily>("Courier");
  const [size, setSize] = useState("11");
  const [pageSize, setPageSize] = useState<PageSizeKey>("A4");
  const [lineGap, setLineGap] = useState("1.5");
  const [pageNumbers, setPageNumbers] = useState(true);
  const [header, setHeader] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  async function convert() {
    if (!text.trim()) { toast.error("Add some text first."); return; }
    setLoading(true);
    setResultBlob(null);
    try {
      const doc = await PDFDocument.create();
      const fontMap: Record<FontFamily, StandardFonts> = {
        Helvetica: StandardFonts.Helvetica,
        Times: StandardFonts.TimesRoman,
        Courier: StandardFonts.Courier,
      };
      const font: PDFFont = await doc.embedFont(fontMap[fontFamily]);
      const bold = await doc.embedFont(StandardFonts.HelveticaBold);
      const [pageW, pageH] = PAGE_SIZES[pageSize];
      const margin = 50;
      const contentW = pageW - margin * 2;
      const fontSize = Math.min(24, Math.max(7, parseInt(size) || 11));
      const lh = fontSize * Math.max(1, Math.min(3, parseFloat(lineGap) || 1.5));

      const drawHeader = (p: PDFPage) => {
        if (!header) return;
        const w = bold.widthOfTextAtSize(header, 9);
        p.drawText(header, { x: (pageW - w) / 2, y: pageH - 28, font: bold, size: 9, color: rgb(0.4, 0.4, 0.5) });
        p.drawLine({ start: { x: margin, y: pageH - 36 }, end: { x: pageW - margin, y: pageH - 36 }, thickness: 0.5, color: rgb(0.85, 0.85, 0.9) });
      };

      let page = doc.addPage([pageW, pageH]);
      drawHeader(page);
      let y = pageH - margin - (header ? 20 : 0);

      const lines = text.split("\n");
      for (const raw of lines) {
        if (!raw.trim()) {
          y -= lh;
          if (y < margin + lh) { page = doc.addPage([pageW, pageH]); drawHeader(page); y = pageH - margin - (header ? 20 : 0); }
          continue;
        }
        const words = raw.split(" ");
        let cur = "";
        for (const w of words) {
          const test = cur ? `${cur} ${w}` : w;
          if (font.widthOfTextAtSize(test, fontSize) > contentW && cur) {
            if (y < margin + lh) { page = doc.addPage([pageW, pageH]); drawHeader(page); y = pageH - margin - (header ? 20 : 0); }
            page.drawText(cur, { x: margin, y, font, size: fontSize, color: rgb(0.1, 0.1, 0.1) });
            y -= lh;
            cur = w;
          } else cur = test;
        }
        if (cur) {
          if (y < margin + lh) { page = doc.addPage([pageW, pageH]); drawHeader(page); y = pageH - margin - (header ? 20 : 0); }
          page.drawText(cur, { x: margin, y, font, size: fontSize, color: rgb(0.1, 0.1, 0.1) });
          y -= lh;
        }
      }

      if (pageNumbers) {
        const pages = doc.getPages();
        pages.forEach((p, idx) => {
          const label = `${idx + 1} / ${pages.length}`;
          const w = font.widthOfTextAtSize(label, 9);
          p.drawText(label, { x: (pageW - w) / 2, y: 24, font, size: 9, color: rgb(0.5, 0.5, 0.5) });
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
      title="Text to PDF"
      description="Paste any text and get a clean PDF — choose page size, font, line spacing, header, page numbers"
      category="PDF Tools"
      categoryHref="/"
      icon={<FileText className="w-6 h-6 text-red-700 dark:text-red-400" />}
      iconBg="bg-red-100 dark:bg-red-900/40"
    >
      <div className="bg-card border border-card-border rounded-xl p-6 space-y-4">
        <div>
          <Label htmlFor="text-content">Your text</Label>
          <Textarea
            id="text-content"
            data-testid="input-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your text here…"
            rows={12}
            className="mt-1 font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">{text.length} characters · {text.split("\n").length} lines</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs">Page size</Label>
            <Select value={pageSize} onValueChange={(v) => setPageSize(v as PageSizeKey)}>
              <SelectTrigger className="mt-1" data-testid="page-size"><SelectValue /></SelectTrigger>
              <SelectContent>{(Object.keys(PAGE_SIZES) as PageSizeKey[]).map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Font</Label>
            <Select value={fontFamily} onValueChange={(v) => setFontFamily(v as FontFamily)}>
              <SelectTrigger className="mt-1" data-testid="font"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Courier">Courier (mono)</SelectItem>
                <SelectItem value="Helvetica">Helvetica</SelectItem>
                <SelectItem value="Times">Times</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Size (pt)</Label>
            <Input type="number" value={size} onChange={(e) => setSize(e.target.value)} min="7" max="24" className="mt-1" data-testid="size" />
          </div>
          <div>
            <Label className="text-xs">Line spacing</Label>
            <Input type="number" value={lineGap} onChange={(e) => setLineGap(e.target.value)} step="0.1" min="1" max="3" className="mt-1" data-testid="line-gap" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
          <div>
            <Label htmlFor="header" className="text-xs">Header text (optional)</Label>
            <Input id="header" value={header} onChange={(e) => setHeader(e.target.value)} placeholder="Appears centered on every page" className="mt-1" data-testid="header" />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer pb-2">
            <Checkbox checked={pageNumbers} onCheckedChange={(v) => setPageNumbers(!!v)} data-testid="page-numbers" />
            Show page numbers
          </label>
        </div>

        <div className="flex gap-2">
          <Button onClick={convert} disabled={loading || !text.trim()} className="flex-1" data-testid="convert-btn">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating…</> : "Convert to PDF"}
          </Button>
          {resultBlob && (
            <Button onClick={() => downloadBlob(resultBlob, "document.pdf")} className="flex-1" data-testid="download-btn">
              <Download className="w-4 h-4 mr-2" />Download
            </Button>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
