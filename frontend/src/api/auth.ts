import { apiClient, unwrap } from "./client";
import type { ApiResponse, Tokens } from "./types";

export function sendOtp(email: string) {
  return unwrap(apiClient.post<ApiResponse<{ email: string }>>("/auth/send-otp", { email }));
}

export function signin(email: string, otp: string) {
  return unwrap(apiClient.post<ApiResponse<Tokens>>("/auth/signin", { email, otp }));
}

export function googleLoginUrl(): string {
  return `${import.meta.env.VITE_API_BASE_URL as string}/auth/google/login`;
}
