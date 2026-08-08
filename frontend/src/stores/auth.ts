import { create } from "zustand";
import type { Tokens, User } from "../api/types";

const REFRESH_TOKEN_KEY = "bys_refresh_token";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isHydrated: boolean;
  setTokens: (tokens: Tokens) => void;
  setUser: (user: User | null) => void;
  setHydrated: () => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  user: null,
  isHydrated: false,
  setTokens: (tokens) => {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
    set({ accessToken: tokens.access_token, refreshToken: tokens.refresh_token });
  },
  setUser: (user) => set({ user }),
  setHydrated: () => set({ isHydrated: true }),
  clear: () => {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    set({ accessToken: null, refreshToken: null, user: null });
  },
}));
