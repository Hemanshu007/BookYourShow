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
      <h1 className="mb-4 text-xl font-semibold">Movies at this theatre</h1>

      {isLoading && <CardSkeletonGrid />}
      {isError && <p className="text-red-600">Could not load movies.</p>}
      {movies && movies.length === 0 && (
        <p className="text-neutral-500">No movies currently running here.</p>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {movies?.map((movie) => (
            <Link
              key={movie.id}
              to={`/theatre/${theatreId}/movie/${movie.id}`}
              className="block rounded-lg border border-neutral-200 p-4 transition-shadow hover:shadow-md dark:border-neutral-800"
            >
              <h3 className="font-medium">{movie.name}</h3>
              <p className="mt-1 text-xs text-neutral-500">{movie.genre}</p>
              <p className="mt-2 text-xs text-amber-600">★ {movie.rating}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
