import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileDropZone } from "./FileDropZone";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Download, X, RotateCcw, Loader2, CheckCircle2, AlertCircle, Plus, FileArchive, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { convertImageFile, downloadBlob, formatBytes, stripExt, zipAndDownload, type ImageConvertOptions } from "@/lib/convertHelpers";

interface Job {
  id: string;
  file: File;
  previewUrl: string;
  status: "queued" | "running" | "done" | "error";
  output?: Blob;
  outputName?: string;
  outputUrl?: string;
  error?: string;
}

type Status = Job["status"];

const STATUS_ICON: Record<Status, React.ReactNode> = {
  queued: <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />,
  running: <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />,
  done: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
  error: <AlertCircle className="w-3.5 h-3.5 text-destructive" />,
};

export interface BatchImageConverterProps {
  /** Accept attribute for the dropzone */
  accept: string;
  acceptLabel: string;
  /** Output extension (no dot) */
  outputExt: "jpg" | "png" | "webp";
  /** Output mime */
  outputMime: ImageConvertOptions["mime"];
  /** Whether quality slider is shown (only relevant for jpg/webp) */
  showQuality?: boolean;
  /** Default quality 0..1 */
  defaultQuality?: number;
  /** Background fill when converting (e.g. from PNG transparency to JPG) */
  background?: string;
  /** Show resize-max-edge control */
  showResize?: boolean;
}

let idSeq = 0;

export function BatchImageConverter({
  accept, acceptLabel, outputExt, outputMime,
  showQuality = false, defaultQuality = 0.92,
  background, showResize = false,
}: BatchImageConverterProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [quality, setQuality] = useState(Math.round(defaultQuality * 100));
  const [maxEdge, setMaxEdge] = useState(0);
  const [busy, setBusy] = useState(false);
  const urlsRef = useRef<string[]>([]);

  // Clean up object URLs on unmount
  useEffect(() => () => {
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const onFiles = useCallback((files: File[]) => {
    const additions: Job[] = files.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      urlsRef.current.push(previewUrl);
      return { id: `j${++idSeq}`, file, previewUrl, status: "queued" };
    });
    setJobs((prev) => [...prev, ...additions]);
  }, []);

  const removeJob = (id: string) => {
    setJobs((prev) => {
      const target = prev.find((j) => j.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
        if (target.outputUrl) URL.revokeObjectURL(target.outputUrl);
      }
      return prev.filter((j) => j.id !== id);
    });
  };

  const clearAll = () => {
    jobs.forEach((j) => {
      URL.revokeObjectURL(j.previewUrl);
      if (j.outputUrl) URL.revokeObjectURL(j.outputUrl);
    });
    setJobs([]);
    urlsRef.current = [];
  };

  const runAll = async () => {
    const queued = jobs.filter((j) => j.status === "queued" || j.status === "error");
    if (!queued.length) return;
    setBusy(true);
    let okCount = 0;
    for (const job of queued) {
      setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: "running", error: undefined } : j)));
      try {
        const blob = await convertImageFile(job.file, {
          mime: outputMime,
          quality: showQuality ? quality / 100 : undefined,
          background,
          maxEdge: showResize && maxEdge > 0 ? maxEdge : undefined,
        });
        const outputName = `${stripExt(job.file.name)}.${outputExt}`;
        const outputUrl = URL.createObjectURL(blob);
        urlsRef.current.push(outputUrl);
        setJobs((prev) => prev.map((j) =>
          j.id === job.id ? { ...j, status: "done", output: blob, outputName, outputUrl } : j,
        ));
        okCount++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Conversion failed";
        setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: "error", error: msg } : j)));
      }
    }
    setBusy(false);
    if (okCount > 0) toast.success(`Converted ${okCount} file${okCount === 1 ? "" : "s"}`);
  };

  const downloadOne = (job: Job) => {
    if (!job.output || !job.outputName) return;
    downloadBlob(job.output, job.outputName);
  };

  const downloadAll = async () => {
    const done = jobs.filter((j) => j.status === "done" && j.output && j.outputName);
    if (!done.length) return;
    if (done.length === 1) {
      downloadOne(done[0]);
      return;
    }
    await zipAndDownload(
      done.map((j) => ({ name: j.outputName!, blob: j.output! })),
      `converted-${outputExt}-${Date.now()}.zip`,
    );
    toast.success(`Zipped ${done.length} files`);
  };

  const stats = useMemo(() => {
    const done = jobs.filter((j) => j.status === "done");
    const origSize = done.reduce((s, j) => s + j.file.size, 0);
    const outSize = done.reduce((s, j) => s + (j.output?.size ?? 0), 0);
    const savings = origSize > 0 ? ((origSize - outSize) / origSize) * 100 : 0;
    return { count: done.length, origSize, outSize, savings };
  }, [jobs]);

  const hasJobs = jobs.length > 0;
  const allDone = hasJobs && jobs.every((j) => j.status === "done");
  const anyQueued = jobs.some((j) => j.status === "queued" || j.status === "error");

  return (
    <div className="space-y-4">
      {!hasJobs ? (
        <FileDropZone
          multiple
          onFile={(f) => onFiles([f])}
          onFiles={onFiles}
          accept={accept}
          label={`Drop ${acceptLabel} here`}
          description="Add one or many — they'll convert in batch"
        />
      ) : (
        <>
          <div className="bg-card border border-card-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{jobs.length} file{jobs.length === 1 ? "" : "s"}</h3>
                {allDone && (
                  <span className="text-xs text-muted-foreground">
                    · {formatBytes(stats.origSize)} → {formatBytes(stats.outSize)}
                    {stats.savings > 0 && <span className="text-emerald-600 dark:text-emerald-400"> (-{stats.savings.toFixed(0)}%)</span>}
                    {stats.savings < -1 && <span className="text-amber-600 dark:text-amber-400"> (+{(-stats.savings).toFixed(0)}%)</span>}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <AddMoreButton accept={accept} onFiles={onFiles} />
                <Button size="sm" variant="ghost" onClick={clearAll} data-testid="clear-all-btn">
                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> Clear
                </Button>
              </div>
            </div>

            {(showQuality || showResize) && (
              <div className="grid sm:grid-cols-2 gap-4 mb-4 pb-4 border-b border-border">
                {showQuality && (
                  <div>
                    <div className="flex justify-between text-xs font-medium text-muted-foreground mb-1.5">
                      <span>Quality</span>
                      <span className="text-foreground">{quality}%</span>
                    </div>
                    <Slider min={40} max={100} step={1} value={[quality]} onValueChange={(v) => setQuality(v[0])} data-testid="quality-slider" />
                  </div>
                )}
                {showResize && (
                  <div>
                    <div className="flex justify-between text-xs font-medium text-muted-foreground mb-1.5">
                      <span>Resize (longest side)</span>
                      <span className="text-foreground">{maxEdge === 0 ? "Original" : `${maxEdge} px`}</span>
                    </div>
                    <Slider min={0} max={4096} step={64} value={[maxEdge]} onValueChange={(v) => setMaxEdge(v[0])} />
                  </div>
                )}
              </div>
            )}

            <ul className="divide-y divide-border">
              {jobs.map((j) => (
                <li key={j.id} className="py-2.5 flex items-center gap-3" data-testid={`job-${j.id}`}>
                  <img
                    src={j.outputUrl || j.previewUrl}
                    alt=""
                    className="w-12 h-12 rounded-md object-cover bg-muted border border-border"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {STATUS_ICON[j.status]}
                      <p className="font-medium text-sm truncate">{j.file.name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(j.file.size)}
                      {j.output && (
                        <>
                          <ArrowDown className="w-3 h-3 inline mx-1 -mt-0.5" />
                          {formatBytes(j.output.size)}
                        </>
                      )}
                      {j.error && <span className="text-destructive ml-1">— {j.error}</span>}
                    </p>
                  </div>
                  {j.status === "done" && (
                    <Button size="sm" variant="outline" onClick={() => downloadOne(j)} data-testid={`download-${j.id}`}>
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <button
                    onClick={() => removeJob(j.id)}
                    className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors"
                    aria-label="Remove"
                    data-testid={`remove-${j.id}`}
                  ><X className="w-4 h-4" /></button>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {anyQueued && (
              <Button onClick={runAll} disabled={busy} className="flex-1" data-testid="convert-all-btn">
                {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Converting…</> : `Convert ${jobs.filter((j) => j.status === "queued" || j.status === "error").length} file${jobs.filter((j) => j.status === "queued" || j.status === "error").length === 1 ? "" : "s"}`}
              </Button>
            )}
            {stats.count > 0 && (
              <Button onClick={downloadAll} variant={anyQueued ? "outline" : "default"} className="flex-1" data-testid="download-all-btn">
                {stats.count > 1 ? <FileArchive className="w-4 h-4 mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                {stats.count > 1 ? `Download ZIP (${stats.count})` : "Download"}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function AddMoreButton({ accept, onFiles }: { accept: string; onFiles: (f: File[]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => ref.current?.click()} data-testid="add-more-btn">
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
