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
      <h1 className="mb-4 text-xl font-semibold">Results for "{q}"</h1>

      {isLoading && <Spinner label="Searching..." />}
      {isError && <p className="text-red-600">Search failed.</p>}
      {data && data.items.length === 0 && (
        <p className="text-neutral-500">No matches found.</p>
      )}

      <div className="space-y-2">
        {data?.items.map((item) => (
          <Link
            key={`${item.type}-${item.id}`}
            to={item.type === "movie" ? `/movies/${item.id}` : `/theatres/${item.id}`}
            className="block rounded-lg border border-neutral-200 p-3 hover:shadow-md dark:border-neutral-800"
          >
            <span className="mr-2 rounded bg-neutral-100 px-2 py-0.5 text-xs uppercase text-neutral-500 dark:bg-neutral-800">
              {item.type}
            </span>
            {item.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
