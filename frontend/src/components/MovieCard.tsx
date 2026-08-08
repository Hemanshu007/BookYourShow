import { Link } from "react-router-dom";
import type { Movie } from "../api/types";

export default function MovieCard({ movie }: { movie: Movie }) {
  return (
    <Link
      to={`/movies/${movie.id}`}
      className="block rounded-lg border border-neutral-200 p-4 transition-shadow hover:shadow-md dark:border-neutral-800"
    >
      <h3 className="font-medium">{movie.name}</h3>
      <p className="mt-1 text-xs text-neutral-500">{movie.genre}</p>
      <p className="mt-2 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
        {movie.description}
      </p>
      <p className="mt-2 text-xs text-amber-600">★ {movie.rating}</p>
    </Link>
  );
}
