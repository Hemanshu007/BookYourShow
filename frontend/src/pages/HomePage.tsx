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
      <section className="mb-10 overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-ink-950)] via-[var(--color-ink-900)] to-[var(--color-brand-600)] px-8 py-14 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-gold-400)]">
          Now Booking
        </p>
        <h1 className="mt-2 max-w-lg text-4xl font-extrabold leading-tight sm:text-5xl">
          Your seat is waiting.
        </h1>
        <p className="mt-3 max-w-md text-[var(--color-ink-200)]">
          Browse what's playing, lock your seats in real time, and book in seconds.
        </p>
      </section>

      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold">Now Showing</h2>
      </div>

      {isLoading && <CardSkeletonGrid />}
      {isError && <p className="text-[var(--color-brand-500)]">Could not load movies.</p>}
      {movies && movies.length === 0 && (
        <p className="text-[var(--color-ink-500)]">No movies available right now.</p>
      )}

      {!isLoading && (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {movies?.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}

      <div className="mt-8 flex justify-center gap-2">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="btn btn-ghost"
        >
          Previous
        </button>
        <button
          disabled={!movies || movies.length < 12}
          onClick={() => setPage((p) => p + 1)}
          className="btn btn-ghost"
        >
          Next
        </button>
      </div>
    </div>
  );
}
