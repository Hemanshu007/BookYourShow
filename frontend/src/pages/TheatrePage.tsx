import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMoviesByTheatre } from "../api/movies";
import { CardSkeletonGrid } from "../components/Skeleton";

export default function TheatrePage() {
  const { theatreId } = useParams<{ theatreId: string }>();

  const { data: movies, isLoading, isError } = useQuery({
    queryKey: ["moviesByTheatre", theatreId],
    queryFn: () => getMoviesByTheatre(theatreId!),
    enabled: Boolean(theatreId),
  });

  return (
    <div>
      <h1 className="mb-5 text-xl font-bold">Movies at this theatre</h1>

      {isLoading && <CardSkeletonGrid />}
      {isError && <p className="text-[var(--color-brand-500)]">Could not load movies.</p>}
      {movies && movies.length === 0 && (
        <p className="text-[var(--color-ink-500)]">No movies currently running here.</p>
      )}

      {!isLoading && (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {movies?.map((movie) => (
            <Link
              key={movie.id}
              to={`/theatre/${theatreId}/movie/${movie.id}`}
              className="card p-4 transition-transform hover:-translate-y-0.5 hover:shadow-lg"
            >
              <h3 className="font-semibold">{movie.name}</h3>
              <p className="mt-1 text-xs uppercase tracking-wide text-[var(--color-ink-400)]">{movie.genre}</p>
              <p className="mt-2 text-sm font-semibold text-[var(--color-gold-500)]">★ {movie.rating}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
