import { apiClient, unwrap } from "./client";
import type { ApiResponse, SearchResults } from "./types";

export function search(q: string, limit = 10) {
  return unwrap(
    apiClient.get<ApiResponse<SearchResults>>("/search/", { params: { q, limit } }),
  );
}
