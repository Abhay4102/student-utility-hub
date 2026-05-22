import { useCallback, useEffect, useRef, useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { FileDropZone } from "@/components/FileDropZone";
import { Button } from "@/components/ui/button";
import { FileOutput, Download, X, Loader2, ArrowUp, ArrowDown, Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { imagesToPdf, downloadBlob, formatBytes } from "@/lib/convertHelpers";
import { ImagesToPdfControls, type PdfBuildOptions, defaultPdfOptions } from "@/components/ImagesToPdfControls";

interface Item { id: string; file: File; url: string }
let idSeq = 0;

function ImagesToPdfTool({
  title, description, accept, acceptLabel,
}: { title: string; description: string; accept: string; acceptLabel: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [opts, setOpts] = useState<PdfBuildOptions>(defaultPdfOptions);
  const [busy, setBusy] = useState(false);
  const urlsRef = useRef<string[]>([]);

  useEffect(() => () => { urlsRef.current.forEach((u) => URL.revokeObjectURL(u)); }, []);

  const onFiles = useCallback((files: File[]) => {
    const additions: Item[] = files.map((f) => {
      const url = URL.createObjectURL(f);
      urlsRef.current.push(url);
      return { id: `i${++idSeq}`, file: f, url };
    });
    setItems((prev) => [...prev, ...additions]);
  }, []);

  const remove = (id: string) => setItems((prev) => {
    const target = prev.find((i) => i.id === id);
    if (target) {
      URL.revokeObjectURL(target.url);
      urlsRef.current = urlsRef.current.filter((u) => u !== target.url);
    }
    return prev.filter((i) => i.id !== id);
  });
  const move = (id: string, dir: -1 | 1) => setItems((prev) => {
    const idx = prev.findIndex((i) => i.id === id);
    if (idx < 0) return prev;
    const j = idx + dir;
    if (j < 0 || j >= prev.length) return prev;
    const copy = [...prev];
    [copy[idx], copy[j]] = [copy[j], copy[idx]];
    return copy;
  });
  const clear = () => { urlsRef.current.forEach(URL.revokeObjectURL); urlsRef.current = []; setItems([]); };

  const build = async () => {
    if (!items.length) return;
    setBusy(true);
    try {
      const blob = await imagesToPdf(items.map((i) => i.file), {
        pageMode: opts.pageMode,
        pageSize: opts.pageSize,
        margin: opts.margin,
      });
      const name = items.length === 1
        ? items[0].file.name.replace(/\.[^.]+$/, "") + ".pdf"
        : `images-${Date.now()}.pdf`;
      downloadBlob(blob, name);
      toast.success(`Created PDF (${items.length} page${items.length === 1 ? "" : "s"})`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to build PDF. Make sure all images are valid.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolLayout
      title={title}
      description={description}
      category="Image Tools"
      categoryHref="/"
      icon={<FileOutput className="w-6 h-6 text-blue-700 dark:text-blue-400" />}
      iconBg="bg-blue-100 dark:bg-blue-900/40"
    >
      <div className="space-y-4">
        {!items.length ? (
          <FileDropZone
            multiple
            onFile={(f) => onFiles([f])}
            onFiles={onFiles}
            accept={accept}
            label={`Drop ${acceptLabel} here`}
            description="Add many — they'll become consecutive pages in one PDF"
          />
        ) : (
          <>
            <div className="bg-card border border-card-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <h3 className="font-semibold">{items.length} image{items.length === 1 ? "" : "s"}</h3>
                <div className="flex items-center gap-1">
                  <AddMoreButton accept={accept} onFiles={onFiles} />
                  <Button size="sm" variant="ghost" onClick={clear}><RotateCcw className="w-3.5 h-3.5 mr-1" />Clear</Button>
                </div>
              </div>
              <ul className="divide-y divide-border">
                {items.map((it, i) => (
                  <li key={it.id} className="py-2.5 flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground w-6 text-center">{i + 1}</span>
                    <img src={it.url} alt="" className="w-12 h-12 rounded-md object-cover bg-muted border border-border" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{it.file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatBytes(it.file.size)}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => move(it.id, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => move(it.id, 1)} disabled={i === items.length - 1} aria-label="Move down"><ArrowDown className="w-3.5 h-3.5" /></Button>
                    <button onClick={() => remove(it.id)} className="p-1 text-muted-foreground hover:text-destructive" aria-label="Remove"><X className="w-4 h-4" /></button>
                  </li>
                ))}
              </ul>
            </div>

            <ImagesToPdfControls value={opts} onChange={setOpts} />

            <Button onClick={build} disabled={busy} className="w-full" data-testid="build-pdf-btn">
              {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Building PDF…</> : <><Download className="w-4 h-4 mr-2" />Build & download PDF</>}
            </Button>
          </>
        )}
      </div>
    </ToolLayout>
  );
}

function AddMoreButton({ accept, onFiles }: { accept: string; onFiles: (f: File[]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => ref.current?.click()}>
        <Plus className="w-3.5 h-3.5 mr-1" /> Add more
      </Button>
      <input
        ref={ref} type="file" accept={accept} multiple className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length) onFiles(files);
          e.target.value = "";
        }}
      />
    </>
  );
}

export default function JpgToPdf() {
  return (
    <ImagesToPdfTool
      title="JPG to PDF"
      description="Combine many JPGs into one PDF — choose page size, reorder pages, set margins"
      accept=".jpg,.jpeg"
      acceptLabel="JPG images"
    />
  );
}

export { ImagesToPdfTool };
