import { useState } from "react";
import { FileDropZone } from "@/components/FileDropZone";
import { ToolLayout } from "@/components/ToolLayout";
import { FileImage, Download, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function PngToJpg() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [jpgUrl, setJpgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleFile(f: File) { setFile(f); setJpgUrl(null); setPreview(URL.createObjectURL(f)); }
  function reset() { setFile(null); setPreview(null); setJpgUrl(null); }

  async function convert() {
    if (!file || !preview) return;
    setLoading(true);
    try {
      const img = new Image();
      img.src = preview;
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; });
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) { toast.error("Conversion failed"); setLoading(false); return; }
        setJpgUrl(URL.createObjectURL(blob));
        setLoading(false);
        toast.success("Converted to JPG!");
      }, "image/jpeg", 0.92);
    } catch {
      toast.error("Conversion failed.");
      setLoading(false);
    }
  }

  return (
    <ToolLayout
      title="PNG to JPG"
      description="Convert PNG images to JPG format (transparent areas become white)"
      category="Image Tools"
      categoryHref="/"
      icon={<FileImage className="w-6 h-6 text-blue-700 dark:text-blue-400" />}
      iconBg="bg-blue-100 dark:bg-blue-900/40"
    >
      <div className="space-y-4">
        {!file ? (
          <FileDropZone onFile={handleFile} accept=".png" label="Drop a PNG image here" description="or click to browse" />
        ) : (
          <div className="bg-card border border-card-border rounded-xl p-5 space-y-4">
            {preview && <div className="flex justify-center"><img src={jpgUrl || preview} alt="Preview" className="max-h-48 rounded-lg object-contain shadow-sm bg-checkerboard" /></div>}
            <div className="flex items-center justify-between text-sm">
              <div><p className="font-medium">{file.name}</p><p className="text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p></div>
              <button onClick={reset} className="text-muted-foreground hover:text-foreground" data-testid="reset-btn"><RotateCcw className="w-4 h-4" /></button>
            </div>
            {!jpgUrl ? (
              <Button onClick={convert} disabled={loading} className="w-full" data-testid="convert-btn">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Converting...</> : "Convert to JPG"}
              </Button>
            ) : (
              <div className="space-y-2">
                <a href={jpgUrl} download={file.name.replace(/\.[^.]+$/, "") + ".jpg"} data-testid="download-btn">
                  <Button className="w-full"><Download className="w-4 h-4 mr-2" />Download JPG</Button>
                </a>
                <Button variant="outline" onClick={reset} className="w-full">Try another file</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
