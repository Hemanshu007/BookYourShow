import { useQuery } from "@tanstack/react-query";
import { getMyTheatres } from "../../api/theatreAdmin";
import { Spinner } from "../../components/Skeleton";

export default function TheatreAdminTheatresPage() {
  const { data: theatres, isLoading, isError } = useQuery({
    queryKey: ["theatreAdmin", "theatres"],
    queryFn: () => getMyTheatres(1, 50),
  });

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">My Theatres</h1>
      <p className="mb-6 text-sm text-[var(--color-ink-500)]">
        Theatres are registered by a platform admin and assigned to you as the operator.
      </p>

      {isLoading && <Spinner label="Loading theatres..." />}
      {isError && <p className="text-[var(--color-brand-500)]">Could not load theatres.</p>}
      {theatres && theatres.length === 0 && (
        <p className="text-[var(--color-ink-500)]">No theatres are assigned to you yet.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {theatres?.map((t) => (
          <div key={t.id} className="card p-4">
            <h3 className="font-semibold">{t.name}</h3>
            <p className="text-sm text-[var(--color-ink-500)]">
              {t.area}, {t.city}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
