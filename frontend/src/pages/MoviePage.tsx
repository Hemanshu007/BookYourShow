import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getTheatresByMovie } from "../api/movies";
import TheatreCard from "../components/TheatreCard";
import { CardSkeletonGrid } from "../components/Skeleton";

export default function MoviePage() {
  const { movieId } = useParams<{ movieId: string }>();

  const { data: theatres, isLoading, isError } = useQuery({
    queryKey: ["theatresByMovie", movieId],
    queryFn: () => getTheatresByMovie(movieId!),
    enabled: Boolean(movieId),
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Theatres screening this movie</h1>

      {isLoading && <CardSkeletonGrid count={3} />}
      {isError && <p className="text-red-600">Could not load theatres.</p>}
      {theatres && theatres.length === 0 && (
        <p className="text-neutral-500">No theatres are screening this movie right now.</p>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {theatres?.map((theatre) => (
            <TheatreCard
              key={theatre.id}
              theatre={theatre}
              linkTo={`/theatre/${theatre.id}/movie/${movieId}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
