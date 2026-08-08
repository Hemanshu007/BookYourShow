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

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
          <Link to="/" className="text-lg font-semibold text-purple-600">
            BookYourShow
          </Link>

          <form onSubmit={handleSearch} className="flex-1">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies or theatres..."
              className="w-full max-w-md rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-purple-500 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </form>

          <nav className="flex items-center gap-4 text-sm">
            {user ? (
              <>
                <Link to="/my-bookings" className="hover:text-purple-600">
                  My Bookings
                </Link>
                <Link to="/profile" className="hover:text-purple-600">
                  {user.user_detail?.first_name ?? user.email}
                </Link>
                <button
                  onClick={logout}
                  className="rounded-md border border-neutral-300 px-3 py-1 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-md bg-purple-600 px-3 py-1.5 text-white hover:bg-purple-700"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
