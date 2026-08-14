import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createMovie, deleteMovieAdmin, getAllMoviesAdmin } from "../../api/admin";
import { Spinner } from "../../components/Skeleton";

export default function AdminMoviesPage() {
  const queryClient = useQueryClient();
  const { data: movies, isLoading } = useQuery({
    queryKey: ["admin", "movies"],
    queryFn: () => getAllMoviesAdmin(1, 50),
  });

  const [imdbId, setImdbId] = useState("");

  const createMutation = useMutation({
    mutationFn: () => createMovie(imdbId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "movies"] });
      setImdbId("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMovieAdmin(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "movies"] }),
  });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">Movies</h1>

      <div className="card mb-8 p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--color-ink-500)]">Add a movie by IMDB ID</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="flex flex-wrap gap-3"
        >
          <input
            value={imdbId}
            onChange={(e) => setImdbId(e.target.value)}
            placeholder="tt0111161"
            className="input max-w-xs"
            required
          />
          <button type="submit" disabled={createMutation.isPending} className="btn btn-primary">
            {createMutation.isPending ? "Fetching..." : "Add Movie"}
          </button>
        </form>
        {createMutation.isError && (
          <p className="mt-3 text-sm text-[var(--color-brand-500)]">{(createMutation.error as Error).message}</p>
        )}
      </div>

      {isLoading ? (
        <Spinner label="Loading movies..." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-ink-50)] text-left text-xs uppercase tracking-wide text-[var(--color-ink-400)] dark:bg-[var(--color-ink-800)]">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Genre</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {movies?.map((m) => (
                <tr key={m.id} className="border-t border-[var(--color-ink-100)] dark:border-[var(--color-ink-800)]">
                  <td className="px-4 py-3 font-medium">{m.name}</td>
                  <td className="px-4 py-3 text-[var(--color-ink-500)]">{m.genre}</td>
                  <td className="px-4 py-3 text-[var(--color-gold-500)]">★ {m.rating}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deleteMutation.mutate(m.id)}
                      disabled={deleteMutation.isPending}
                      className="text-xs font-semibold text-[var(--color-brand-500)] hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
