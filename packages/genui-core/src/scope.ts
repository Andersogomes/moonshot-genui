import type { Context } from "./schema.ts";
import type { Dataset, Entry, Feedback, KeyResult, OneOnOne, OrgChange, Person, Team } from "./data.ts";

/**
 * "Scope is a hard wall." The scope is computed in code, before the model sees
 * anything. Whatever is not in `ScopedData` cannot appear in a generated block:
 * the grammar rejects any block citing a source id outside `allowedSourceIds`.
 */
export interface ScopedData {
  context: Context;
  company: Dataset["company"];
  subject: Person | null;
  people: Pick<Person, "id" | "name" | "role" | "team_id">[];
  entries: Entry[];
  feedback: Feedback[];
  oneOnOnes: OneOnOne[];
  teams: Team[];
  keyResults: KeyResult[];
  orgChanges: OrgChange[];
  endorsements: number[] | null;
  /** Insights that exist but need sources this viewer can't see (title only). */
  locked: { title: string; price: number }[];
  allowedSourceIds: Set<string>;
}

export const LIMITS = {
  max_generated_blocks: 6,
  max_suggestions: 3,
  min_entries_for_generation: 3,
  min_feedback_for_generation: 2,
  min_group_size_leader: 5,
} as const;

export function scopeFor(data: Dataset, context: Context, subjectId: string): ScopedData {
  const subject = data.people.find((p) => p.id === subjectId) ?? null;
  const people = data.people.map(({ id, name, role, team_id }) => ({ id, name, role, team_id }));
  const base = {
    context,
    company: data.company,
    people,
    oneOnOnes: [] as OneOnOne[],
    teams: [] as Team[],
    keyResults: [] as KeyResult[],
    orgChanges: [] as OrgChange[],
    locked: [] as { title: string; price: number }[],
  };

  let scoped: Omit<ScopedData, "allowedSourceIds">;
  if (context === "owner") {
    // All of the person's own entries (public + private), feedback they received, their 1:1 notes.
    scoped = {
      ...base,
      subject,
      entries: data.entries.filter((e) => e.person_id === subjectId),
      feedback: data.feedback.filter((f) => f.person_id === subjectId),
      oneOnOnes: data.oneOnOnes.filter((o) => o.person_id === subjectId),
      endorsements: data.endorsementSeries[subjectId] ?? null,
    };
  } else if (context === "viewer") {
    // The owner's public entries and public feedback only.
    const privateCount =
      data.entries.filter((e) => e.person_id === subjectId && e.visibility === "private").length +
      data.feedback.filter((f) => f.person_id === subjectId && f.visibility === "private").length;
    scoped = {
      ...base,
      subject,
      entries: data.entries.filter((e) => e.person_id === subjectId && e.visibility === "public"),
      feedback: data.feedback.filter((f) => f.person_id === subjectId && f.visibility === "public"),
      endorsements: data.endorsementSeries[subjectId] ?? null,
      // Only the *existence* of private material leaks: a title and a price, never content.
      locked: privateCount > 0 ? [{ title: "Working style and lessons learned", price: 15 }] : [],
    };
  } else {
    // Leader: aggregates for teams of 5+, OKRs, compensation, org changes. No individual feedback text.
    scoped = {
      ...base,
      subject: null,
      people: [],
      entries: [],
      feedback: [],
      teams: data.teams.filter((t) => t.headcount >= LIMITS.min_group_size_leader),
      keyResults: data.keyResults,
      orgChanges: data.orgChanges,
      endorsements: null,
    };
  }

  const ids = new Set<string>([
    ...scoped.entries.map((e) => e.id),
    ...scoped.feedback.map((f) => f.id),
    ...scoped.oneOnOnes.map((o) => o.id),
    ...scoped.teams.map((t) => `team:${t.id}`),
    ...scoped.keyResults.map((k) => k.id),
    ...scoped.orgChanges.map((o) => o.id),
    ...(scoped.endorsements ? [`endorsements:${subjectId}`] : []),
    "company:summary",
  ]);
  return { ...scoped, allowedSourceIds: ids };
}

/** Below the data threshold the grammar says: render not-enough-data instead of guessing. */
export function hasEnoughData(s: ScopedData): boolean {
  if (s.context === "leader") return s.teams.length > 0;
  return s.entries.length >= LIMITS.min_entries_for_generation && s.feedback.length >= LIMITS.min_feedback_for_generation;
}

/** The scoped data as the compact JSON document the model reads. */
export function scopeToPrompt(s: ScopedData): string {
  const name = (id: string) => s.people.find((p) => p.id === id)?.name ?? "a colleague";
  const doc = {
    context: s.context,
    company: s.company,
    subject: s.subject && { id: s.subject.id, name: s.subject.name, role: s.subject.role },
    entries: s.entries.map((e) => ({ source_id: e.id, kind: e.kind, title: e.title, org: e.org, period: e.period, body: e.body, endorsements: e.endorsements, visibility: e.visibility })),
    feedback: s.feedback.map((f) => ({ source_id: f.id, author: name(f.author_id), author_role: s.people.find((p) => p.id === f.author_id)?.role, text: f.text, theme: f.theme, visibility: f.visibility, date: f.date })),
    one_on_ones: s.oneOnOnes.map((o) => ({ source_id: o.id, with: name(o.with_id), date: o.date, notes: o.notes })),
    endorsements_by_month: s.endorsements && { source_id: `endorsements:${s.subject?.id}`, months: ["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"], values: s.endorsements },
    teams: s.teams.map((t) => ({ source_id: `team:${t.id}`, name: t.name, headcount: t.headcount, enps_by_month: t.nps, goals_achieved_pct: t.goals_achieved, avg_skills: t.avg_skills })),
    key_results: s.keyResults.map((k) => ({ source_id: k.id, objective: k.objective, text: k.text, progress_pct: k.progress, expected_pct_today: k.expected })),
    org_changes: s.orgChanges.map((o) => ({ source_id: o.id, kind: o.kind, team: s.teams.find((t) => t.id === o.team_id)?.name, date: o.date, reports_without_1on1: o.reports_without_1on1, engagement_drop_points: o.engagement_drop })),
    locked_insights: s.locked,
  };
  return JSON.stringify(doc, null, 1);
}
