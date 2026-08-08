import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllMovies } from "../api/movies";
import MovieCard from "../components/MovieCard";
import { CardSkeletonGrid } from "../components/Skeleton";

export default function HomePage() {
  const [page, setPage] = useState(1);
  const { data: movies, isLoading, isError } = useQuery({
    queryKey: ["movies", page],
    queryFn: () => getAllMovies(page, 12),
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Now Showing</h1>

      {isLoading && <CardSkeletonGrid />}
      {isError && <p className="text-red-600">Could not load movies.</p>}
      {movies && movies.length === 0 && (
        <p className="text-neutral-500">No movies available right now.</p>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {movies?.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}

      <div className="mt-6 flex justify-center gap-2">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="rounded-md border border-neutral-300 px-3 py-1 text-sm disabled:opacity-40 dark:border-neutral-700"
        >
          Previous
        </button>
        <button
          disabled={!movies || movies.length < 12}
          onClick={() => setPage((p) => p + 1)}
          className="rounded-md border border-neutral-300 px-3 py-1 text-sm disabled:opacity-40 dark:border-neutral-700"
        >
          Next
        </button>
      </div>
    </div>
  );
}
