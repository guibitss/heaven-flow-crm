// Provedor de LinkedIn. ATENÇÃO: o LinkedIn NÃO tem API oficial de descoberta —
// só scraping de terceiros (Apify/PhantomBuster), que VIOLA o ToS do LinkedIn e
// pode bloquear a conta usada. Por isso o condutor exige opt-in explícito de risco
// (linkedin_config.habilitado_risco) e o canal nasce DESLIGADO.
//
// Aqui implementamos via Apify (actor configurável). Selecionado por env.

export interface LinkedInCompany {
  ref: string; // slug/URL único da empresa (dedup)
  name: string;
  website?: string;
  industry?: string;
  size?: string;
  location?: string;
  description?: string;
}

export interface LinkedInProvider {
  readonly name: string;
  searchCompanies(queries: string[], limit: number): Promise<LinkedInCompany[]>;
}

interface ApifyCompanyItem {
  companyName?: string;
  name?: string;
  url?: string;
  companyUrl?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  location?: string;
  description?: string;
}

class ApifyLinkedInProvider implements LinkedInProvider {
  readonly name = "apify";
  constructor(private token: string, private actor: string) {}

  async searchCompanies(
    queries: string[],
    limit: number,
  ): Promise<LinkedInCompany[]> {
    const url =
      `https://api.apify.com/v2/acts/${this.actor}/run-sync-get-dataset-items` +
      `?token=${this.token}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queries, maxItems: limit, searchType: "companies" }),
    });
    if (!res.ok) throw new Error(`Apify LinkedIn ${res.status}: ${await res.text()}`);
    const items = await res.json() as ApifyCompanyItem[];
    const byRef = new Map<string, LinkedInCompany>();
    for (const it of items) {
      const ref = (it.companyUrl ?? it.url ?? "").trim();
      const name = it.companyName ?? it.name ?? "";
      if (!ref || !name || byRef.has(ref)) continue;
      byRef.set(ref, {
        ref,
        name,
        website: it.website,
        industry: it.industry,
        size: it.companySize,
        location: it.location,
        description: it.description,
      });
    }
    return [...byRef.values()];
  }
}

export function getLinkedInProvider(): LinkedInProvider {
  const token = Deno.env.get("APIFY_TOKEN");
  if (!token) {
    throw new Error("APIFY_TOKEN ausente (necessário para o scraping de LinkedIn)");
  }
  const actor = Deno.env.get("APIFY_LINKEDIN_ACTOR") ?? "apify~linkedin-company-scraper";
  return new ApifyLinkedInProvider(token, actor);
}
