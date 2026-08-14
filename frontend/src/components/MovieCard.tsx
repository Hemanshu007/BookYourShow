import { Link } from "react-router-dom";
import type { Movie } from "../api/types";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function MovieCard({ movie }: { movie: Movie }) {
  return (
    <Link
      to={`/movies/${movie.id}`}
      className="card group flex flex-col overflow-hidden transition-transform hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex aspect-[2/3] items-center justify-center bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-ink-900)] text-4xl font-black text-white/90">
        {initials(movie.name)}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="font-semibold leading-snug">{movie.name}</h3>
        <p className="text-xs uppercase tracking-wide text-[var(--color-ink-400)]">{movie.genre}</p>
        <p className="line-clamp-2 text-sm text-[var(--color-ink-500)]">{movie.description}</p>
        <div className="mt-auto flex items-center gap-1 pt-2 text-sm font-semibold text-[var(--color-gold-500)]">
          ★ {movie.rating}
        </div>
      </div>
    </Link>
  );
}
