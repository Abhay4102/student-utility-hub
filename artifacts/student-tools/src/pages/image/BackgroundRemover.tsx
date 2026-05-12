import { useState } from "react";
import { FileDropZone } from "@/components/FileDropZone";
import { ToolLayout } from "@/components/ToolLayout";
import { Eraser, Download, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { removeBackground } from "@imgly/background-removal";
import { toast } from "sonner";

const presetColors = [
  "#ffffff", "#000000", "#f3f4f6", "#1e3a5f", "#e74c3c",
  "#2ecc71", "#3498db", "#9b59b6", "#f39c12", "#1abc9c",
];

export default function BackgroundRemover() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [bgColor, setBgColor] = useState<string | null>(null);
  const [finalUrl, setFinalUrl] = useState<string | null>(null);

  function handleFile(f: File) {
    setFile(f);
    setResultUrl(null);
    setFinalUrl(null);
    setBgColor(null);
    setPreview(URL.createObjectURL(f));
  }

  function reset() { setFile(null); setPreview(null); setResultUrl(null); setFinalUrl(null); setBgColor(null); }

  async function removeBg() {
    if (!file) return;
    setLoading(true);
    setProgress("Loading AI model...");
    try {
      setProgress("Removing background... this may take 15-30 seconds");
      const blob = await removeBackground(file);
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setFinalUrl(url);
      setProgress("");
      toast.success("Background removed!");
    } catch {
      setProgress("");
      toast.error("Failed to remove background. Try a different image.");
    } finally {
      setLoading(false);
    }
  }

  async function applyColor(color: string) {
    if (!resultUrl) return;
    setBgColor(color);
    const img = new Image();
    img.src = resultUrl;
    await new Promise<void>((res) => { img.onload = () => res(); });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) setFinalUrl(URL.createObjectURL(blob));
    }, "image/png");
  }

  function clearBg() { setBgColor(null); setFinalUrl(resultUrl); }

  return (
    <ToolLayout
      title="Background Remover"
      description="Remove image backgrounds with AI, then optionally add a new color"
      category="Image Tools"
      categoryHref="/"
      icon={<Eraser className="w-6 h-6 text-blue-700 dark:text-blue-400" />}
      iconBg="bg-blue-100 dark:bg-blue-900/40"
    >
      <div className="space-y-4">
        {!file ? (
          <FileDropZone onFile={handleFile} accept=".jpg,.jpeg,.png,.webp" label="Drop an image here" description="Works best with photos of people, products, and objects" />
        ) : (
          <div className="bg-card border border-card-border rounded-xl p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div><p className="font-medium text-sm">{file.name}</p><p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p></div>
              <button onClick={reset} className="text-muted-foreground hover:text-foreground" data-testid="reset-btn"><RotateCcw className="w-4 h-4" /></button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground text-center mb-2">Original</p>
                <img src={preview!} alt="Original" className="w-full rounded-lg object-contain max-h-48 border border-border" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground text-center mb-2">Result</p>
                {finalUrl ? (
                  <img src={finalUrl} alt="Result" className="w-full rounded-lg object-contain max-h-48 border border-border" style={{ background: bgColor ? bgColor : "repeating-conic-gradient(#e0e0e0 0% 25%, #ffffff 0% 50%) 0 0 / 16px 16px" }} />
                ) : (
                  <div className="w-full max-h-48 h-48 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
                    {loading ? progress : "Result appears here"}
                  </div>
                )}
              </div>
            </div>

            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>{progress}</span>
              </div>
            )}

            {!resultUrl ? (
              <Button onClick={removeBg} disabled={loading} className="w-full" data-testid="remove-bg-btn">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing AI...</> : "Remove Background"}
              </Button>
            ) : (
              <>
                <div>
                  <Label className="text-sm mb-2 block">Change Background Color</Label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      data-testid="bg-transparent"
                      onClick={clearBg}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${!bgColor ? "border-primary scale-110" : "border-border"}`}
                      style={{ background: "repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 8px 8px" }}
                      title="Transparent"
                    />
                    {presetColors.map((c) => (
                      <button
                        key={c}
                        data-testid={`bg-color-${c}`}
                        onClick={() => applyColor(c)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${bgColor === c ? "border-primary scale-110" : "border-border"}`}
                        style={{ background: c }}
                      />
                    ))}
                    <input type="color" value={bgColor || "#ffffff"} onChange={(e) => applyColor(e.target.value)} className="w-8 h-8 rounded-full cursor-pointer border border-border" data-testid="bg-color-picker" />
                  </div>
                </div>
                <div className="space-y-2">
                  <a href={finalUrl!} download={`bg-removed-${file.name.replace(/\.[^.]+$/, "")}.png`} data-testid="download-btn">
                    <Button className="w-full"><Download className="w-4 h-4 mr-2" />Download PNG</Button>
                  </a>
                  <Button variant="outline" onClick={reset} className="w-full">Try another image</Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
