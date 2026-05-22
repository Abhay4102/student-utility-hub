import { useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { FileType2, Download, Loader2, Plus, X, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Footer, PageNumber, NumberFormat,
} from "docx";
import { toast } from "sonner";
import { downloadBlob } from "@/lib/convertHelpers";

type Align = "left" | "center" | "right" | "justify";
type HeadingKey = "none" | "h1" | "h2" | "h3";
type BodyKind = "paragraph" | "bullets" | "numbered";

interface Section {
  id: string;
  heading: string;
  headingLevel: HeadingKey;
  body: string;
  bodyKind: BodyKind;
  align: Align;
  bold: boolean;
  italic: boolean;
}

let idSeq = 0;
const mk = (): Section => ({
  id: `s${++idSeq}`,
  heading: "",
  headingLevel: "h1",
  body: "",
  bodyKind: "paragraph",
  align: "left",
  bold: false,
  italic: false,
});

const alignMap: Record<Align, typeof AlignmentType[keyof typeof AlignmentType]> = {
  left: AlignmentType.LEFT,
  center: AlignmentType.CENTER,
  right: AlignmentType.RIGHT,
  justify: AlignmentType.JUSTIFIED,
};

const headingMap: Record<Exclude<HeadingKey, "none">, typeof HeadingLevel[keyof typeof HeadingLevel]> = {
  h1: HeadingLevel.HEADING_1,
  h2: HeadingLevel.HEADING_2,
  h3: HeadingLevel.HEADING_3,
};

export default function WordMaker() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [includeFooter, setIncludeFooter] = useState(true);
  const [includePageNumbers, setIncludePageNumbers] = useState(true);
  const [fontSize, setFontSize] = useState("22"); // half-points (=11pt)
  const [sections, setSections] = useState<Section[]>([mk()]);
  const [loading, setLoading] = useState(false);

  const update = (id: string, patch: Partial<Section>) => setSections((s) => s.map((x) => x.id === id ? { ...x, ...patch } : x));
  const add = () => setSections((s) => [...s, mk()]);
  const remove = (id: string) => setSections((s) => s.filter((x) => x.id !== id));
  const move = (id: string, dir: -1 | 1) => setSections((s) => {
    const i = s.findIndex((x) => x.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= s.length) return s;
    const out = [...s]; [out[i], out[j]] = [out[j], out[i]];
    return out;
  });

  async function createDoc() {
    if (!title && sections.every((s) => !s.heading && !s.body)) {
      toast.error("Add a title or some content first.");
      return;
    }
    setLoading(true);
    try {
      const children: Paragraph[] = [];
      const size = Math.max(14, Math.min(60, parseInt(fontSize) || 22));

      if (title) {
        children.push(new Paragraph({
          text: title,
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
        }));
      }
      if (author) {
        children.push(new Paragraph({
          children: [new TextRun({ text: `By ${author}`, italics: true, color: "666666", size: 22 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
        }));
      }

      for (const sec of sections) {
        if (sec.heading) {
          children.push(new Paragraph({
            text: sec.heading,
            alignment: alignMap[sec.align],
            spacing: { before: 320, after: 160 },
            ...(sec.headingLevel !== "none" ? { heading: headingMap[sec.headingLevel] } : {}),
          }));
        }
        if (sec.body) {
          const lines = sec.body.split("\n").filter((l) => sec.bodyKind === "paragraph" || l.trim());
          for (const line of lines) {
            const run = new TextRun({
              text: line,
              size,
              bold: sec.bold || undefined,
              italics: sec.italic || undefined,
            });
            children.push(new Paragraph({
              children: [run],
              alignment: alignMap[sec.align],
              spacing: { after: 140 },
              ...(sec.bodyKind === "bullets" ? { bullet: { level: 0 } } : {}),
              ...(sec.bodyKind === "numbered" ? { numbering: { reference: "wm-numbered", level: 0 } } : {}),
            }));
          }
        }
      }

      const footerChildren: Paragraph[] = [];
      if (includeFooter || includePageNumbers) {
        const runs: TextRun[] = [];
        if (includeFooter && (title || author)) {
          runs.push(new TextRun({
            text: `${title || "Document"}${author ? ` — ${author}` : ""}    `,
            color: "888888",
            size: 18,
          }));
        }
        if (includePageNumbers) {
          runs.push(new TextRun({ children: ["Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES], color: "888888", size: 18 }));
        }
        footerChildren.push(new Paragraph({ children: runs, alignment: AlignmentType.CENTER }));
      }

      const doc = new Document({
        creator: author || "TREO TOOL'S",
        title: title || "Document",
        numbering: {
          config: [
            {
              reference: "wm-numbered",
              levels: [
                {
                  level: 0,
                  format: NumberFormat.DECIMAL,
                  text: "%1.",
                  alignment: AlignmentType.START,
                },
              ],
            },
          ],
        },
        sections: [{
          children,
          footers: footerChildren.length
            ? { default: new Footer({ children: footerChildren }) }
            : undefined,
        }],
      });

      const blob = await Packer.toBlob(doc);
      downloadBlob(blob, `${title || "document"}.docx`);
      toast.success("Word document created");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create document.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolLayout
      title="Word File Maker"
      description="Build a .docx with titled sections, headings (H1–H3), alignment, bullet/numbered lists, footer & page numbers"
      category="Document Tools"
      categoryHref="/"
      icon={<FileType2 className="w-6 h-6 text-green-700 dark:text-green-400" />}
      iconBg="bg-green-100 dark:bg-green-900/40"
    >
      <div className="bg-card border border-card-border rounded-xl p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="doc-title">Document title</Label>
            <Input id="doc-title" data-testid="input-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My Document" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="doc-author">Author (optional)</Label>
            <Input id="doc-author" data-testid="input-author" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="John Doe" className="mt-1" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs">Body size (half-pt)</Label>
            <Input type="number" min="14" max="60" value={fontSize} onChange={(e) => setFontSize(e.target.value)} className="mt-1" data-testid="font-size" />
            <p className="text-[10px] text-muted-foreground mt-1">22 ≈ 11pt</p>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer pb-2 self-end">
            <Checkbox checked={includeFooter} onCheckedChange={(v) => setIncludeFooter(!!v)} data-testid="opt-footer" />
            Footer line
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer pb-2 self-end">
            <Checkbox checked={includePageNumbers} onCheckedChange={(v) => setIncludePageNumbers(!!v)} data-testid="opt-page-numbers" />
            Page numbers
          </label>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Sections</Label>
            <Button variant="outline" size="sm" onClick={add} data-testid="add-section-btn">
              <Plus className="w-3.5 h-3.5 mr-1" />Add section
            </Button>
          </div>

          {sections.map((sec, i) => (
            <div key={sec.id} data-testid={`section-${i}`} className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                <p className="text-xs font-semibold text-muted-foreground">Section {i + 1}</p>
                <div className="ml-auto flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => move(sec.id, -1)} disabled={i === 0}><ArrowUp className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => move(sec.id, 1)} disabled={i === sections.length - 1}><ArrowDown className="w-3.5 h-3.5" /></Button>
                  {sections.length > 1 && (
                    <button onClick={() => remove(sec.id)} className="text-muted-foreground hover:text-destructive p-1" data-testid={`remove-section-${i}`}><X className="w-4 h-4" /></button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <Label className="text-xs">Heading (optional)</Label>
                  <Input value={sec.heading} onChange={(e) => update(sec.id, { heading: e.target.value })} placeholder="Section heading" data-testid={`heading-${i}`} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Heading style</Label>
                  <Select value={sec.headingLevel} onValueChange={(v) => update(sec.id, { headingLevel: v as HeadingKey })}>
                    <SelectTrigger className="mt-1" data-testid={`hlevel-${i}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="h1">Heading 1</SelectItem>
                      <SelectItem value="h2">Heading 2</SelectItem>
                      <SelectItem value="h3">Heading 3</SelectItem>
                      <SelectItem value="none">Plain bold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <Label className="text-xs">Body style</Label>
                  <Select value={sec.bodyKind} onValueChange={(v) => update(sec.id, { bodyKind: v as BodyKind })}>
                    <SelectTrigger className="mt-1" data-testid={`bkind-${i}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paragraph">Paragraph</SelectItem>
                      <SelectItem value="bullets">Bullet list</SelectItem>
                      <SelectItem value="numbered">Numbered list</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Align</Label>
                  <Select value={sec.align} onValueChange={(v) => update(sec.id, { align: v as Align })}>
                    <SelectTrigger className="mt-1" data-testid={`align-${i}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                      <SelectItem value="justify">Justify</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <label className="flex items-end gap-2 pb-2 text-sm cursor-pointer">
                  <Checkbox checked={sec.bold} onCheckedChange={(v) => update(sec.id, { bold: !!v })} />
                  <span className="font-bold">Bold</span>
                </label>
                <label className="flex items-end gap-2 pb-2 text-sm cursor-pointer">
                  <Checkbox checked={sec.italic} onCheckedChange={(v) => update(sec.id, { italic: !!v })} />
                  <span className="italic">Italic</span>
                </label>
              </div>

              <div>
                <Label className="text-xs">Content {sec.bodyKind !== "paragraph" && "(one item per line)"}</Label>
                <Textarea value={sec.body} onChange={(e) => update(sec.id, { body: e.target.value })} placeholder={sec.bodyKind === "paragraph" ? "Write paragraphs here…" : "First item\nSecond item\nThird item"} rows={4} data-testid={`body-${i}`} className="mt-1 text-sm" />
              </div>
            </div>
          ))}
        </div>

        <Button onClick={createDoc} disabled={loading} className="w-full" data-testid="create-doc-btn">
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating…</> : <><Download className="w-4 h-4 mr-2" />Create & Download .docx</>}
        </Button>
      </div>
    </ToolLayout>
  );
}
