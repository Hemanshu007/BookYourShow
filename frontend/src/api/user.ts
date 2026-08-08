import { apiClient, unwrap } from "./client";
import type { ApiResponse, User } from "./types";

export function getCurrentUser() {
  return unwrap(apiClient.get<ApiResponse<User>>("/users/me"));
}

export function deleteAccount() {
  return unwrap(apiClient.delete<ApiResponse<null>>("/users/user/delete"));
}
