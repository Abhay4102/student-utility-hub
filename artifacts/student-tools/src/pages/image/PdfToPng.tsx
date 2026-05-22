import { ToolLayout } from "@/components/ToolLayout";
import { PdfPagesExtractor } from "@/components/PdfPagesExtractor";
import { FileInput } from "lucide-react";

export default function PdfToPng() {
  return (
    <ToolLayout
      title="PDF to PNG"
      description="Render PDF pages as lossless PNGs — pick page ranges, adjust DPI, download individually or as a ZIP"
      category="Image Tools"
      categoryHref="/"
      icon={<FileInput className="w-6 h-6 text-blue-700 dark:text-blue-400" />}
      iconBg="bg-blue-100 dark:bg-blue-900/40"
    >
      <PdfPagesExtractor outputExt="png" outputMime="image/png" />
    </ToolLayout>
  );
}
