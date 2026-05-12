import { useState } from "react";
import { FileDropZone } from "@/components/FileDropZone";
import { ToolLayout } from "@/components/ToolLayout";
import { Minimize2, Download, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import imageCompression from "browser-image-compression";
import { toast } from "sonner";

type Mode = "dimensions" | "size";

export default function PhotoResizer() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("dimensions");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [targetSize, setTargetSize] = useState("500");
  const [targetUnit, setTargetUnit] = useState<"KB" | "MB" | "GB">("KB");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ url: string; size: number } | null>(null);

  function handleFile(f: File) {
    setFile(f);
    setResult(null);
    const img = new Image();
    const url = URL.createObjectURL(f);
    setPreview(url);
    img.onload = () => {
      setWidth(String(img.naturalWidth));
      setHeight(String(img.naturalHeight));
    };
    img.src = url;
  }

  function reset() { setFile(null); setPreview(null); setResult(null); }

  async function resize() {
    if (!file) return;
    setLoading(true);
    try {
      if (mode === "size") {
        const unitMultiplier = targetUnit === "KB" ? 1 / 1024 : targetUnit === "MB" ? 1 : 1024;
        const maxSizeMB = parseFloat(targetSize) * unitMultiplier;
        const compressed = await imageCompression(file, { maxSizeMB, useWebWorker: true });
        setResult({ url: URL.createObjectURL(compressed), size: compressed.size });
        toast.success("Image compressed successfully!");
      } else {
        const w = parseInt(width);
        const h = parseInt(height);
        if (!w || !h) { toast.error("Enter valid dimensions"); setLoading(false); return; }
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await new Promise<void>((res) => { img.onload = () => res(); });
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => {
          if (!blob) { toast.error("Resize failed"); setLoading(false); return; }
          setResult({ url: URL.createObjectURL(blob), size: blob.size });
          setLoading(false);
          toast.success("Image resized!");
        }, file.type || "image/jpeg", 0.92);
        return;
      }
    } catch {
      toast.error("Failed to process image.");
    } finally {
      setLoading(false);
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <ToolLayout
      title="Photo Resizer"
      description="Resize images by dimensions or compress to a target file size"
      category="Image Tools"
      categoryHref="/"
      icon={<Minimize2 className="w-6 h-6 text-blue-700 dark:text-blue-400" />}
      iconBg="bg-blue-100 dark:bg-blue-900/40"
    >
      <div className="space-y-4">
        {!file ? (
          <FileDropZone onFile={handleFile} accept=".jpg,.jpeg,.png,.webp" label="Drop an image here" description="or click to browse — JPG, PNG, WebP accepted" />
        ) : (
          <div className="bg-card border border-card-border rounded-xl p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-xs text-muted-foreground">Original: {formatSize(file.size)}</p>
              </div>
              <button onClick={reset} className="text-muted-foreground hover:text-foreground" data-testid="reset-btn"><RotateCcw className="w-4 h-4" /></button>
            </div>

            {preview && !result && (
              <div className="flex justify-center">
                <img src={preview} alt="Preview" className="max-h-40 rounded-lg object-contain" />
              </div>
            )}

            {result && (
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Original</p>
                  <img src={preview!} alt="Original" className="max-h-32 rounded-lg object-contain mx-auto" />
                  <p className="text-xs mt-1 font-medium">{formatSize(file.size)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Result</p>
                  <img src={result.url} alt="Result" className="max-h-32 rounded-lg object-contain mx-auto" />
                  <p className="text-xs mt-1 font-medium text-green-600">{formatSize(result.size)}</p>
                </div>
              </div>
            )}

            <div className="flex rounded-lg border border-border overflow-hidden">
              {(["dimensions", "size"] as Mode[]).map((m) => (
                <button
                  key={m}
                  data-testid={`mode-${m}`}
                  onClick={() => { setMode(m); setResult(null); }}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                >
                  {m === "dimensions" ? "By Dimensions (px)" : "By File Size"}
                </button>
              ))}
            </div>

            {mode === "dimensions" ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="width">Width (px)</Label>
                  <Input id="width" data-testid="input-width" type="number" value={width} onChange={(e) => setWidth(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="height">Height (px)</Label>
                  <Input id="height" data-testid="input-height" type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="mt-1" />
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="target-size">Target Size</Label>
                  <Input id="target-size" data-testid="input-target-size" type="number" value={targetSize} onChange={(e) => setTargetSize(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Unit</Label>
                  <div className="flex gap-1 mt-1">
                    {(["KB", "MB", "GB"] as const).map((u) => (
                      <button key={u} data-testid={`unit-${u}`} onClick={() => setTargetUnit(u)} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${targetUnit === u ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>{u}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!result ? (
              <Button onClick={resize} disabled={loading} className="w-full" data-testid="resize-btn">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</> : "Resize Image"}
              </Button>
            ) : (
              <div className="space-y-2">
                <a href={result.url} download={`resized-${file.name}`} data-testid="download-btn">
                  <Button className="w-full"><Download className="w-4 h-4 mr-2" />Download Result</Button>
                </a>
                <Button variant="outline" onClick={() => setResult(null)} className="w-full">Try different settings</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
