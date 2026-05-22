import { useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { FileDropZone } from "@/components/FileDropZone";
import { Button } from "@/components/ui/button";
import { FileType2, Download, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { pdfjsLib } from "@/lib/pdfjs";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

export default function PdfToWord() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultName, setResultName] = useState("");

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);
    setResultBlob(null);

    try {
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      const numPages = pdf.numPages;

      const allParagraphs: Paragraph[] = [
        new Paragraph({
          text: file.name.replace(/\.pdf$/i, ""),
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 300 },
        }),
      ];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();

        // Group text items into lines by y-coordinate
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items = content.items as any[];
        const lines = new Map<number, { x: number; text: string }[]>();

        for (const item of items) {
          if (!item.str) continue;
          const y = Math.round(item.transform[5]);
          const x = item.transform[4];
          if (!lines.has(y)) lines.set(y, []);
          lines.get(y)!.push({ x, text: item.str });
        }

        // Sort lines top-to-bottom (high y to low y in PDF coords)
        const sortedYs = Array.from(lines.keys()).sort((a, b) => b - a);

        if (i > 1) {
          allParagraphs.push(
            new Paragraph({
              children: [new TextRun({ text: `— Page ${i} —`, italics: true, color: "888888" })],
              spacing: { before: 400, after: 200 },
            })
          );
        }

        for (const y of sortedYs) {
          const lineItems = lines.get(y)!.sort((a, b) => a.x - b.x);
          const text = lineItems.map((it) => it.text).join(" ").trim();
          if (!text) continue;

          allParagraphs.push(
            new Paragraph({
              children: [new TextRun({ text, size: 22 })],
              spacing: { after: 80 },
            })
          );
        }

        setProgress(Math.round((i / numPages) * 100));
      }

      const doc = new Document({
        sections: [{ children: allParagraphs }],
      });

      const blob = await Packer.toBlob(doc);
      setResultBlob(blob);
      setResultName(file.name.replace(/\.pdf$/i, "") + ".docx");
      toast.success(`Converted ${numPages} ${numPages === 1 ? "page" : "pages"} to Word`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to convert PDF. The file may be encrypted or scanned (image-only).");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = resultName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setResultBlob(null);
    setProgress(0);
  };

  return (
    <ToolLayout
      title="PDF to Word"
      description="Extract text from any PDF and convert it to an editable .docx Word document"
      category="PDF Tools"
      categoryHref="/?cat=PDF Tools"
      icon={<FileType2 className="w-6 h-6" />}
      iconBg="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
    >
      {!file && (
        <FileDropZone
          onFile={setFile}
          accept=".pdf,application/pdf"
          label="Drop your PDF file here"
          description="or click to browse"
        />
      )}

      {file && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
            <FileText className="w-8 h-8 text-red-500" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <Button variant="ghost" size="sm" onClick={reset} disabled={processing}>Change</Button>
          </div>

          {!resultBlob && (
            <Button onClick={handleConvert} disabled={processing} className="w-full" size="lg">
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Converting… {progress}%
                </>
              ) : (
                "Convert to Word"
              )}
            </Button>
          )}

          {resultBlob && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                <FileType2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Conversion complete</p>
                <p className="text-sm text-muted-foreground mt-1">{resultName}</p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button onClick={handleDownload} size="lg" className="gap-2">
                  <Download className="w-4 h-4" /> Download .docx
                </Button>
                <Button variant="outline" onClick={reset} size="lg">Convert another</Button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 bg-muted/30 border border-border rounded-lg p-4 text-sm space-y-1">
        <p className="font-semibold text-foreground">Note</p>
        <p className="text-muted-foreground">
          This extracts the text content and line structure from your PDF. Scanned/image-only PDFs cannot be converted because they contain no extractable text. Complex layouts (multi-column, tables, images) may not preserve exactly — paragraph order and text are maintained.
        </p>
      </div>
    </ToolLayout>
  );
}
