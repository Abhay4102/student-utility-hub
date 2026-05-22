import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { ArrowRightLeft, RefreshCw, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type RatesPayload = { base: string; date: string; rates: Record<string, number>; fetchedAt: number };

const CACHE_KEY = "treo-calc-currency-cache";
const CACHE_TTL_MS = 60 * 60 * 1000;

const currencyNames: Record<string, string> = {
  USD: "US Dollar", EUR: "Euro", GBP: "British Pound", JPY: "Japanese Yen", INR: "Indian Rupee",
  AUD: "Australian Dollar", CAD: "Canadian Dollar", CHF: "Swiss Franc", CNY: "Chinese Yuan",
  HKD: "Hong Kong Dollar", NZD: "New Zealand Dollar", SEK: "Swedish Krona", KRW: "South Korean Won",
  SGD: "Singapore Dollar", NOK: "Norwegian Krone", MXN: "Mexican Peso", BRL: "Brazilian Real",
  ZAR: "South African Rand", TRY: "Turkish Lira", RUB: "Russian Ruble", AED: "UAE Dirham",
  SAR: "Saudi Riyal", PHP: "Philippine Peso", THB: "Thai Baht", IDR: "Indonesian Rupiah",
  MYR: "Malaysian Ringgit", PLN: "Polish Złoty", DKK: "Danish Krone", CZK: "Czech Koruna",
  HUF: "Hungarian Forint", ILS: "Israeli Shekel", BGN: "Bulgarian Lev", RON: "Romanian Leu",
  ISK: "Icelandic Króna",
};

const flag: Record<string, string> = {
  USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧", JPY: "🇯🇵", INR: "🇮🇳", AUD: "🇦🇺", CAD: "🇨🇦",
  CHF: "🇨🇭", CNY: "🇨🇳", HKD: "🇭🇰", NZD: "🇳🇿", SEK: "🇸🇪", KRW: "🇰🇷", SGD: "🇸🇬",
  NOK: "🇳🇴", MXN: "🇲🇽", BRL: "🇧🇷", ZAR: "🇿🇦", TRY: "🇹🇷", RUB: "🇷🇺", AED: "🇦🇪",
  SAR: "🇸🇦", PHP: "🇵🇭", THB: "🇹🇭", IDR: "🇮🇩", MYR: "🇲🇾", PLN: "🇵🇱", DKK: "🇩🇰",
  CZK: "🇨🇿", HUF: "🇭🇺", ILS: "🇮🇱", BGN: "🇧🇬", RON: "🇷🇴", ISK: "🇮🇸",
};

async function fetchRates(base: string): Promise<RatesPayload> {
  const res = await fetch(`https://api.frankfurter.dev/v1/latest?base=${base}`);
  if (!res.ok) throw new Error(`Failed to fetch rates (${res.status})`);
  const data = await res.json();
  return { base: data.base, date: data.date, rates: { ...data.rates, [data.base]: 1 }, fetchedAt: Date.now() };
}

function loadCache(base: string): RatesPayload | null {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY}-${base}`);
    if (!raw) return null;
    const data: RatesPayload = JSON.parse(raw);
    return data;
  } catch {
    return null;
  }
}

function saveCache(base: string, data: RatesPayload) {
  try {
    localStorage.setItem(`${CACHE_KEY}-${base}`, JSON.stringify(data));
  } catch {
    // ignore
  }
}

const quickPairs: Array<[string, string]> = [
  ["USD", "EUR"], ["USD", "INR"], ["USD", "GBP"], ["EUR", "USD"], ["USD", "JPY"], ["GBP", "INR"],
];

export default function CurrencyPanel() {
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");
  const [amount, setAmount] = useState("1");
  const [data, setData] = useState<RatesPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const reqIdRef = useRef(0);

  const load = useCallback(async (baseCode: string, force = false) => {
    const myReq = ++reqIdRef.current;
    const cached = loadCache(baseCode);
    if (cached && !force && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      if (reqIdRef.current !== myReq) return;
      setData(cached);
      setStale(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fresh = await fetchRates(baseCode);
      saveCache(baseCode, fresh);
      if (reqIdRef.current !== myReq) return;
      setData(fresh);
      setStale(false);
    } catch (e) {
      if (reqIdRef.current !== myReq) return;
      if (cached) {
        setData(cached);
        setStale(true);
        setError("Couldn't reach live rates — showing last cached values.");
      } else {
        setError(e instanceof Error ? e.message : "Failed to fetch rates");
      }
    } finally {
      if (reqIdRef.current === myReq) setLoading(false);
    }
  }, []);

  useEffect(() => { load(from); }, [from, load]);

  const converted = useMemo(() => {
    if (!data) return null;
    const n = parseFloat(amount);
    if (isNaN(n)) return null;
    const rate = data.rates[to];
    if (!rate) return null;
    return n * rate;
  }, [amount, data, to]);

  const rate = data?.rates[to];

  const swap = () => { setFrom(to); setTo(from); };

  const currencies = data
    ? Object.keys(data.rates).sort()
    : Object.keys(currencyNames).sort();

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: n < 1 ? 6 : 4 });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-card border border-card-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Currency Converter</h3>
          <button
            data-testid="refresh-rates"
            onClick={() => load(from, true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 text-xs p-3 rounded-lg mb-4">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Amount</label>
            <Input
              data-testid="amount-input"
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-2xl font-semibold h-14"
            />
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">From</label>
              <Select value={from} onValueChange={setFrom}>
                <SelectTrigger data-testid="from-select" className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {currencies.map((c) => (
                    <SelectItem key={c} value={c}>
                      {flag[c] || "💱"} {c} — {currencyNames[c] || c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <button
              data-testid="swap-currencies"
              onClick={swap}
              className="h-12 w-12 rounded-xl bg-muted hover:bg-muted/70 flex items-center justify-center transition-colors"
              aria-label="Swap currencies"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">To</label>
              <Select value={to} onValueChange={setTo}>
                <SelectTrigger data-testid="to-select" className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {currencies.map((c) => (
                    <SelectItem key={c} value={c}>
                      {flag[c] || "💱"} {c} — {currencyNames[c] || c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-5 mt-2">
            <p className="text-xs text-muted-foreground mb-1">
              {fmt(parseFloat(amount) || 0)} {from} =
            </p>
            <p data-testid="converted-result" className="text-3xl font-bold text-foreground font-mono break-all">
              {converted !== null ? fmt(converted) : "—"} <span className="text-base font-semibold text-muted-foreground">{to}</span>
            </p>
            {rate && (
              <p className="text-xs text-muted-foreground mt-2">
                1 {from} = {fmt(rate)} {to} · 1 {to} = {fmt(1 / rate)} {from}
              </p>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Quick pairs</p>
            <div className="flex flex-wrap gap-2">
              {quickPairs.map(([f, t]) => (
                <button
                  key={`${f}-${t}`}
                  data-testid={`quick-${f}-${t}`}
                  onClick={() => { setFrom(f); setTo(t); }}
                  className="text-xs px-3 py-1.5 rounded-full bg-muted text-foreground hover:bg-muted/70 transition-colors font-medium"
                >
                  {flag[f]} {f} → {flag[t]} {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-2xl p-4 shadow-sm">
        <h3 className="font-semibold text-sm text-foreground mb-3">Live rates for 1 {from}</h3>
        {data ? (
          <>
            <p className="text-xs text-muted-foreground mb-3">
              {stale ? "Cached " : "Updated "}
              {new Date(data.fetchedAt).toLocaleString()} · ECB date {data.date}
            </p>
            <div className="space-y-1 max-h-[480px] overflow-y-auto text-sm font-mono">
              {Object.entries(data.rates)
                .filter(([c]) => c !== from)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([code, r]) => (
                  <button
                    key={code}
                    onClick={() => setTo(code)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-muted transition-colors ${code === to ? "bg-primary/10" : ""}`}
                  >
                    <span className="text-foreground">{flag[code] || "💱"} {code}</span>
                    <span className="text-muted-foreground">{fmt(r)}</span>
                  </button>
                ))}
            </div>
          </>
        ) : loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Loading rates...</p>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No rate data available</p>
        )}
        <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
          Rates by frankfurter.dev (European Central Bank). Updated each business day.
        </p>
      </div>
    </div>
  );
}
