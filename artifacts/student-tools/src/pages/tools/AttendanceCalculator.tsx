import { useState, useMemo } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { Input } from "@/components/ui/input";
import { CalendarCheck, TrendingDown, TrendingUp } from "lucide-react";

export default function AttendanceCalculator() {
  const [attended, setAttended] = useState("45");
  const [total, setTotal] = useState("60");
  const [target, setTarget] = useState("75");

  const result = useMemo(() => {
    const a = parseInt(attended, 10);
    const t = parseInt(total, 10);
    const goal = parseFloat(target);
    if (isNaN(a) || isNaN(t) || isNaN(goal) || t <= 0 || a < 0 || a > t || goal <= 0 || goal > 100) {
      return null;
    }
    const current = (a / t) * 100;
    const goalFrac = goal / 100;

    let canSkip = 0;
    if (current >= goal) {
      // x = (a - goal*t) / goal
      canSkip = Math.floor((a - goalFrac * t) / goalFrac);
      if (canSkip < 0) canSkip = 0;
    }

    let mustAttend = 0;
    if (current < goal) {
      // need x: (a + x) / (t + x) >= goal/100
      // a + x >= goalFrac*(t + x)
      // a + x - goalFrac*x >= goalFrac*t
      // x(1 - goalFrac) >= goalFrac*t - a
      // x >= (goalFrac*t - a) / (1 - goalFrac)
      mustAttend = Math.ceil((goalFrac * t - a) / (1 - goalFrac));
      if (mustAttend < 0) mustAttend = 0;
    }

    return { current, canSkip, mustAttend, atGoal: current >= goal };
  }, [attended, total, target]);

  return (
    <ToolLayout
      title="Attendance Calculator (India)"
      description="Find your attendance % and how many classes you can bunk or must attend to stay above 75%"
      category="Utilities"
      categoryHref="/?cat=Utilities"
      icon={<CalendarCheck className="w-6 h-6" />}
      iconBg="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <label className="text-sm font-medium text-foreground mb-2 block">Classes Attended</label>
          <Input
            type="number"
            min="0"
            value={attended}
            onChange={(e) => setAttended(e.target.value)}
          />
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <label className="text-sm font-medium text-foreground mb-2 block">Total Classes Held</label>
          <Input
            type="number"
            min="0"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
          />
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <label className="text-sm font-medium text-foreground mb-2 block">Required Attendance %</label>
          <Input
            type="number"
            min="1"
            max="100"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </div>
      </div>

      {result && (
        <>
          <div className="mt-6 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Current Attendance</p>
            <p className={`text-5xl font-bold mt-1 ${result.atGoal ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
              {result.current.toFixed(2)}%
            </p>
            <div className="mt-3 h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${result.atGoal ? "bg-emerald-500" : "bg-red-500"}`}
                style={{ width: `${Math.min(100, result.current)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Target: {target}% — you are {result.atGoal ? "above" : "below"} the required attendance.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {result.atGoal ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 sm:col-span-2">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <TrendingUp className="w-5 h-5" />
                  <p className="font-semibold">You can safely skip</p>
                </div>
                <p className="text-3xl font-bold text-foreground mt-2">{result.canSkip} {result.canSkip === 1 ? "class" : "classes"}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  …and still stay above {target}% attendance.
                </p>
              </div>
            ) : (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 sm:col-span-2">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <TrendingDown className="w-5 h-5" />
                  <p className="font-semibold">You must attend</p>
                </div>
                <p className="text-3xl font-bold text-foreground mt-2">{result.mustAttend} more {result.mustAttend === 1 ? "class" : "classes"} in a row</p>
                <p className="text-xs text-muted-foreground mt-2">
                  …without missing any, to reach {target}%.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      <div className="mt-8 bg-muted/30 border border-border rounded-lg p-4 text-sm">
        <h3 className="font-semibold text-foreground mb-2">How it works</h3>
        <p className="text-muted-foreground">
          Most Indian colleges and universities require <strong>75% minimum attendance</strong> to sit for end-semester exams. Some institutions require 80% or 85%. Enter your numbers above to know exactly where you stand and what you need to do.
        </p>
      </div>
    </ToolLayout>
  );
}
