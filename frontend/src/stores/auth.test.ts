import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "./auth";

describe("useAuthStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      isHydrated: false,
    });
  });

  it("stores the refresh token in localStorage on setTokens", () => {
    useAuthStore.getState().setTokens({
      access_token: "access-123",
      refresh_token: "refresh-456",
    });

    expect(useAuthStore.getState().accessToken).toBe("access-123");
    expect(useAuthStore.getState().refreshToken).toBe("refresh-456");
    expect(localStorage.getItem("bys_refresh_token")).toBe("refresh-456");
  });

  it("clears tokens, user, and localStorage on clear", () => {
    useAuthStore.getState().setTokens({
      access_token: "access-123",
      refresh_token: "refresh-456",
    });

    useAuthStore.getState().clear();

    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().refreshToken).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(localStorage.getItem("bys_refresh_token")).toBeNull();
  });
});
