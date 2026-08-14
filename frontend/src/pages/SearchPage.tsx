import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { search } from "../api/search";
import { Spinner } from "../components/Skeleton";

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get("q") ?? "";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["search", q],
    queryFn: () => search(q, 20),
    enabled: Boolean(q),
  });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">Results for "{q}"</h1>

      {isLoading && <Spinner label="Searching..." />}
      {isError && <p className="text-[var(--color-brand-500)]">Search failed.</p>}
      {data && data.items.length === 0 && (
        <p className="text-[var(--color-ink-500)]">No matches found.</p>
      )}

      <div className="space-y-2">
        {data?.items.map((item) => (
          <Link
            key={`${item.type}-${item.id}`}
            to={item.type === "movie" ? `/movies/${item.id}` : `/theatres/${item.id}`}
            className="card flex items-center gap-3 p-4 transition-transform hover:-translate-y-0.5 hover:shadow-lg"
          >
            <span className="badge badge-neutral">{item.type}</span>
            <span className="font-medium">{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
