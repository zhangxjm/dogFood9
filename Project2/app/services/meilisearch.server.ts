import { MeiliSearch } from "meilisearch";

const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST || "http://127.0.0.1:7700";
const MEILISEARCH_MASTER_KEY = process.env.MEILISEARCH_MASTER_KEY || "copyright-master-key-2024";
const MEILISEARCH_INDEX = process.env.MEILISEARCH_INDEX || "copyright_works";

let client: MeiliSearch | null = null;

function getClient(): MeiliSearch {
  if (!client) {
    client = new MeiliSearch({
      host: MEILISEARCH_HOST,
      apiKey: MEILISEARCH_MASTER_KEY
    });
  }
  return client;
}

export async function ensureIndexExists() {
  try {
    const c = getClient();
    const indexes = await c.getIndexes();
    const exists = indexes.results.some(i => i.uid === MEILISEARCH_INDEX);
    
    if (!exists) {
      await c.createIndex(MEILISEARCH_INDEX, { primaryKey: "id" });
    }
    
    const index = c.index(MEILISEARCH_INDEX);
    await index.updateSettings({
      searchableAttributes: ["title", "author", "description", "content"],
      filterableAttributes: ["type", "status", "userId"],
      sortableAttributes: ["createdAt", "title"],
      displayedAttributes: ["id", "title", "type", "author", "description", "contentHash", "status", "createdAt"]
    });
    
    return true;
  } catch (error) {
    console.warn("Meilisearch index initialization failed:", error instanceof Error ? error.message : "Unknown error");
    return false;
  }
}

export interface MeiliWorkDoc {
  id: string;
  title: string;
  type: string;
  author: string;
  description: string;
  content: string;
  contentHash: string;
  status: string;
  userId: string;
  createdAt: number;
}

export async function indexWork(doc: MeiliWorkDoc): Promise<boolean> {
  try {
    const c = getClient();
    const index = c.index(MEILISEARCH_INDEX);
    await index.addDocuments([{
      ...doc,
      createdAt: new Date(doc.createdAt).getTime()
    }]);
    return true;
  } catch (error) {
    console.warn("Meilisearch index work failed:", error instanceof Error ? error.message : "Unknown error");
    return false;
  }
}

export interface SearchResult {
  id: string;
  title: string;
  author: string;
  similarity: number;
}

export async function searchSimilarWorks(
  query: string,
  excludeId?: string,
  limit: number = 20
): Promise<SearchResult[]> {
  try {
    const c = getClient();
    const index = c.index(MEILISEARCH_INDEX);
    
    const search = await index.search(query, {
      limit,
      attributesToSearchOn: ["title", "description", "content"]
    });
    
    const results: SearchResult[] = [];
    for (const hit of search.hits) {
      const doc = hit as any;
      if (excludeId && doc.id === excludeId) continue;
      
      const similarityScore = Math.min(
        100,
        Math.floor((hit._rankingScore || 0.5) * 100)
      );
      
      results.push({
        id: doc.id,
        title: doc.title,
        author: doc.author,
        similarity: similarityScore
      });
    }
    
    return results;
  } catch (error) {
    console.warn("Meilisearch search failed:", error instanceof Error ? error.message : "Unknown error");
    return [];
  }
}

export async function removeWorkFromIndex(workId: string): Promise<boolean> {
  try {
    const c = getClient();
    const index = c.index(MEILISEARCH_INDEX);
    await index.deleteDocument(workId);
    return true;
  } catch (error) {
    console.warn("Meilisearch remove failed:", error instanceof Error ? error.message : "Unknown error");
    return false;
  }
}
