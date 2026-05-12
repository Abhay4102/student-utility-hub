import { useState } from "react";
import { FileDropZone } from "@/components/FileDropZone";
import { ToolLayout } from "@/components/ToolLayout";
import { FileImage, Download, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function JpgToPng() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pngUrl, setPngUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleFile(f: File) {
    setFile(f);
    setPngUrl(null);
    setPreview(URL.createObjectURL(f));
  }

  function reset() { setFile(null); setPreview(null); setPngUrl(null); }

  async function convert() {
    if (!file) return;
    setLoading(true);
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
      const blob = await new Promise<Blob>((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/png")
      );
      setPngUrl(URL.createObjectURL(blob));
      toast.success("Converted to PNG!");
    } catch (err) {
      console.error(err);
      toast.error("Conversion failed. Make sure it's a valid JPG image.");
    } finally {
      setLoading(false);
    }
  }

  function download() {
    if (!pngUrl || !file) return;
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = file.name.replace(/\.[^.]+$/, "") + ".png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <ToolLayout
      title="JPG to PNG"
      description="Convert JPG images to PNG format with transparency support"
      category="Image Tools"
      categoryHref="/"
      icon={<FileImage className="w-6 h-6 text-blue-700 dark:text-blue-400" />}
      iconBg="bg-blue-100 dark:bg-blue-900/40"
    >
      <div className="space-y-4">
        {!file ? (
          <FileDropZone onFile={handleFile} accept=".jpg,.jpeg" label="Drop a JPG image here" description="or click to browse" />
        ) : (
          <div className="bg-card border border-card-border rounded-xl p-5 space-y-4">
            {preview && (
              <div className="flex justify-center">
                <img src={pngUrl || preview} alt="Preview" className="max-h-48 rounded-lg object-contain shadow-sm" />
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <div><p className="font-medium">{file.name}</p><p className="text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p></div>
              <button onClick={reset} className="text-muted-foreground hover:text-foreground" data-testid="reset-btn"><RotateCcw className="w-4 h-4" /></button>
            </div>
            {!pngUrl ? (
              <Button onClick={convert} disabled={loading} className="w-full" data-testid="convert-btn">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Converting...</> : "Convert to PNG"}
              </Button>
            ) : (
              <div className="space-y-2">
                <Button onClick={download} className="w-full" data-testid="download-btn">
                  <Download className="w-4 h-4 mr-2" />Download PNG
                </Button>
                <Button variant="outline" onClick={reset} className="w-full">Try another file</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
