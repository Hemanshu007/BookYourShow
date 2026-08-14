import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getShows } from "../api/shows";
import { Spinner } from "../components/Skeleton";

export default function ShowsPage() {
  const { theatreId, movieId } = useParams<{ theatreId: string; movieId: string }>();

  const { data: shows, isLoading, isError } = useQuery({
    queryKey: ["shows", theatreId, movieId],
    queryFn: () => getShows(theatreId!, movieId!),
    enabled: Boolean(theatreId && movieId),
  });

  return (
    <div>
      <h1 className="text-xl font-bold">{shows?.[0]?.movie_name ?? "Shows"}</h1>
      <p className="mb-6 text-sm text-[var(--color-ink-500)]">{shows?.[0]?.theatre_name ?? ""}</p>

      {isLoading && <Spinner label="Loading shows..." />}
      {isError && <p className="text-[var(--color-brand-500)]">Could not load shows.</p>}
      {shows && shows.length === 0 && (
        <p className="text-[var(--color-ink-500)]">No upcoming shows for this movie here.</p>
      )}

      <div className="flex flex-wrap gap-3">
        {shows?.map((show) => (
          <Link
            key={show.id}
            to={`/shows/${show.id}`}
            className="card min-w-[130px] px-5 py-3 text-center transition-transform hover:-translate-y-0.5 hover:border-[var(--color-brand-500)] hover:shadow-lg"
          >
            <div className="font-bold">
              {new Date(show.start_time).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </div>
            <div className="text-lg font-extrabold text-[var(--color-brand-500)]">
              {new Date(show.start_time).toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
              })}
            </div>
            <div className="text-xs text-[var(--color-ink-400)]">{show.screen_name}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
