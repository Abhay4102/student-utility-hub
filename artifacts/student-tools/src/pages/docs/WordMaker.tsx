import { useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { FileType2, Download, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { toast } from "sonner";

export default function WordMaker() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [sections, setSections] = useState<{ heading: string; body: string }[]>([{ heading: "", body: "" }]);
  const [loading, setLoading] = useState(false);
  const [docUrl, setDocUrl] = useState<string | null>(null);

  function addSection() { setSections((s) => [...s, { heading: "", body: "" }]); }
  function removeSection(i: number) { setSections((s) => s.filter((_, idx) => idx !== i)); }
  function updateSection(i: number, field: "heading" | "body", val: string) {
    setSections((s) => s.map((sec, idx) => idx === i ? { ...sec, [field]: val } : sec));
  }

  async function createDoc() {
    if (!title && sections.every((s) => !s.body)) { toast.error("Please add a title or some content"); return; }
    setLoading(true);
    try {
      const children: Paragraph[] = [];

      if (title) {
        children.push(new Paragraph({ text: title, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, spacing: { after: 400 } }));
      }
      if (author) {
        children.push(new Paragraph({
          children: [new TextRun({ text: `Author: ${author}`, italics: true, color: "666666" })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
        }));
      }

      for (const sec of sections) {
        if (sec.heading) {
          children.push(new Paragraph({ text: sec.heading, heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }));
        }
        if (sec.body) {
          const lines = sec.body.split("\n");
          for (const line of lines) {
            children.push(new Paragraph({ children: [new TextRun({ text: line })], spacing: { after: 160 } }));
          }
        }
      }

      const doc = new Document({
        creator: author || "Student Tools Hub",
        title: title || "Document",
        sections: [{ children }],
      });

      const blob = await Packer.toBlob(doc);
      setDocUrl(URL.createObjectURL(blob));
      toast.success("Word document created!");
    } catch {
      toast.error("Failed to create document.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolLayout
      title="Word File Maker"
      description="Create .docx Word documents with titles, headings, and body text"
      category="Document Tools"
      categoryHref="/"
      icon={<FileType2 className="w-6 h-6 text-green-700 dark:text-green-400" />}
      iconBg="bg-green-100 dark:bg-green-900/40"
    >
      <div className="bg-card border border-card-border rounded-xl p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="doc-title">Document Title</Label>
            <Input id="doc-title" data-testid="input-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My Document" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="doc-author">Author Name (optional)</Label>
            <Input id="doc-author" data-testid="input-author" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="John Doe" className="mt-1" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Document Sections</Label>
            <Button variant="outline" size="sm" onClick={addSection} data-testid="add-section-btn">
              <Plus className="w-3.5 h-3.5 mr-1" />Add Section
            </Button>
          </div>

          {sections.map((sec, i) => (
            <div key={i} data-testid={`section-${i}`} className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Section {i + 1}</p>
                {sections.length > 1 && (
                  <button onClick={() => removeSection(i)} className="text-muted-foreground hover:text-destructive transition-colors" data-testid={`remove-section-${i}`}>
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div>
                <Label htmlFor={`heading-${i}`} className="text-xs">Heading (optional)</Label>
                <Input id={`heading-${i}`} data-testid={`heading-${i}`} value={sec.heading} onChange={(e) => updateSection(i, "heading", e.target.value)} placeholder="Section Heading" className="mt-1" />
              </div>
              <div>
                <Label htmlFor={`body-${i}`} className="text-xs">Content</Label>
                <Textarea id={`body-${i}`} data-testid={`body-${i}`} value={sec.body} onChange={(e) => updateSection(i, "body", e.target.value)} placeholder="Write your content here..." rows={4} className="mt-1 text-sm" />
              </div>
            </div>
          ))}
        </div>

        {!docUrl ? (
          <Button onClick={createDoc} disabled={loading} className="w-full" data-testid="create-doc-btn">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating Document...</> : "Create Word Document"}
          </Button>
        ) : (
          <div className="space-y-2">
            <a href={docUrl} download={`${title || "document"}.docx`} data-testid="download-btn">
              <Button className="w-full"><Download className="w-4 h-4 mr-2" />Download .docx</Button>
            </a>
            <Button variant="outline" onClick={() => setDocUrl(null)} className="w-full">Edit and regenerate</Button>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
