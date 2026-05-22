import { useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { FileDropZone } from "@/components/FileDropZone";
import { Button } from "@/components/ui/button";
import { FileType2, Download, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import mammoth from "mammoth";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function WordToPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultName, setResultName] = useState("");

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    setResultBlob(null);

    try {
      const buffer = await file.arrayBuffer();
      const { value: rawHtml } = await mammoth.convertToHtml({ arrayBuffer: buffer });

      // Sanitize Mammoth's HTML before injecting — strip <script>, <iframe>, <object>,
      // <embed>, <link>, <style>, on* event handler attributes, and javascript: URLs.
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<div>${rawHtml}</div>`, "text/html");
      const root = doc.body.firstElementChild as HTMLElement;
      const DANGEROUS_TAGS = new Set(["SCRIPT", "IFRAME", "OBJECT", "EMBED", "LINK", "STYLE", "META", "BASE"]);
      const walker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
      const toRemove: Element[] = [];
      let n: Node | null = walker.currentNode;
      while (n) {
        const el = n as Element;
        if (DANGEROUS_TAGS.has(el.tagName)) {
          toRemove.push(el);
        } else {
          for (const attr of Array.from(el.attributes)) {
            const name = attr.name.toLowerCase();
            const val = attr.value.trim().toLowerCase();
            if (name.startsWith("on") || (val.startsWith("javascript:") && (name === "href" || name === "src"))) {
              el.removeAttribute(attr.name);
            }
          }
        }
        n = walker.nextNode();
      }
      for (const el of toRemove) el.remove();
      const html = root.innerHTML;

      // Build an offscreen container with PDF-friendly styling
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-10000px";
      container.style.top = "0";
      container.style.width = "794px"; // A4 width at 96dpi
      container.style.padding = "48px";
      container.style.background = "#ffffff";
      container.style.color = "#000000";
      container.style.fontFamily = "Arial, Helvetica, sans-serif";
      container.style.fontSize = "14px";
      container.style.lineHeight = "1.6";
      container.innerHTML = `<style>
        h1 { font-size: 24px; font-weight: bold; margin: 16px 0 12px; color: #000; }
        h2 { font-size: 20px; font-weight: bold; margin: 14px 0 10px; color: #000; }
        h3 { font-size: 16px; font-weight: bold; margin: 12px 0 8px; color: #000; }
        p { margin: 8px 0; color: #000; }
        ul, ol { margin: 8px 0; padding-left: 24px; color: #000; }
        li { margin: 4px 0; }
        table { border-collapse: collapse; margin: 12px 0; width: 100%; }
        td, th { border: 1px solid #888; padding: 6px 8px; color: #000; }
        strong, b { font-weight: bold; }
        em, i { font-style: italic; }
        img { max-width: 100%; height: auto; }
      </style>${html}`;
      document.body.appendChild(container);

      // Render to canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });

      document.body.removeChild(container);

      // Build PDF, paginating the long canvas across A4 pages
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageWidthMm = pdf.internal.pageSize.getWidth();
      const pageHeightMm = pdf.internal.pageSize.getHeight();
      const imgWidthMm = pageWidthMm;
      const ratio = canvas.height / canvas.width;
      const imgHeightMm = imgWidthMm * ratio;

      let heightLeft = imgHeightMm;
      let position = 0;
      const imgData = canvas.toDataURL("image/jpeg", 0.92);

      pdf.addImage(imgData, "JPEG", 0, position, imgWidthMm, imgHeightMm);
      heightLeft -= pageHeightMm;

      while (heightLeft > 0) {
        position = heightLeft - imgHeightMm;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidthMm, imgHeightMm);
        heightLeft -= pageHeightMm;
      }

      const blob = pdf.output("blob");
      setResultBlob(blob);
      setResultName(file.name.replace(/\.(docx?|odt)$/i, "") + ".pdf");
      toast.success("Word converted to PDF");
    } catch (err) {
      console.error(err);
      toast.error("Failed to convert. Only .docx files are supported.");
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
  };

  return (
    <ToolLayout
      title="Word to PDF"
      description="Convert your .docx Word documents to professional PDF files"
      category="PDF Tools"
      categoryHref="/?cat=PDF Tools"
      icon={<FileType2 className="w-6 h-6" />}
      iconBg="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
    >
      {!file && (
        <FileDropZone
          onFile={setFile}
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          label="Drop your .docx file here"
          description="or click to browse"
        />
      )}

      {file && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-500" />
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
                  Converting…
                </>
              ) : (
                "Convert to PDF"
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
                  <Download className="w-4 h-4" /> Download PDF
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
          Supports .docx files only (the modern Word format). Your document is rendered with its headings, lists, tables, bold/italic and images, then paginated as A4 pages in a PDF. Output pages are rendered as images for layout fidelity, so text is not individually selectable.
        </p>
      </div>
    </ToolLayout>
  );
}
