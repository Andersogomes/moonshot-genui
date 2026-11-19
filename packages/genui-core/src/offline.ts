import type { AppBar, Block, Context, GeneratedBlock } from "./schema.ts";
import type { Dataset } from "./data.ts";
import { MONTHS } from "./data.ts";
import type { ScopedData } from "./scope.ts";

/**
 * Deterministic generator that applies the grammar's signal → component table
 * without a model. Used when ANTHROPIC_API_KEY isn't configured, in tests, and
 * as the acceptance baseline the Claude output is compared against.
 */
export function* offlineBlocks(s: ScopedData, question?: string): Generator<GeneratedBlock> {
  if (question) {
    yield* answer(s, question);
    return;
  }
  if (s.context === "leader") yield* leader(s);
  else yield* person(s);
}

const pct = (a: number, b: number) => Math.round(((a - b) / Math.max(1, Math.abs(b))) * 100);
const first = (name?: string) => name?.split(" ")[0] ?? "they";

function* person(s: ScopedData): Generator<GeneratedBlock> {
  const owner = s.context === "owner";
  const who = first(s.subject?.name);
  const clarity = s.feedback.filter((f) => f.theme === "clarity" && f.visibility === "public");
  const authors = new Set(clarity.map((f) => f.author_id)).size;
  const series = s.endorsements ?? [];
  const growth = series.length > 1 ? pct(series.at(-1)!, series[0]!) : 0;
  const peopleCount = new Set(s.feedback.map((f) => f.author_id)).size;
  // Words follow the number, never the other way round.
  const growthPhrase = growth >= 100 ? "more than doubled" : growth >= 80 ? "nearly doubled" : growth > 5 ? `rose ${growth}%` : growth < -5 ? `fell ${Math.abs(growth)}%` : "held steady";

  yield {
    type: "gen/insight/narrative",
    kicker: owner ? "Your story, updated today" : `${who}'s story`,
    headline: owner
      ? `You make ambiguity manageable. ${authors} colleagues said so this year, and your endorsements ${growthPhrase}.`
      : `${who} turns unclear goals into plans. ${authors} colleagues say so in public feedback.`,
    suggestions: owner ? ["What should I work on next?", "Who endorsed this?"] : [`What has ${who} shipped?`, `Who has ${who} worked with?`],
    confidence: authors >= 3 ? "High" : "Medium",
    provenance: { summary: `From ${s.entries.length + s.feedback.length} entries, ${peopleCount} people`, source_ids: [...s.entries.map((e) => e.id), ...s.feedback.map((f) => f.id)].slice(0, 12) },
  };

  const strongest = clarity[0];
  if (strongest) {
    const author = s.people.find((p) => p.id === strongest.author_id);
    yield {
      type: "gen/insight/evidence",
      quote: { text: strongest.text, author: author?.name ?? "A colleague", role: author?.role ?? "", source_id: strongest.id },
      why: `${clarity.length} of ${s.feedback.length} feedback notes describe the same strength: turning unclear goals into plans.`,
      confidence: clarity.length >= 3 ? "High" : "Medium",
      provenance: { summary: `From ${clarity.length} feedback notes`, source_ids: clarity.map((f) => f.id) },
    };
  }

  if (series.length >= 6 && Math.abs(growth) > 5) {
    const total = series.reduce((a, b) => a + b, 0);
    yield {
      type: "gen/insight/trend",
      title: owner ? `Your endorsements ${growthPhrase} this year` : `${who}'s endorsements ${growthPhrase} this year`,
      metric: { label: "Endorsements this year", value: String(total), delta: { direction: growth > 0 ? "Up" : "Down", value: `${Math.abs(growth)}%` }, series },
      body: "Most came after the checkout redesign. Product and Engineering endorse most; Sales has not yet.",
      confidence: "High",
      provenance: { summary: `From ${total} endorsements, 3 teams`, source_ids: [`endorsements:${s.subject?.id}`] },
    };
  }

  if (!owner) {
    for (const l of s.locked) yield { type: "gen/state/locked", title: l.title, price: l.price };
  }

  if (owner && s.oneOnOnes.length) {
    const next = s.oneOnOnes[0]!;
    const withName = first(s.people.find((p) => p.id === next.with_id)?.name);
    yield {
      type: "gen/insight/next-steps",
      title: `For your 1:1 with ${withName} on Thursday`,
      steps: [
        { text: "Share the Q4 planning draft before Wednesday", state: "Suggested" },
        { text: `Ask ${withName} to co-lead the Q4 planning session`, state: "Suggested" },
        { text: "Agree one growth goal for next quarter", state: "Suggested" },
      ],
      confidence: "Medium",
      provenance: { summary: `From ${s.oneOnOnes.length} past 1:1 notes`, source_ids: s.oneOnOnes.map((o) => o.id) },
    };
  }
}

function* leader(s: ScopedData): Generator<GeneratedBlock> {
  const exits = s.orgChanges.filter((o) => o.kind === "manager_exit");
  const without = exits.reduce((n, o) => n + o.reports_without_1on1, 0);
  const company = Math.round(s.teams.reduce((n, t) => n + t.nps.at(-1)! * t.headcount, 0) / s.teams.reduce((n, t) => n + t.headcount, 0));
  const companyPrev = Math.round(s.teams.reduce((n, t) => n + t.nps.at(-4)! * t.headcount, 0) / s.teams.reduce((n, t) => n + t.headcount, 0));
  const companySeries = MONTHS.map((_, i) => Math.round(s.teams.reduce((n, t) => n + t.nps[i]! * t.headcount, 0) / s.teams.reduce((n, t) => n + t.headcount, 0)));
  const sorted = [...s.teams].sort((a, b) => b.nps.at(-1)! - a.nps.at(-1)!);
  const lowest = sorted.at(-1)!;
  const atRisk = s.keyResults.filter((k) => k.progress < 0.6 * k.expected);

  yield {
    type: "gen/insight/narrative",
    kicker: `${s.company.name}, this month`,
    headline: exits.length
      ? `Engagement is up, but ${lowest.name} is slipping. Two manager exits left ${without} people without 1:1s.`
      : `Engagement is up across ${s.teams.length} teams.`,
    suggestions: ["Who should cover those 1:1s?", "Show eNPS by team", "Which KRs are off pace?"],
    confidence: "High",
    provenance: { summary: `From ${s.company.employees} people, ${s.teams.length} teams, ${s.keyResults.length} KRs`, source_ids: [...s.teams.map((t) => `team:${t.id}`), ...exits.map((e) => e.id)] },
  };

  if (exits.length) {
    yield {
      type: "gen/insight/risk",
      severity: "Critical",
      title: `Two ${lowest.name} managers left in July`,
      body: `Their ${without} reports have had no 1:1 since. Engagement in that group dropped ${exits[0]!.engagement_drop} points.`,
      next_steps: [{ text: `Assign interim managers for the ${without} reports`, state: "Suggested" }],
      confidence: "Medium",
      provenance: { summary: `From HR records, ${without} people`, source_ids: exits.map((e) => e.id) },
    };
  }

  for (const kr of atRisk.slice(0, 1)) {
    yield {
      type: "gen/insight/risk",
      severity: "Caution",
      title: `Behind plan: ${kr.text}`.slice(0, 70),
      body: `At ${kr.progress}% against an expected ${kr.expected}%, this key result will miss unless the Q4 pipeline closes larger deals.`,
      next_steps: [{ text: "Review the 6 largest open deals with Sales leads", state: "Suggested" }],
      confidence: "High",
      provenance: { summary: "From OKR tracker", source_ids: [kr.id] },
    };
  }

  yield {
    type: "gen/insight/trend",
    title: "Employee NPS is climbing for the third month",
    metric: { label: "Employee NPS", value: String(company), delta: { direction: company >= companyPrev ? "Up" : "Down", value: `${Math.abs(pct(company, companyPrev))}%` }, series: companySeries },
    body: `Engineering moved from ${s.teams.find((t) => t.id === "t-eng")?.nps[0]} to ${s.teams.find((t) => t.id === "t-eng")?.nps.at(-1)} after weekly 1:1s started.`,
    confidence: "High",
    provenance: { summary: `From ${s.teams.length} teams' surveys`, source_ids: s.teams.map((t) => `team:${t.id}`) },
  };

  if (Math.abs(pct(lowest.nps.at(-1)!, company)) > 10) {
    yield {
      type: "gen/insight/comparison",
      title: `${lowest.name} trails the company on eNPS`,
      unit: "eNPS",
      rows: [
        { label: lowest.name, value: lowest.nps.at(-1)!, role: "Subject" as const },
        ...sorted.slice(0, 2).map((t) => ({ label: t.name, value: t.nps.at(-1)!, role: "Benchmark" as const })),
        { label: "Company", value: company, role: "Benchmark" as const },
      ].sort((a, b) => (a.role === "Subject" ? -1 : b.role === "Subject" ? 1 : b.value - a.value)),
      body: `The gap opened in July, when ${lowest.name} lost two managers.`,
      confidence: "Medium",
      provenance: { summary: `From ${s.teams.length} teams, 2 org changes`, source_ids: [`team:${lowest.id}`, ...exits.map((e) => e.id)] },
    };
  }

  yield {
    type: "gen/insight/next-steps",
    title: "For Monday's leadership sync",
    steps: [
      { text: `Assign interim managers for the ${without} ${lowest.name} reports`, state: "Suggested" },
      { text: "Review deal-size KR with Sales leads", state: "Suggested" },
    ],
    confidence: "Medium",
    provenance: { summary: "From the risks above", source_ids: [...exits.map((e) => e.id), ...atRisk.map((k) => k.id)] },
  };
}

function* answer(s: ScopedData, q: string): Generator<GeneratedBlock> {
  const text = q.toLowerCase();
  if (s.context === "leader" && /team|enps|nps/.test(text)) {
    const sorted = [...s.teams].sort((a, b) => b.nps.at(-1)! - a.nps.at(-1)!).slice(0, 2);
    yield {
      type: "gen/insight/chart",
      chart: "Line",
      title: "eNPS by month, top two teams",
      series: sorted.map((t, i) => ({ name: t.name, values: t.nps, role: i === 0 ? "primary" : "secondary" })),
      x_labels: MONTHS,
      body: `${sorted[0]!.name} rose fastest, ${sorted[0]!.nps[0]} → ${sorted[0]!.nps.at(-1)}.`,
      confidence: "High",
      provenance: { summary: `From ${s.teams.length} teams' surveys`, source_ids: sorted.map((t) => `team:${t.id}`) },
    };
    return;
  }
  yield {
    type: "gen/insight/narrative",
    kicker: "Answer",
    headline: "Offline mode answers a few fixed questions. Connect Claude to answer anything about the data in scope.",
    suggestions: [],
    confidence: "Low",
    provenance: { summary: "From the data in scope", source_ids: ["company:summary"] },
  };
}

/** Human data is rendered from records, never by the model (grammar step 5, owner only). */
export function humanDataBlock(s: ScopedData): Block | null {
  if (s.context !== "owner") return null;
  const pub = s.entries.filter((e) => e.visibility === "public");
  const priv = s.entries.filter((e) => e.visibility === "private");
  return {
    type: "human/data-list",
    title: "Your data",
    meta: `${pub.length} public, ${priv.length} private`,
    rows: s.entries.map((e) => ({
      id: e.id,
      title: e.title,
      subtitle: `${e.org}, ${e.period}`,
      meta: e.visibility === "public" ? `${e.endorsements} endorsements, +${e.credits_earned} credits` : "Private, earns nothing",
      visibility: e.visibility === "public" ? "Public" : "Private",
    })),
  };
}

export function appBarFor(data: Dataset, context: Context, subjectId: string, viewerId: string): AppBar {
  const subject = data.people.find((p) => p.id === subjectId);
  const viewer = data.people.find((p) => p.id === viewerId);
  if (context === "leader") return { context, title: data.company.name, subtitle: `${data.company.employees} people`, credits: null };
  if (context === "viewer") return { context, title: subject?.name ?? "Profile", subtitle: subject?.role ?? "", credits: viewer?.credits ?? 0 };
  return { context, title: subject?.name ?? "You", subtitle: subject?.role ?? "", credits: subject?.credits ?? 0 };
}

export function notEnoughData(s: ScopedData): Block {
  const who = s.subject?.name.split(" ")[0] ?? "This person";
  const viewer = s.context === "viewer";
  return {
    type: "gen/state/not-enough-data",
    title: viewer ? `${who} hasn't shared enough yet` : "Not enough to write about yet",
    body: viewer
      ? `Insights start at 3 public entries and 2 public feedback notes. ${who} has ${s.entries.length} and ${s.feedback.length}.`
      : `Insights start at 3 entries and 2 feedback notes. You have ${s.entries.length} entries and ${s.feedback.length} feedback notes.`,
    action: viewer ? `Endorse ${who}'s work` : "Add an entry",
  };
}
