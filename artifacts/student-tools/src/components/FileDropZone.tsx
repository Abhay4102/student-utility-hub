import { useRef, useState, useCallback } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropZoneProps {
  onFile: (file: File) => void;
  accept?: string;
  label?: string;
  description?: string;
  multiple?: boolean;
  onFiles?: (files: File[]) => void;
}

export function FileDropZone({
  onFile,
  accept,
  label = "Drop your file here",
  description = "or click to browse",
  multiple = false,
  onFiles,
}: FileDropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (!files.length) return;
      if (multiple && onFiles) {
        onFiles(files);
      } else {
        onFile(files[0]);
      }
    },
    [onFile, multiple, onFiles]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      if (multiple && onFiles) {
        onFiles(files);
      } else {
        onFile(files[0]);
      }
      e.target.value = "";
    },
    [onFile, multiple, onFiles]
  );

  return (
    <div
      data-testid="file-drop-zone"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "cursor-pointer border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 transition-all duration-200",
        dragging
          ? "border-primary bg-primary/5 scale-[1.01]"
          : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
      )}
    >
      <div className={cn(
        "w-14 h-14 rounded-full flex items-center justify-center transition-colors",
        dragging ? "bg-primary/10" : "bg-muted"
      )}>
        <Upload className={cn("w-6 h-6 transition-colors", dragging ? "text-primary" : "text-muted-foreground")} />
      </div>
      <div className="text-center">
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
        {accept && (
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">{accept.replace(/\./g, "").replace(/,/g, " · ")}</p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
        data-testid="file-input"
      />
    </div>
  );
}
