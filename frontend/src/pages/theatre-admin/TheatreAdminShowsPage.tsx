import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createShow, getMyScreens } from "../../api/theatreAdmin";
import { getAllMovies } from "../../api/movies";

export default function TheatreAdminShowsPage() {
  const { data: screens } = useQuery({
    queryKey: ["theatreAdmin", "screens"],
    queryFn: () => getMyScreens(1, 50),
  });
  const { data: movies } = useQuery({
    queryKey: ["movies", "all-for-show"],
    queryFn: () => getAllMovies(1, 50),
  });

  const [screenId, setScreenId] = useState("");
  const [movieId, setMovieId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [prices, setPrices] = useState([{ category: "standard", price: "" }]);
  const [lastShowId, setLastShowId] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () => {
      const categoryPrice: Record<string, number> = {};
      for (const p of prices) {
        if (p.category && p.price) categoryPrice[p.category] = Number(p.price);
      }
      return createShow(screenId, movieId, new Date(startTime).toISOString(), categoryPrice);
    },
    onSuccess: (show) => {
      setLastShowId(show.id);
      setScreenId("");
      setMovieId("");
      setStartTime("");
      setPrices([{ category: "standard", price: "" }]);
    },
  });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">Schedule a Show</h1>

      <div className="card max-w-2xl p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-400)]">Screen</label>
            <select value={screenId} onChange={(e) => setScreenId(e.target.value)} className="input" required>
              <option value="">Select screen...</option>
              {screens?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.theatre_name} — {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-400)]">Movie</label>
            <select value={movieId} onChange={(e) => setMovieId(e.target.value)} className="input" required>
              <option value="">Select movie...</option>
              {movies?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-400)]">Start time</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="input"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-400)]">
              Category pricing
            </label>
            <p className="mb-2 text-xs text-[var(--color-ink-400)]">
              Category names must match what you used in the screen's layout (e.g. standard, premium, recliner).
            </p>
            <div className="space-y-2">
              {prices.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={p.category}
                    onChange={(e) => {
                      const next = [...prices];
                      next[i] = { ...next[i], category: e.target.value };
                      setPrices(next);
                    }}
                    placeholder="category"
                    className="input"
                  />
                  <input
                    value={p.price}
                    onChange={(e) => {
                      const next = [...prices];
                      next[i] = { ...next[i], price: e.target.value };
                      setPrices(next);
                    }}
                    placeholder="price"
                    type="number"
                    className="input"
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPrices([...prices, { category: "", price: "" }])}
              className="mt-2 text-xs font-semibold text-[var(--color-brand-500)] hover:underline"
            >
              + Add category
            </button>
          </div>

          <button type="submit" disabled={createMutation.isPending} className="btn btn-primary">
            {createMutation.isPending ? "Scheduling..." : "Schedule Show"}
          </button>

          {createMutation.isError && (
            <p className="text-sm text-[var(--color-brand-500)]">{(createMutation.error as Error).message}</p>
          )}
          {lastShowId && (
            <p className="rounded-lg bg-[var(--color-ok-500)]/10 p-3 text-sm text-[var(--color-ok-500)]">
              Show scheduled successfully (id: {lastShowId}).
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
