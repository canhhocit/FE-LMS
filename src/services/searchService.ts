import { apiClient, unwrap } from "./api/client";

export interface SearchResultItem {
  type: "COURSE" | "LESSON" | "FORUM";
  title: string;
  description: string;
  link: string;
}

export const searchGlobal = async (query: string): Promise<SearchResultItem[]> => {
  if (!query || query.trim().length < 2) return [];
  return unwrap<SearchResultItem[]>(apiClient.get("/search", { params: { q: query.trim() } }));
};

