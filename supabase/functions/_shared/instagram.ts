// Abstração de provedor de Instagram. Dois modos:
//   - GraphApiProvider: enriquecimento GRÁTIS via Graph API business_discovery
//     (dado um @handle conhecido). Não descobre perfis novos.
//   - ApifyProvider: descoberta por hashtag (free tier do Apify). Pago por uso.
//
// Selecione via env INSTAGRAM_PROVIDER = "graph" | "apify".

export interface InstagramProfile {
  handle: string;
  full_name?: string;
  biography?: string;
  website?: string;
  followers?: number;
  is_business?: boolean;
  category?: string;
  email?: string; // extraído da bio
  phone?: string; // extraído da bio (dígitos E.164)
}

export interface InstagramProvider {
  readonly name: string;
  readonly canDiscover: boolean;
  discoverByHashtag(hashtags: string[], limit: number): Promise<InstagramProfile[]>;
  enrichProfile(handle: string): Promise<InstagramProfile | null>;
}

// ── Helpers de extração da bio ───────────────────────────────
export function extractEmail(text?: string): string | undefined {
  const m = (text ?? "").match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  return m?.[0]?.toLowerCase();
}

export function extractPhoneBR(text?: string): string | undefined {
  const m = (text ?? "").match(/(?:\+?55\s*)?\(?\d{2}\)?\s*9?\d{4}[-\s]?\d{4}/);
  if (!m) return undefined;
  let d = m[0].replace(/\D/g, "");
  if (d.length === 10 || d.length === 11) d = "55" + d; // sem DDI → adiciona
  if (d.length === 12 || d.length === 13) return d;
  return undefined;
}

const stripAt = (h: string) => h.replace(/^@/, "").trim().toLowerCase();

// ── Graph API (grátis, só enriquecimento) ───────────────────
class GraphApiProvider implements InstagramProvider {
  readonly name = "graph";
  readonly canDiscover = false;
  constructor(private token: string, private igUserId: string) {}

  discoverByHashtag(): Promise<InstagramProfile[]> {
    return Promise.reject(
      new Error("Graph API não descobre perfis. Use INSTAGRAM_PROVIDER=apify."),
    );
  }

  async enrichProfile(handle: string): Promise<InstagramProfile | null> {
    const user = stripAt(handle);
    const fields =
      `business_discovery.username(${user}){username,name,biography,website,followers_count,media_count}`;
    const url = `https://graph.facebook.com/v19.0/${this.igUserId}` +
      `?fields=${encodeURIComponent(fields)}&access_token=${this.token}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Graph API ${res.status}: ${await res.text()}`);
    const data = await res.json() as {
      business_discovery?: {
        username: string;
        name?: string;
        biography?: string;
        website?: string;
        followers_count?: number;
      };
    };
    const bd = data.business_discovery;
    if (!bd) return null;
    return {
      handle: bd.username,
      full_name: bd.name,
      biography: bd.biography,
      website: bd.website,
      followers: bd.followers_count,
      is_business: true,
      email: extractEmail(bd.biography),
      phone: extractPhoneBR(bd.biography),
    };
  }
}

// ── Apify (descoberta por hashtag) ──────────────────────────
interface ApifyItem {
  username?: string;
  ownerUsername?: string;
  fullName?: string;
  biography?: string;
  externalUrl?: string;
  website?: string;
  followersCount?: number;
  isBusinessAccount?: boolean;
  businessCategoryName?: string;
}

class ApifyProvider implements InstagramProvider {
  readonly name = "apify";
  readonly canDiscover = true;
  constructor(private token: string, private actor: string) {}

  private async runActor(input: Record<string, unknown>): Promise<ApifyItem[]> {
    const url =
      `https://api.apify.com/v2/acts/${this.actor}/run-sync-get-dataset-items` +
      `?token=${this.token}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(`Apify ${res.status}: ${await res.text()}`);
    return await res.json() as ApifyItem[];
  }

  private toProfile(it: ApifyItem): InstagramProfile {
    const handle = stripAt(it.username ?? it.ownerUsername ?? "");
    const bio = it.biography;
    return {
      handle,
      full_name: it.fullName,
      biography: bio,
      website: it.externalUrl ?? it.website,
      followers: it.followersCount,
      is_business: it.isBusinessAccount,
      category: it.businessCategoryName,
      email: extractEmail(bio),
      phone: extractPhoneBR(bio),
    };
  }

  async discoverByHashtag(
    hashtags: string[],
    limit: number,
  ): Promise<InstagramProfile[]> {
    // Campos de input variam por ator — ajustar ao ator escolhido.
    const items = await this.runActor({
      hashtags: hashtags.map((h) => h.replace(/^#/, "")),
      resultsLimit: limit,
      searchType: "hashtag",
    });
    const byHandle = new Map<string, InstagramProfile>();
    for (const it of items) {
      const p = this.toProfile(it);
      if (p.handle && !byHandle.has(p.handle)) byHandle.set(p.handle, p);
    }
    return [...byHandle.values()];
  }

  async enrichProfile(handle: string): Promise<InstagramProfile | null> {
    const items = await this.runActor({
      usernames: [stripAt(handle)],
      resultsLimit: 1,
    });
    return items[0] ? this.toProfile(items[0]) : null;
  }
}

// ── Factory ─────────────────────────────────────────────────
export function getInstagramProvider(): InstagramProvider {
  const which = (Deno.env.get("INSTAGRAM_PROVIDER") ?? "graph").toLowerCase();
  if (which === "apify") {
    const token = Deno.env.get("APIFY_TOKEN");
    if (!token) throw new Error("APIFY_TOKEN ausente");
    const actor = Deno.env.get("APIFY_IG_ACTOR") ?? "apify~instagram-scraper";
    return new ApifyProvider(token, actor);
  }
  const token = Deno.env.get("IG_GRAPH_TOKEN");
  const igUserId = Deno.env.get("IG_USER_ID");
  if (!token || !igUserId) {
    throw new Error("IG_GRAPH_TOKEN e IG_USER_ID são obrigatórios para o modo graph");
  }
  return new GraphApiProvider(token, igUserId);
}
