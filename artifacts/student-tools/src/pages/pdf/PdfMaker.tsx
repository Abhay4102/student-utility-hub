import { useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { FilePlus, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { toast } from "sonner";

export default function PdfMaker() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [fontSize, setFontSize] = useState("12");
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  async function createPdf() {
    if (!title && !body) { toast.error("Please add a title or body text"); return; }
    setLoading(true);
    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const pageWidth = 595;
      const pageHeight = 842;
      const margin = 60;
      const contentWidth = pageWidth - margin * 2;
      const size = parseInt(fontSize) || 12;
      const lineHeight = size * 1.5;

      pdfDoc.setTitle(title || "Document");
      if (author) pdfDoc.setAuthor(author);

      let page = pdfDoc.addPage([pageWidth, pageHeight]);
      let y = pageHeight - margin;

      function addText(text: string, opts: { bold?: boolean; fontSize?: number; color?: [number, number, number] } = {}) {
        const fSize = opts.fontSize || size;
        const f = opts.bold ? boldFont : font;
        const lh = fSize * 1.6;
        const words = text.split(" ");
        let line = "";
        for (const word of words) {
          const testLine = line ? `${line} ${word}` : word;
          const w = f.widthOfTextAtSize(testLine, fSize);
          if (w > contentWidth && line) {
            if (y < margin + lh) { page = pdfDoc.addPage([pageWidth, pageHeight]); y = pageHeight - margin; }
            page.drawText(line, { x: margin, y, font: f, size: fSize, color: rgb(...(opts.color || [0.1, 0.1, 0.1])) });
            y -= lh;
            line = word;
          } else {
            line = testLine;
          }
        }
        if (line) {
          if (y < margin + lh) { page = pdfDoc.addPage([pageWidth, pageHeight]); y = pageHeight - margin; }
          page.drawText(line, { x: margin, y, font: f, size: fSize, color: rgb(...(opts.color || [0.1, 0.1, 0.1])) });
          y -= lh;
        }
      }

      if (title) {
        addText(title, { bold: true, fontSize: 24, color: [0.1, 0.1, 0.4] });
        y -= 8;
        page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 1, color: rgb(0.7, 0.7, 0.9) });
        y -= 20;
      }
      if (author) {
        addText(`Author: ${author}`, { fontSize: 10, color: [0.5, 0.5, 0.5] });
        y -= 10;
      }
      if (body) {
        const paragraphs = body.split("\n");
        for (const para of paragraphs) {
          if (para.trim() === "") { y -= lineHeight; continue; }
          addText(para);
          y -= 4;
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      setPdfUrl(URL.createObjectURL(blob));
      toast.success("PDF created successfully!");
    } catch {
      toast.error("Failed to create PDF.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolLayout
      title="PDF Maker"
      description="Create professional PDF documents from text content"
      category="PDF Tools"
      categoryHref="/"
      icon={<FilePlus className="w-6 h-6 text-red-700 dark:text-red-400" />}
      iconBg="bg-red-100 dark:bg-red-900/40"
    >
      <div className="bg-card border border-card-border rounded-xl p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="pdf-title">Document Title</Label>
            <Input id="pdf-title" data-testid="input-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My Document" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="pdf-author">Author Name (optional)</Label>
            <Input id="pdf-author" data-testid="input-author" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="John Doe" className="mt-1" />
          </div>
        </div>
        <div>
          <Label htmlFor="pdf-body">Document Content</Label>
          <Textarea
            id="pdf-body"
            data-testid="input-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your document content here. Use blank lines to create new paragraphs."
            rows={12}
            className="mt-1 font-mono text-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="font-size" className="shrink-0">Font Size</Label>
          <Input id="font-size" data-testid="input-font-size" type="number" value={fontSize} onChange={(e) => setFontSize(e.target.value)} className="w-24" min="8" max="32" />
          <span className="text-sm text-muted-foreground">pt</span>
        </div>
        {!pdfUrl ? (
          <Button onClick={createPdf} disabled={loading} className="w-full" data-testid="create-pdf-btn">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating PDF...</> : "Create PDF"}
          </Button>
        ) : (
          <div className="space-y-2">
            <a href={pdfUrl} download={`${title || "document"}.pdf`} data-testid="download-btn">
              <Button className="w-full"><Download className="w-4 h-4 mr-2" />Download PDF</Button>
            </a>
            <Button variant="outline" onClick={() => setPdfUrl(null)} className="w-full">Edit and regenerate</Button>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
