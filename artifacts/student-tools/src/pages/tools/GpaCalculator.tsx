import { useState, useMemo } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from "@/components/ui/select";
import { GraduationCap, Plus, Trash2 } from "lucide-react";

interface Course {
  id: number;
  name: string;
  credits: string;
  grade: string;
}

const GRADE_POINTS_10: Record<string, number> = {
  "O / A+": 10,
  "A": 9,
  "B+": 8,
  "B": 7,
  "C+": 6,
  "C": 5,
  "D": 4,
  "F": 0,
};

const PERCENT_TO_GRADE_10: { min: number; grade: string; gp: number }[] = [
  { min: 90, grade: "O / A+", gp: 10 },
  { min: 80, grade: "A", gp: 9 },
  { min: 70, grade: "B+", gp: 8 },
  { min: 60, grade: "B", gp: 7 },
  { min: 55, grade: "C+", gp: 6 },
  { min: 50, grade: "C", gp: 5 },
  { min: 40, grade: "D", gp: 4 },
  { min: 0, grade: "F", gp: 0 },
];

export default function GpaCalculator() {
  const [mode, setMode] = useState<"cgpa" | "percent">("cgpa");
  const [courses, setCourses] = useState<Course[]>([
    { id: 1, name: "Subject 1", credits: "4", grade: "A" },
    { id: 2, name: "Subject 2", credits: "3", grade: "B+" },
    { id: 3, name: "Subject 3", credits: "3", grade: "O / A+" },
  ]);
  const [percentInput, setPercentInput] = useState("");

  const result = useMemo(() => {
    if (mode === "cgpa") {
      let totalPoints = 0;
      let totalCredits = 0;
      for (const c of courses) {
        const cr = parseFloat(c.credits);
        const gp = GRADE_POINTS_10[c.grade] ?? 0;
        if (!isNaN(cr) && cr > 0) {
          totalPoints += cr * gp;
          totalCredits += cr;
        }
      }
      if (totalCredits === 0) return null;
      const cgpa = totalPoints / totalCredits;
      const percent = cgpa * 9.5;
      return { cgpa, percent, totalCredits };
    } else {
      const p = parseFloat(percentInput);
      if (isNaN(p) || p < 0 || p > 100) return null;
      const cgpa = Math.min(10, p / 9.5);
      const tier = PERCENT_TO_GRADE_10.find((t) => p >= t.min) ?? PERCENT_TO_GRADE_10[PERCENT_TO_GRADE_10.length - 1];
      return { cgpa, percent: p, grade: tier.grade, gp: tier.gp };
    }
  }, [mode, courses, percentInput]);

  const addCourse = () => {
    const id = Math.max(0, ...courses.map((c) => c.id)) + 1;
    setCourses([...courses, { id, name: `Subject ${courses.length + 1}`, credits: "3", grade: "A" }]);
  };

  const removeCourse = (id: number) => setCourses(courses.filter((c) => c.id !== id));

  const updateCourse = (id: number, field: keyof Course, value: string) => {
    setCourses(courses.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  return (
    <ToolLayout
      title="GPA / CGPA Calculator (India)"
      description="Calculate CGPA, SGPA & percentage on India's 10-point grading scale"
      category="Utilities"
      categoryHref="/?cat=Utilities"
      icon={<GraduationCap className="w-6 h-6" />}
      iconBg="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
    >
      <div className="flex gap-2 mb-6">
        <Button variant={mode === "cgpa" ? "default" : "outline"} onClick={() => setMode("cgpa")} className="flex-1">
          Grade → CGPA
        </Button>
        <Button variant={mode === "percent" ? "default" : "outline"} onClick={() => setMode("percent")} className="flex-1">
          Percentage → CGPA
        </Button>
      </div>

      {mode === "cgpa" ? (
        <div className="space-y-3">
          <div className="space-y-2">
            {courses.map((c) => (
              <div key={c.id} className="grid grid-cols-12 gap-2 items-center bg-card border border-border rounded-lg p-3">
                <Input
                  className="col-span-5"
                  value={c.name}
                  onChange={(e) => updateCourse(c.id, "name", e.target.value)}
                  placeholder="Subject name"
                />
                <Input
                  className="col-span-2"
                  value={c.credits}
                  onChange={(e) => updateCourse(c.id, "credits", e.target.value)}
                  placeholder="Credits"
                  type="number"
                  min="0"
                  step="0.5"
                />
                <div className="col-span-4">
                  <Select value={c.grade} onValueChange={(v) => updateCourse(c.id, "grade", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(GRADE_POINTS_10).map(([g, gp]) => (
                        <SelectItem key={g} value={g}>{g} ({gp})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <button
                  onClick={() => removeCourse(c.id)}
                  className="col-span-1 flex justify-center text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={addCourse} className="w-full gap-2">
            <Plus className="w-4 h-4" /> Add Subject
          </Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg p-5">
          <label className="text-sm font-medium text-foreground mb-2 block">Your Percentage (%)</label>
          <Input
            type="number"
            min="0"
            max="100"
            placeholder="e.g. 85"
            value={percentInput}
            onChange={(e) => setPercentInput(e.target.value)}
          />
        </div>
      )}

      {result && (
        <div className="mt-6 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">CGPA (10-point)</p>
              <p className="text-3xl font-bold text-foreground mt-1">{result.cgpa.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Percentage</p>
              <p className="text-3xl font-bold text-foreground mt-1">{result.percent.toFixed(2)}%</p>
            </div>
            {"totalCredits" in result && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Credits</p>
                <p className="text-lg font-semibold text-foreground mt-1">{result.totalCredits}</p>
              </div>
            )}
            {"grade" in result && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Equivalent Grade</p>
                <p className="text-lg font-semibold text-foreground mt-1">{result.grade}</p>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Percentage formula (CBSE / most Indian universities): % = CGPA × 9.5
          </p>
        </div>
      )}

      <div className="mt-8 bg-muted/30 border border-border rounded-lg p-4 text-sm space-y-2">
        <h3 className="font-semibold text-foreground">India 10-point Grade Scale</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {Object.entries(GRADE_POINTS_10).map(([g, gp]) => (
            <div key={g} className="flex justify-between bg-card border border-border rounded px-2 py-1">
              <span className="text-muted-foreground">{g}</span>
              <span className="font-semibold text-foreground">{gp}</span>
            </div>
          ))}
        </div>
      </div>
    </ToolLayout>
  );
}
