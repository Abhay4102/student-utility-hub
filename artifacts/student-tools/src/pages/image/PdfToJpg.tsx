import { ToolLayout } from "@/components/ToolLayout";
import { PdfPagesExtractor } from "@/components/PdfPagesExtractor";
import { FileInput } from "lucide-react";

export default function PdfToJpg() {
  return (
    <ToolLayout
      title="PDF to JPG"
      description="Render PDF pages as JPGs — pick page ranges, adjust DPI, download individually or as a ZIP"
      category="Image Tools"
      categoryHref="/"
      icon={<FileInput className="w-6 h-6 text-blue-700 dark:text-blue-400" />}
      iconBg="bg-blue-100 dark:bg-blue-900/40"
    >
      <PdfPagesExtractor outputExt="jpg" outputMime="image/jpeg" showQuality defaultQuality={0.92} />
    </ToolLayout>
  );
}
