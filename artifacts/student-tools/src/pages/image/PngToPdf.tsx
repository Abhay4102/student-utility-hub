import { ImagesToPdfTool } from "./JpgToPdf";

export default function PngToPdf() {
  return (
    <ImagesToPdfTool
      title="PNG to PDF"
      description="Combine many PNGs into one PDF — choose page size, reorder pages, set margins"
      accept=".png"
      acceptLabel="PNG images"
    />
  );
}
