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
      <h1 className="mb-4 text-xl font-semibold">
        {shows?.[0]?.movie_name ?? "Shows"} at {shows?.[0]?.theatre_name ?? ""}
      </h1>

      {isLoading && <Spinner label="Loading shows..." />}
      {isError && <p className="text-red-600">Could not load shows.</p>}
      {shows && shows.length === 0 && (
        <p className="text-neutral-500">No upcoming shows for this movie here.</p>
      )}

      <div className="flex flex-wrap gap-3">
        {shows?.map((show) => (
          <Link
            key={show.id}
            to={`/shows/${show.id}`}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm hover:border-purple-500 hover:text-purple-600 dark:border-neutral-700"
          >
            <div className="font-medium">
              {new Date(show.start_time).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </div>
            <div>
              {new Date(show.start_time).toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
              })}
            </div>
            <div className="text-xs text-neutral-500">{show.screen_name}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
