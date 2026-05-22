import { useState } from "react";
import { Mail, Copy, Check } from "lucide-react";
import { InfoPageLayout } from "@/components/InfoPageLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const CONTACT_EMAIL = "support@treotools.app";

export default function Contact() {
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      toast.success("Email copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — please copy manually");
    }
  };

  const openMailClient = () => {
    const body = `${message}\n\n—\n${name || "A TREO TOOL'S user"}`;
    const href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject || "Hello TREO TOOL'S")}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
  };

  return (
    <InfoPageLayout
      title="Contact us"
      subtitle="Questions, feedback, bug reports, or partnership ideas — we'd love to hear from you."
    >
      <section className="rounded-2xl border border-card-border bg-card p-5">
        <p className="text-foreground font-medium mb-1">Email</p>
        <div className="flex items-center gap-2">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center gap-2 text-primary font-mono text-sm hover:underline break-all"
          >
            <Mail className="w-4 h-4 shrink-0" />
            {CONTACT_EMAIL}
          </a>
          <Button
            size="sm"
            variant="outline"
            onClick={copyEmail}
            className="ml-auto h-8 px-2 gap-1.5"
            data-testid="copy-email"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="text-xs">{copied ? "Copied" : "Copy"}</span>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          We aim to reply within 2–3 business days.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-2">Or write us a quick note</h2>
        <p className="text-xs text-muted-foreground mb-3">
          This form opens your email app pre-filled with what you typed — we don&apos;t store
          anything on this page.
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Your name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/60"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Feedback about the PDF Editor"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/60"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Tell us what's on your mind…"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/60 resize-y"
            />
          </div>
          <Button
            onClick={openMailClient}
            disabled={!message.trim()}
            className="w-full sm:w-auto"
            data-testid="send-email"
          >
            <Mail className="w-4 h-4 mr-2" />
            Open in email app
          </Button>
        </div>
      </section>

      <section className="text-xs text-muted-foreground">
        <p>
          For privacy questions please read our{" "}
          <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
          For usage rules, see our{" "}
          <a href="/terms" className="text-primary hover:underline">Terms of Service</a>.
        </p>
      </section>
    </InfoPageLayout>
  );
}
