import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { ToolLayout } from "@/components/ToolLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  QrCode, Download, Link as LinkIcon, Type, Wifi, User, Mail,
  MessageSquare, Phone, Copy, Check,
} from "lucide-react";
import { toast } from "sonner";

type QrType = "url" | "text" | "wifi" | "vcard" | "email" | "sms" | "phone";
type Ecc = "L" | "M" | "Q" | "H";

interface TypeMeta {
  label: string;
  icon: typeof QrCode;
  hint: string;
}

const TYPES: Record<QrType, TypeMeta> = {
  url: { label: "Website / URL", icon: LinkIcon, hint: "Open a link instantly when scanned" },
  text: { label: "Plain Text", icon: Type, hint: "Any text — notes, ID, code, etc." },
  wifi: { label: "Wi-Fi", icon: Wifi, hint: "Connect to Wi-Fi with one scan" },
  vcard: { label: "Contact (vCard)", icon: User, hint: "Save contact details to phone" },
  email: { label: "Email", icon: Mail, hint: "Pre-fill an email" },
  sms: { label: "SMS", icon: MessageSquare, hint: "Pre-fill a text message" },
  phone: { label: "Phone", icon: Phone, hint: "Call a number on scan" },
};

function escapeWifi(s: string): string {
  return s.replace(/([\\;,"':])/g, "\\$1");
}

export default function QrGenerator() {
  const [type, setType] = useState<QrType>("url");
  const [url, setUrl] = useState("https://treotools.in");
  const [text, setText] = useState("");

  // Wi-Fi
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [encryption, setEncryption] = useState<"WPA" | "WEP" | "nopass">("WPA");
  const [hidden, setHidden] = useState(false);

  // vCard
  const [vcName, setVcName] = useState("");
  const [vcPhone, setVcPhone] = useState("");
  const [vcEmail, setVcEmail] = useState("");
  const [vcOrg, setVcOrg] = useState("");
  const [vcUrl, setVcUrl] = useState("");

  // Email
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // SMS
  const [smsPhone, setSmsPhone] = useState("");
  const [smsMessage, setSmsMessage] = useState("");

  // Phone
  const [callPhone, setCallPhone] = useState("");

  // Styling
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [size, setSize] = useState(512);
  const [margin, setMargin] = useState(2);
  const [ecc, setEcc] = useState<Ecc>("M");
  const [copied, setCopied] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const payload = useMemo(() => {
    switch (type) {
      case "url": return url.trim();
      case "text": return text;
      case "wifi": {
        if (!ssid.trim()) return "";
        const enc = encryption === "nopass" ? "nopass" : encryption;
        const pwPart = encryption === "nopass" ? "" : `P:${escapeWifi(password)};`;
        return `WIFI:T:${enc};S:${escapeWifi(ssid)};${pwPart}${hidden ? "H:true;" : ""};`;
      }
      case "vcard": {
        if (!vcName.trim()) return "";
        const lines = ["BEGIN:VCARD", "VERSION:3.0", `FN:${vcName}`];
        if (vcOrg) lines.push(`ORG:${vcOrg}`);
        if (vcPhone) lines.push(`TEL;TYPE=CELL:${vcPhone}`);
        if (vcEmail) lines.push(`EMAIL:${vcEmail}`);
        if (vcUrl) lines.push(`URL:${vcUrl}`);
        lines.push("END:VCARD");
        return lines.join("\n");
      }
      case "email": {
        if (!emailTo.trim()) return "";
        const params = [];
        if (emailSubject) params.push(`subject=${encodeURIComponent(emailSubject)}`);
        if (emailBody) params.push(`body=${encodeURIComponent(emailBody)}`);
        return `mailto:${emailTo}${params.length ? "?" + params.join("&") : ""}`;
      }
      case "sms": {
        if (!smsPhone.trim()) return "";
        return `SMSTO:${smsPhone}:${smsMessage}`;
      }
      case "phone": return callPhone.trim() ? `tel:${callPhone.trim()}` : "";
    }
  }, [type, url, text, ssid, password, encryption, hidden, vcName, vcPhone, vcEmail, vcOrg, vcUrl, emailTo, emailSubject, emailBody, smsPhone, smsMessage, callPhone]);

  const isReady = payload.length > 0;

  // Render to canvas on every relevant change.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!isReady) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = size; canvas.height = size;
        ctx.fillStyle = bgColor; ctx.fillRect(0, 0, size, size);
      }
      return;
    }
    QRCode.toCanvas(canvas, payload, {
      width: size,
      margin,
      errorCorrectionLevel: ecc,
      color: { dark: fgColor, light: bgColor },
    }).catch(() => { /* invalid */ });
  }, [payload, isReady, size, margin, ecc, fgColor, bgColor]);

  const downloadPng = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isReady) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `qrcode-${type}-${Date.now()}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 500);
    }, "image/png");
    toast.success("PNG downloaded");
  }, [isReady, type]);

  const downloadSvg = useCallback(async () => {
    if (!isReady) return;
    const svg = await QRCode.toString(payload, {
      type: "svg",
      margin,
      errorCorrectionLevel: ecc,
      color: { dark: fgColor, light: bgColor },
    });
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `qrcode-${type}-${Date.now()}.svg`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 500);
    toast.success("SVG downloaded");
  }, [isReady, payload, margin, ecc, fgColor, bgColor, type]);

  const copyPayload = useCallback(async () => {
    if (!isReady) return;
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      toast.success("Copied raw QR content");
    } catch { toast.error("Copy failed"); }
  }, [isReady, payload]);

  return (
    <ToolLayout
      title="QR Code Generator"
      description="Generate beautiful QR codes for URLs, Wi-Fi, contacts, email and more — fully customizable, no watermark."
      category="Utilities"
      categoryHref="/?category=Utilities"
      icon={<QrCode className="w-5 h-5" />}
      iconBg="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
    >
      <div className="grid lg:grid-cols-2 gap-6">
        {/* LEFT: Type + Inputs */}
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">QR Type</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(TYPES) as QrType[]).map((t) => {
                const Icon = TYPES[t].icon;
                return (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                      type === t
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-card-border hover:border-primary/30 text-foreground"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{TYPES[t].label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">{TYPES[type].hint}</p>
          </div>

          <div className="rounded-xl border border-card-border bg-card p-4 space-y-3">
            {type === "url" && (
              <div>
                <Label>URL</Label>
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" />
              </div>
            )}
            {type === "text" && (
              <div>
                <Label>Text</Label>
                <Textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="Anything you want to encode…" />
              </div>
            )}
            {type === "wifi" && (
              <>
                <div><Label>Network name (SSID)</Label><Input value={ssid} onChange={(e) => setSsid(e.target.value)} placeholder="My Wi-Fi" /></div>
                <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={encryption === "nopass" ? "(no password)" : "••••••••"} disabled={encryption === "nopass"} /></div>
                <div>
                  <Label>Encryption</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {(["WPA", "WEP", "nopass"] as const).map((e) => (
                      <button key={e} onClick={() => setEncryption(e)} className={`p-2 rounded-lg border text-sm ${encryption === e ? "border-primary bg-primary/10 text-primary" : "border-card-border"}`}>
                        {e === "nopass" ? "Open" : e}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} /> Hidden network</label>
              </>
            )}
            {type === "vcard" && (
              <>
                <div><Label>Full Name *</Label><Input value={vcName} onChange={(e) => setVcName(e.target.value)} /></div>
                <div><Label>Phone</Label><Input value={vcPhone} onChange={(e) => setVcPhone(e.target.value)} placeholder="+91 9876543210" /></div>
                <div><Label>Email</Label><Input type="email" value={vcEmail} onChange={(e) => setVcEmail(e.target.value)} /></div>
                <div><Label>Organization</Label><Input value={vcOrg} onChange={(e) => setVcOrg(e.target.value)} /></div>
                <div><Label>Website</Label><Input value={vcUrl} onChange={(e) => setVcUrl(e.target.value)} /></div>
              </>
            )}
            {type === "email" && (
              <>
                <div><Label>To *</Label><Input type="email" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} placeholder="name@example.com" /></div>
                <div><Label>Subject</Label><Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} /></div>
                <div><Label>Message</Label><Textarea rows={3} value={emailBody} onChange={(e) => setEmailBody(e.target.value)} /></div>
              </>
            )}
            {type === "sms" && (
              <>
                <div><Label>Phone *</Label><Input value={smsPhone} onChange={(e) => setSmsPhone(e.target.value)} placeholder="+91 9876543210" /></div>
                <div><Label>Message</Label><Textarea rows={3} value={smsMessage} onChange={(e) => setSmsMessage(e.target.value)} /></div>
              </>
            )}
            {type === "phone" && (
              <div><Label>Phone *</Label><Input value={callPhone} onChange={(e) => setCallPhone(e.target.value)} placeholder="+91 9876543210" /></div>
            )}
          </div>

          {/* Style */}
          <div className="rounded-xl border border-card-border bg-card p-4 space-y-3">
            <Label className="font-semibold">Style</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Foreground</Label>
                <div className="flex gap-2 mt-1">
                  <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="h-10 w-12 rounded border border-card-border cursor-pointer" />
                  <Input value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="flex-1 font-mono text-xs" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Background</Label>
                <div className="flex gap-2 mt-1">
                  <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-10 w-12 rounded border border-card-border cursor-pointer" />
                  <Input value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="flex-1 font-mono text-xs" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Size (px)</Label>
                <Input type="number" min={128} max={2048} step={64} value={size} onChange={(e) => setSize(Math.max(128, Math.min(2048, Number(e.target.value) || 512)))} />
              </div>
              <div>
                <Label className="text-xs">Margin</Label>
                <Input type="number" min={0} max={10} value={margin} onChange={(e) => setMargin(Math.max(0, Math.min(10, Number(e.target.value) || 2)))} />
              </div>
              <div>
                <Label className="text-xs">Quality</Label>
                <select value={ecc} onChange={(e) => setEcc(e.target.value as Ecc)} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  <option value="L">L (7%)</option>
                  <option value="M">M (15%)</option>
                  <option value="Q">Q (25%)</option>
                  <option value="H">H (30%)</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Higher quality = more error correction (good for printed/damaged QR).</p>
          </div>
        </div>

        {/* RIGHT: Preview + Actions */}
        <div className="space-y-4">
          <div className="rounded-xl border border-card-border bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-6 flex flex-col items-center sticky top-4">
            <Label className="font-semibold mb-3">Live Preview</Label>
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <canvas ref={canvasRef} className="block max-w-full h-auto" style={{ width: 280, height: 280 }} />
            </div>
            {!isReady && <p className="text-sm text-muted-foreground mt-3">Fill the required field to generate a QR.</p>}
            <div className="grid grid-cols-2 gap-2 w-full mt-4">
              <Button onClick={downloadPng} disabled={!isReady}><Download className="w-4 h-4 mr-2" /> PNG</Button>
              <Button onClick={downloadSvg} disabled={!isReady} variant="outline"><Download className="w-4 h-4 mr-2" /> SVG</Button>
            </div>
            <Button onClick={copyPayload} disabled={!isReady} variant="ghost" size="sm" className="mt-2">
              {copied ? <Check className="w-4 h-4 mr-2 text-emerald-500" /> : <Copy className="w-4 h-4 mr-2" />}
              Copy raw content
            </Button>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
