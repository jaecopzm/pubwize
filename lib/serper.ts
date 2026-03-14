/**
 * Serper.dev API wrapper
 * Provides SERP data (organic results, PAA, related searches) for Pro-tier enrichment.
 */

export interface SerpOrganicResult {
    title: string;
    link: string;
    snippet: string;
    position: number;
}

export interface SerpPeopleAlsoAsk {
    question: string;
    snippet?: string;
}

export interface SerpRelatedSearch {
    query: string;
}

export interface SerpContext {
    topResults: SerpOrganicResult[];
    peopleAlsoAsk: SerpPeopleAlsoAsk[];
    relatedSearches: SerpRelatedSearch[];
}

function getSerperKey(): string {
    const key = process.env.SERPER_API_KEY;
    if (!key) throw new Error("SERPER_API_KEY is not set");
    return key;
}

/**
 * Fetches live SERP data for a keyword.
 * Returns top organic results, PAA questions, and related searches.
 */
export async function fetchSerpContext(
    keyword: string,
    country: string = "us"
): Promise<SerpContext> {
    const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
            "X-API-KEY": getSerperKey(),
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            q: keyword,
            gl: country.toLowerCase(),
            num: 10,
        }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Serper API error ${res.status}: ${text}`);
    }

    const data = await res.json() as {
        organic?: Array<{ title?: string; link?: string; snippet?: string; position?: number }>;
        peopleAlsoAsk?: Array<{ question?: string; snippet?: string }>;
        relatedSearches?: Array<{ query?: string }>;
    };

    const topResults: SerpOrganicResult[] = (data.organic ?? [])
        .slice(0, 10)
        .map((r, i) => ({
            title: r.title ?? "",
            link: r.link ?? "",
            snippet: r.snippet ?? "",
            position: r.position ?? i + 1,
        }))
        .filter((r) => r.title);

    const peopleAlsoAsk: SerpPeopleAlsoAsk[] = (data.peopleAlsoAsk ?? [])
        .slice(0, 8)
        .map((q) => ({
            question: q.question ?? "",
            snippet: q.snippet,
        }))
        .filter((q) => q.question);

    const relatedSearches: SerpRelatedSearch[] = (data.relatedSearches ?? [])
        .slice(0, 8)
        .map((r) => ({ query: r.query ?? "" }))
        .filter((r) => r.query);

    return { topResults, peopleAlsoAsk, relatedSearches };
}

/**
 * Fetches keyword suggestions using Serper's autocomplete API.
 */
export async function fetchKeywordSuggestions(query: string): Promise<string[]> {
    const res = await fetch("https://google.serper.dev/autocomplete", {
        method: "POST",
        headers: {
            "X-API-KEY": getSerperKey(),
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ q: query }),
    });

    if (!res.ok) return [];

    const data = await res.json() as { suggestions?: string[] };
    return data.suggestions ?? [];
}
