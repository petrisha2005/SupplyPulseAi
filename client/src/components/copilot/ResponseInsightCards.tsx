import { AlertTriangle, ArrowUpRight, BarChart3, CircleHelp, ClipboardCheck, FileSearch, Zap } from "lucide-react";

type InsightKind = "risk" | "problem" | "impact" | "evidence" | "action" | "recommendation" | "summary";

interface InsightSection {
  kind: InsightKind;
  label: string;
  content: string[];
}

const sectionDefinitions: Array<{ kind: InsightKind; label: string; aliases: string[] }> = [
  { kind: "risk", label: "Risk summary", aliases: ["risk summary", "risk overview", "risk"] },
  { kind: "problem", label: "Problem", aliases: ["problem", "situation"] },
  { kind: "impact", label: "Business impact", aliases: ["impact", "business impact"] },
  { kind: "evidence", label: "Evidence", aliases: ["evidence", "signals", "supporting evidence"] },
  { kind: "action", label: "Recommended action", aliases: ["action", "recommended action", "immediate action", "next steps"] },
  { kind: "recommendation", label: "Recommendation", aliases: ["recommendation", "recommended next step"] }
];

const normalizeHeading = (value: string) => value
  .replace(/^\s*(?:[-•*]\s*)?/, "")
  .replace(/[*_`#]/g, "")
  .replace(/:$/, "")
  .trim()
  .toLowerCase();

const findSection = (line: string) => {
  const normalized = normalizeHeading(line);
  return sectionDefinitions.find((section) => section.aliases.includes(normalized));
};

const cleanLine = (line: string) => line.replace(/^\s*(?:[-•*]\s*)/, "").trim();

export const parseExecutiveInsight = (answer: string): InsightSection[] => {
  const sections: InsightSection[] = [];
  let active: InsightSection | undefined;

  for (const rawLine of answer.replace(/\r/g, "").split("\n")) {
    const inlineMatch = rawLine.replace(/[*_`#]/g, "").trim().match(/^(.+?)\s*:\s*(.+)$/);
    const inlineSection = inlineMatch && sectionDefinitions.find((section) => section.aliases.includes(normalizeHeading(inlineMatch[1])));
    if (inlineSection && inlineMatch) {
      active = { kind: inlineSection.kind, label: inlineSection.label, content: [cleanLine(inlineMatch[2])] };
      sections.push(active);
      continue;
    }

    const section = findSection(rawLine);
    if (section) {
      active = { kind: section.kind, label: section.label, content: [] };
      sections.push(active);
      continue;
    }

    const content = cleanLine(rawLine);
    if (content) {
      if (!active) {
        active = { kind: "summary", label: "Executive readout", content: [] };
        sections.push(active);
      }
      active.content.push(content);
    }
  }

  const populated = sections.filter((section) => section.content.length);
  return populated.length ? populated : [{ kind: "summary", label: "Executive readout", content: [answer] }];
};

const presentation: Record<InsightKind, { icon: typeof AlertTriangle; className: string }> = {
  risk: { icon: AlertTriangle, className: "border-red-200 bg-red-50/70 text-red-950 dark:border-red-900 dark:bg-red-950/25 dark:text-red-100" },
  problem: { icon: CircleHelp, className: "border-orange-200 bg-orange-50/70 text-orange-950 dark:border-orange-900 dark:bg-orange-950/25 dark:text-orange-100" },
  impact: { icon: BarChart3, className: "border-violet-200 bg-violet-50/70 text-violet-950 dark:border-violet-900 dark:bg-violet-950/25 dark:text-violet-100" },
  evidence: { icon: FileSearch, className: "border-slate-200 bg-slate-50/90 text-slate-800 dark:border-slate-700 dark:bg-slate-950/45 dark:text-slate-100" },
  action: { icon: Zap, className: "border-teal-200 bg-teal-50/80 text-teal-950 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-100" },
  recommendation: { icon: ArrowUpRight, className: "border-teal-200 bg-teal-50/80 text-teal-950 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-100" },
  summary: { icon: ClipboardCheck, className: "border-slate-200 bg-white/80 text-slate-800 dark:border-slate-700 dark:bg-slate-950/45 dark:text-slate-100" }
};

export function ResponseInsightCards({ answer }: { answer: string }) {
  const sections = parseExecutiveInsight(answer);
  return (
    <section className="mt-4 grid gap-3 md:grid-cols-2">
      {sections.map((section, index) => {
        const style = presentation[section.kind];
        const Icon = style.icon;
        const prominent = section.kind === "risk" || section.kind === "action" || section.kind === "recommendation";
        return (
          <article key={`${section.kind}-${index}`} className={`rounded-2xl border p-4 shadow-sm ${style.className} ${sections.length === 1 ? "md:col-span-2" : ""}`}>
            <div className="flex items-center gap-2"><Icon size={16} className="shrink-0" /><p className="text-[0.68rem] font-black uppercase tracking-[0.12em]">{section.label}</p></div>
            <div className={`mt-3 space-y-2 text-sm leading-6 ${prominent ? "font-bold" : "font-medium"}`}>
              {section.kind === "evidence"
                ? <ul className="space-y-1.5">{section.content.map((item) => <li key={item} className="flex gap-2"><span className="font-black">•</span><span>{item}</span></li>)}</ul>
                : section.content.map((item) => <p key={item}>{item}</p>)}
            </div>
          </article>
        );
      })}
    </section>
  );
}
