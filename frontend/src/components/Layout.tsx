import { Link, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuthStore } from "../stores/auth";
import { useLogout } from "../hooks/useAuth";

export default function Layout() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  const roleHome =
    user?.role === "admin" ? "/admin" : user?.role === "theatre_admin" ? "/theatre-admin" : null;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-[var(--color-ink-800)]/10 bg-[var(--color-ink-950)] text-[var(--color-ink-100)] dark:border-[var(--color-ink-800)]">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3.5">
          <Link to="/" className="flex items-center gap-1.5 text-lg font-extrabold tracking-tight">
            <span className="text-[var(--color-brand-500)]">Book</span>
            <span>YourShow</span>
          </Link>

          <form onSubmit={handleSearch} className="hidden flex-1 sm:block">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies or theatres..."
              className="w-full max-w-md rounded-full border border-[var(--color-ink-700)] bg-[var(--color-ink-900)] px-4 py-1.5 text-sm text-[var(--color-ink-100)] placeholder:text-[var(--color-ink-400)] outline-none focus:border-[var(--color-brand-500)]"
            />
          </form>

          <nav className="ml-auto flex items-center gap-3 text-sm">
            {roleHome && (
              <Link to={roleHome} className="hidden font-medium text-[var(--color-ink-200)] hover:text-white sm:inline">
                {user?.role === "admin" ? "Admin" : "Theatre Admin"}
              </Link>
            )}
            {user ? (
              <>
                <Link to="/my-bookings" className="hidden font-medium text-[var(--color-ink-200)] hover:text-white sm:inline">
                  My Bookings
                </Link>
                <Link to="/profile" className="font-medium text-[var(--color-ink-200)] hover:text-white">
                  {user.user_detail?.first_name ?? user.email.split("@")[0]}
                </Link>
                <button onClick={logout} className="btn btn-ghost !border-[var(--color-ink-700)] !text-[var(--color-ink-200)] hover:!bg-[var(--color-ink-800)]">
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn-primary">
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
