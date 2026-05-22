import { useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { Calculator as CalcIcon, Binary, Banknote, CalendarDays, FlaskConical } from "lucide-react";
import ScientificPanel from "./calculator/ScientificPanel";
import ProgrammerPanel from "./calculator/ProgrammerPanel";
import CurrencyPanel from "./calculator/CurrencyPanel";
import DatePanel from "./calculator/DatePanel";

type Mode = "scientific" | "programmer" | "currency" | "date";

const tabs: Array<{ id: Mode; label: string; icon: typeof CalcIcon }> = [
  { id: "scientific", label: "Scientific", icon: FlaskConical },
  { id: "programmer", label: "Programmer", icon: Binary },
  { id: "currency", label: "Currency", icon: Banknote },
  { id: "date", label: "Date", icon: CalendarDays },
];

export default function Calculator() {
  const [mode, setMode] = useState<Mode>("scientific");

  return (
    <ToolLayout
      title="Calculator"
      description="Scientific, programmer, currency and date calculator — everything in one place"
      category="Utilities"
      categoryHref="/"
      icon={<CalcIcon className="w-6 h-6 text-amber-700 dark:text-amber-400" />}
      iconBg="bg-amber-100 dark:bg-amber-900/40"
    >
      <div className="flex items-center gap-1 mb-6 bg-muted/50 p-1 rounded-xl w-fit overflow-x-auto max-w-full">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = mode === t.id;
          return (
            <button
              key={t.id}
              data-testid={`tab-${t.id}`}
              onClick={() => setMode(t.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {mode === "scientific" && <ScientificPanel />}
      {mode === "programmer" && <ProgrammerPanel />}
      {mode === "currency" && <CurrencyPanel />}
      {mode === "date" && <DatePanel />}
    </ToolLayout>
  );
}
