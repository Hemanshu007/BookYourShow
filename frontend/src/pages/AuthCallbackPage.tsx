import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth";
import * as userApi from "../api/user";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const fragment = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(fragment);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !refreshToken) {
      setError("Google sign-in did not return valid tokens.");
      return;
    }

    setTokens({ access_token: accessToken, refresh_token: refreshToken });

    // Clear the fragment from the URL/history so tokens don't linger there.
    window.history.replaceState(null, "", window.location.pathname);

    userApi
      .getCurrentUser()
      .then((user) => {
        setUser(user);
        navigate("/", { replace: true });
      })
      .catch(() => setError("Could not load your profile. Please try logging in again."));
  }, [navigate, setTokens, setUser]);

  if (error) {
    return (
      <div className="mx-auto max-w-sm text-center">
        <p className="text-[var(--color-brand-500)]">{error}</p>
        <button onClick={() => navigate("/login")} className="btn btn-primary mt-4">
          Back to login
        </button>
      </div>
    );
  }

  return <p className="text-center text-[var(--color-ink-500)]">Signing you in...</p>;
}
