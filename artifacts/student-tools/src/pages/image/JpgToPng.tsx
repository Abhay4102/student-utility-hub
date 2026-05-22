import { ToolLayout } from "@/components/ToolLayout";
import { BatchImageConverter } from "@/components/BatchImageConverter";
import { FileImage } from "lucide-react";

export default function JpgToPng() {
  return (
    <ToolLayout
      title="JPG to PNG"
      description="Batch-convert JPGs to lossless PNGs — supports many files at once with optional resize"
      category="Image Tools"
      categoryHref="/"
      icon={<FileImage className="w-6 h-6 text-blue-700 dark:text-blue-400" />}
      iconBg="bg-blue-100 dark:bg-blue-900/40"
    >
      <BatchImageConverter
        accept=".jpg,.jpeg"
        acceptLabel="JPG images"
        outputExt="png"
        outputMime="image/png"
        showResize
      />
    </ToolLayout>
  );
}
