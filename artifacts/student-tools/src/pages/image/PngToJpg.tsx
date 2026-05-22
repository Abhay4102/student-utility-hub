import { ToolLayout } from "@/components/ToolLayout";
import { BatchImageConverter } from "@/components/BatchImageConverter";
import { FileImage } from "lucide-react";

export default function PngToJpg() {
  return (
    <ToolLayout
      title="PNG to JPG"
      description="Batch-convert PNGs to JPGs — quality slider, white background fill, batch ZIP download"
      category="Image Tools"
      categoryHref="/"
      icon={<FileImage className="w-6 h-6 text-blue-700 dark:text-blue-400" />}
      iconBg="bg-blue-100 dark:bg-blue-900/40"
    >
      <BatchImageConverter
        accept=".png"
        acceptLabel="PNG images"
        outputExt="jpg"
        outputMime="image/jpeg"
        defaultQuality={0.92}
        showQuality
        showResize
        background="#ffffff"
      />
    </ToolLayout>
  );
}
