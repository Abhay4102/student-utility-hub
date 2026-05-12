import { useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { FileText, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { toast } from "sonner";

export default function TextToPdf() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  async function convert() {
    if (!text.trim()) { toast.error("Please enter some text"); return; }
    setLoading(true);
    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Courier);
      const pageWidth = 595; const pageHeight = 842;
      const margin = 60; const contentWidth = pageWidth - margin * 2;
      const fontSize = 11; const lineHeight = fontSize * 1.5;
      let page = pdfDoc.addPage([pageWidth, pageHeight]);
      let y = pageHeight - margin;

      const lines = text.split("\n");
      for (const line of lines) {
        if (line.trim() === "") { y -= lineHeight; if (y < margin + lineHeight) { page = pdfDoc.addPage([pageWidth, pageHeight]); y = pageHeight - margin; } continue; }
        const words = line.split(" ");
        let current = "";
        for (const word of words) {
          const test = current ? `${current} ${word}` : word;
          if (font.widthOfTextAtSize(test, fontSize) > contentWidth && current) {
            if (y < margin + lineHeight) { page = pdfDoc.addPage([pageWidth, pageHeight]); y = pageHeight - margin; }
            page.drawText(current, { x: margin, y, font, size: fontSize, color: rgb(0.1, 0.1, 0.1) });
            y -= lineHeight;
            current = word;
          } else { current = test; }
        }
        if (current) {
          if (y < margin + lineHeight) { page = pdfDoc.addPage([pageWidth, pageHeight]); y = pageHeight - margin; }
          page.drawText(current, { x: margin, y, font, size: fontSize, color: rgb(0.1, 0.1, 0.1) });
          y -= lineHeight;
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      setPdfUrl(URL.createObjectURL(blob));
      toast.success("PDF created!");
    } catch {
      toast.error("Failed to create PDF.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolLayout
      title="Text to PDF"
      description="Convert plain text into a formatted PDF document"
      category="PDF Tools"
      categoryHref="/"
      icon={<FileText className="w-6 h-6 text-red-700 dark:text-red-400" />}
      iconBg="bg-red-100 dark:bg-red-900/40"
    >
      <div className="bg-card border border-card-border rounded-xl p-6 space-y-4">
        <div>
          <Label htmlFor="text-content">Paste or type your text</Label>
          <Textarea
            id="text-content"
            data-testid="input-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your text here..."
            rows={14}
            className="mt-1 font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">{text.length} characters · {text.split("\n").length} lines</p>
        </div>
        {!pdfUrl ? (
          <Button onClick={convert} disabled={loading || !text.trim()} className="w-full" data-testid="convert-btn">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating PDF...</> : "Convert to PDF"}
          </Button>
        ) : (
          <div className="space-y-2">
            <a href={pdfUrl} download="document.pdf" data-testid="download-btn">
              <Button className="w-full"><Download className="w-4 h-4 mr-2" />Download PDF</Button>
            </a>
            <Button variant="outline" onClick={() => setPdfUrl(null)} className="w-full">Edit and regenerate</Button>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
