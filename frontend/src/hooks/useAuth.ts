import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../stores/auth";
import * as authApi from "../api/auth";
import * as userApi from "../api/user";

/**
 * On app boot, if a refresh token survived a reload, the access token is
 * still empty until the first authenticated request triggers the client's
 * 401 -> refresh interceptor. To avoid a flash of "logged out" UI, we
 * proactively fetch /users/me once on mount when a refresh token exists.
 */
export function useSessionHydration() {
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const setUser = useAuthStore((s) => s.setUser);
  const setHydrated = useAuthStore((s) => s.setHydrated);

  const { data, isFetched } = useQuery({
    queryKey: ["currentUser"],
    queryFn: userApi.getCurrentUser,
    enabled: Boolean(refreshToken) && !isHydrated,
    retry: false,
  });

  useEffect(() => {
    if (!refreshToken) {
      setHydrated();
      return;
    }
    if (isFetched) {
      setUser(data ?? null);
      setHydrated();
    }
  }, [refreshToken, isFetched, data, setUser, setHydrated]);

  return { isHydrated };
}

export function useCurrentUser() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: userApi.getCurrentUser,
    enabled: Boolean(accessToken),
  });
}

export function useSendOtp() {
  return useMutation({ mutationFn: authApi.sendOtp });
}

export function useSignin() {
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, otp }: { email: string; otp: string }) => {
      const tokens = await authApi.signin(email, otp);
      setTokens(tokens);
      const user = await userApi.getCurrentUser();
      setUser(user);
      return user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["currentUser"], user);
    },
  });
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  const queryClient = useQueryClient();
  return () => {
    clear();
    queryClient.clear();
  };
}
