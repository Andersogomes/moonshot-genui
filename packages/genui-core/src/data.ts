/**
 * Domain model + sample dataset. The cast and numbers are the sample data from
 * the Figma contract ("All names and numbers are sample data"). In production
 * these rows come from Supabase (see supabase/migrations); the shapes match.
 */

export type Visibility = "public" | "private";

export interface Person {
  id: string;
  name: string;
  role: string;
  team_id: string;
  manager_id: string | null;
  credits: number;
}

export interface Entry {
  id: string;
  person_id: string;
  kind: "job" | "education" | "course" | "event" | "lesson";
  title: string;
  org: string;
  period: string;
  body?: string;
  endorsements: number;
  credits_earned: number;
  visibility: Visibility;
}

export interface Feedback {
  id: string;
  person_id: string; // who received it
  author_id: string;
  text: string;
  theme: string;
  visibility: Visibility;
  date: string;
}

export interface OneOnOne {
  id: string;
  person_id: string;
  with_id: string;
  date: string;
  notes: string;
}

export interface Team {
  id: string;
  name: string;
  lead_id: string;
  headcount: number;
  /** Monthly eNPS, oldest → newest (Mar..Oct). */
  nps: number[];
  goals_achieved: number;
  avg_skills: number;
}

export interface KeyResult {
  id: string;
  objective: string;
  text: string;
  progress: number; // 0..100
  expected: number; // 0..100 pace expected today
  team_id: string;
}

export interface OrgChange {
  id: string;
  kind: "manager_exit";
  team_id: string;
  date: string;
  person_name: string;
  reports_without_1on1: number;
  engagement_drop: number;
}

export interface Dataset {
  company: { name: string; employees: number; period: string; avg_salary: number; training_costs: number };
  people: Person[];
  entries: Entry[];
  feedback: Feedback[];
  oneOnOnes: OneOnOne[];
  teams: Team[];
  keyResults: KeyResult[];
  orgChanges: OrgChange[];
  /** Monthly endorsements for each person, oldest → newest. */
  endorsementSeries: Record<string, number[]>;
}

export const MONTHS = ["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];

export const sampleData: Dataset = {
  company: { name: "Zendaya Co.", employees: 54, period: "2026-10", avg_salary: 91320, training_costs: 132000 },
  people: [
    { id: "p-anderson", name: "Anderson Silva", role: "Director of Product Ops", team_id: "t-product", manager_id: "p-amelia", credits: 327 },
    { id: "p-amelia", name: "Amelia Earhart", role: "VP Product", team_id: "t-product", manager_id: null, credits: 112 },
    { id: "p-rafael", name: "Rafael Fedeli", role: "Product Manager", team_id: "t-product", manager_id: "p-anderson", credits: 112 },
    { id: "p-marina", name: "Marina Costa", role: "Engineering Manager", team_id: "t-eng", manager_id: "p-amelia", credits: 86 },
    { id: "p-lucas", name: "Lucas Prado", role: "Sales Lead", team_id: "t-sales", manager_id: "p-amelia", credits: 41 },
  ],
  entries: [
    { id: "e-1", person_id: "p-anderson", kind: "job", title: "Director of Product Ops", org: "Hotmart BV", period: "2020 – 2021", endorsements: 23, credits_earned: 12, visibility: "public" },
    { id: "e-2", person_id: "p-anderson", kind: "job", title: "Head of Design", org: "Hotmart Brazil", period: "2019 – 2020", endorsements: 120, credits_earned: 5, visibility: "public" },
    { id: "e-3", person_id: "p-anderson", kind: "job", title: "Head of Design", org: "Youse Insurance", period: "2017 – 2019", endorsements: 54, credits_earned: 4, visibility: "public" },
    { id: "e-4", person_id: "p-anderson", kind: "education", title: "Industrial Design", org: "UFPR", period: "2005 – 2012", endorsements: 23, credits_earned: 5, visibility: "public" },
    { id: "e-5", person_id: "p-anderson", kind: "lesson", title: "Write both positions down", org: "Hotmart BV", period: "2021", body: "When two stakeholders disagree, I now write both positions down before the meeting. It cut our decision time in half.", endorsements: 0, credits_earned: 0, visibility: "private" },
    { id: "e-6", person_id: "p-anderson", kind: "lesson", title: "Disagree without over-reacting", org: "Youse Insurance", period: "2019", body: "I received feedback that I over-react when I disagree. I'm reading about emotional intelligence and noticing my behaviour in conflicts.", endorsements: 10, credits_earned: 0, visibility: "private" },
    { id: "e-7", person_id: "p-rafael", kind: "job", title: "Product Manager", org: "Zendaya Co.", period: "2022 – now", endorsements: 31, credits_earned: 8, visibility: "public" },
    { id: "e-8", person_id: "p-rafael", kind: "course", title: "Discovery sprints", org: "Reforge", period: "2024", endorsements: 4, credits_earned: 2, visibility: "public" },
  ],
  feedback: [
    { id: "f-1", person_id: "p-anderson", author_id: "p-rafael", text: "Anderson turns a messy brief into a plan the whole team can follow.", theme: "clarity", visibility: "public", date: "2026-09-12" },
    { id: "f-2", person_id: "p-anderson", author_id: "p-marina", text: "He made the checkout scope negotiable instead of a fight.", theme: "clarity", visibility: "public", date: "2026-08-02" },
    { id: "f-3", person_id: "p-anderson", author_id: "p-amelia", text: "Clear plans out of unclear goals, every quarter.", theme: "clarity", visibility: "public", date: "2026-07-21" },
    { id: "f-4", person_id: "p-anderson", author_id: "p-lucas", text: "Would like more early visibility into roadmap trade-offs for Sales.", theme: "visibility", visibility: "public", date: "2026-10-03" },
    { id: "f-5", person_id: "p-anderson", author_id: "p-rafael", text: "Sometimes pushes back hard in reviews before hearing the whole case.", theme: "conflict", visibility: "private", date: "2026-06-30" },
    { id: "f-6", person_id: "p-anderson", author_id: "p-marina", text: "Turned our vague OKR into three milestones we actually hit.", theme: "clarity", visibility: "public", date: "2026-10-15" },
  ],
  oneOnOnes: [
    { id: "o-1", person_id: "p-anderson", with_id: "p-rafael", date: "2026-10-30", notes: "Rafael wants more ownership of Q4 planning. Draft is ready." },
    { id: "o-2", person_id: "p-anderson", with_id: "p-rafael", date: "2026-10-16", notes: "Agreed to pick one growth goal for next quarter." },
    { id: "o-3", person_id: "p-anderson", with_id: "p-amelia", date: "2026-10-09", notes: "Share planning drafts earlier with Sales." },
  ],
  teams: [
    { id: "t-eng", name: "Engineering", lead_id: "p-marina", headcount: 18, nps: [31, 33, 34, 36, 40, 44, 49, 52], goals_achieved: 81, avg_skills: 3.6 },
    { id: "t-product", name: "Product", lead_id: "p-amelia", headcount: 9, nps: [40, 41, 43, 42, 45, 46, 48, 50], goals_achieved: 84, avg_skills: 3.4 },
    { id: "t-sales", name: "Sales", lead_id: "p-lucas", headcount: 14, nps: [38, 37, 36, 35, 33, 32, 32, 32], goals_achieved: 62, avg_skills: 2.9 },
    { id: "t-design", name: "Design", lead_id: "p-anderson", headcount: 6, nps: [44, 45, 45, 46, 47, 47, 48, 48], goals_achieved: 79, avg_skills: 3.3 },
    { id: "t-ops", name: "Operations", lead_id: "p-amelia", headcount: 4, nps: [30, 31, 33, 32, 34, 35, 36, 37], goals_achieved: 70, avg_skills: 3.0 },
    { id: "t-people", name: "People", lead_id: "p-amelia", headcount: 3, nps: [50, 50, 51, 52, 52, 53, 53, 54], goals_achieved: 88, avg_skills: 3.2 },
  ],
  keyResults: [
    { id: "kr-1", objective: "Improve sales while keeping churn flat", text: "Reach 75% of sales from inbound leads", progress: 85, expected: 80, team_id: "t-sales" },
    { id: "kr-2", objective: "Improve sales while keeping churn flat", text: "Keep monthly churn below 2%", progress: 92, expected: 80, team_id: "t-sales" },
    { id: "kr-3", objective: "Improve sales while keeping churn flat", text: "Grow average deal size by 10%", progress: 48, expected: 85, team_id: "t-sales" },
    { id: "kr-4", objective: "Build a high-performance culture", text: "Run quarterly 1:1s with 100% of ICs", progress: 80, expected: 80, team_id: "t-people" },
  ],
  orgChanges: [
    { id: "hr-exit-0712", kind: "manager_exit", team_id: "t-sales", date: "2026-07-12", person_name: "Sales manager", reports_without_1on1: 5, engagement_drop: 14 },
    { id: "hr-exit-0729", kind: "manager_exit", team_id: "t-sales", date: "2026-07-29", person_name: "Sales manager", reports_without_1on1: 4, engagement_drop: 14 },
  ],
  endorsementSeries: {
    "p-anderson": [7, 8, 8, 9, 10, 11, 12, 13],
    "p-rafael": [2, 2, 3, 3, 3, 4, 4, 5],
  },
};
