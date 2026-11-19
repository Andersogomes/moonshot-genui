import { createClient } from "@supabase/supabase-js";
import type { Dataset } from "./core/index.ts";

/** Loads the company's records with the service role. RLS blocks everyone else. */
export async function loadDataset(): Promise<Dataset> {
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const [company, teams, people, entries, feedback, oneOnOnes, keyResults, orgChanges] = await Promise.all([
    db.from("companies").select("*").limit(1).single(),
    db.from("teams").select("*"),
    db.from("people").select("*"),
    db.from("entries").select("*").order("created_at"),
    db.from("feedback").select("*").order("date", { ascending: false }),
    db.from("one_on_ones").select("*").order("date", { ascending: false }),
    db.from("key_results").select("*"),
    db.from("org_changes").select("*"),
  ]);
  const err = [company, teams, people, entries, feedback, oneOnOnes, keyResults, orgChanges].find((r) => r.error)?.error;
  if (err) throw new Error(`db: ${err.message}`);

  return {
    company: company.data,
    teams: teams.data!.map((t) => ({ ...t, avg_skills: Number(t.avg_skills) })),
    people: people.data!.map(({ id, name, role, team_id, manager_id, credits }) => ({ id, name, role, team_id, manager_id, credits })),
    entries: entries.data!,
    feedback: feedback.data!,
    oneOnOnes: oneOnOnes.data!,
    keyResults: keyResults.data!,
    orgChanges: orgChanges.data!,
    endorsementSeries: Object.fromEntries(people.data!.filter((p) => p.endorsement_series?.length).map((p) => [p.id, p.endorsement_series])),
  } as Dataset;
}

export function serviceClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
}
