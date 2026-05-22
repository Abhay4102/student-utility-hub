import { Slider } from "./ui/slider";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";

export interface PdfBuildOptions {
  pageMode: "fit" | "actual";
  pageSize: [number, number];
  pageSizeKey: PageSizeKey;
  margin: number;
}

type PageSizeKey = "A4P" | "A4L" | "LetterP" | "LetterL" | "A3P" | "A5P";

const PAGE_SIZES: Record<PageSizeKey, { label: string; size: [number, number] }> = {
  A4P:     { label: "A4 — Portrait (595×842)",      size: [595, 842] },
  A4L:     { label: "A4 — Landscape (842×595)",     size: [842, 595] },
  LetterP: { label: "Letter — Portrait (612×792)",  size: [612, 792] },
  LetterL: { label: "Letter — Landscape (792×612)", size: [792, 612] },
  A3P:     { label: "A3 — Portrait (842×1191)",     size: [842, 1191] },
  A5P:     { label: "A5 — Portrait (420×595)",      size: [420, 595] },
};

export const defaultPdfOptions: PdfBuildOptions = {
  pageMode: "fit",
  pageSize: PAGE_SIZES.A4P.size,
  pageSizeKey: "A4P",
  margin: 24,
};

export function ImagesToPdfControls({ value, onChange }: {
  value: PdfBuildOptions;
  onChange: (v: PdfBuildOptions) => void;
}) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-4 grid sm:grid-cols-2 gap-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Page sizing</label>
        <Select
          value={value.pageMode}
          onValueChange={(v) => onChange({ ...value, pageMode: v as "fit" | "actual" })}
        >
          <SelectTrigger data-testid="page-mode-select"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="fit">Fit images to standard page</SelectItem>
            <SelectItem value="actual">One page per image (actual pixel size)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {value.pageMode === "fit" && (
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Paper size</label>
          <Select
            value={value.pageSizeKey}
            onValueChange={(v) => {
              const k = v as PageSizeKey;
              onChange({ ...value, pageSizeKey: k, pageSize: PAGE_SIZES[k].size });
            }}
          >
            <SelectTrigger data-testid="page-size-select"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.entries(PAGE_SIZES) as Array<[PageSizeKey, typeof PAGE_SIZES["A4P"]]>).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {value.pageMode === "fit" && (
        <div className="sm:col-span-2">
          <div className="flex justify-between text-xs font-medium text-muted-foreground mb-1.5">
            <span>Margin</span>
            <span className="text-foreground">{value.margin} pt</span>
          </div>
          <Slider min={0} max={96} step={4} value={[value.margin]} onValueChange={(v) => onChange({ ...value, margin: v[0] })} />
        </div>
      )}
    </div>
  );
}
