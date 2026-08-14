import { Link } from "react-router-dom";
import type { Theatre } from "../api/types";

export default function TheatreCard({
  theatre,
  linkTo,
}: {
  theatre: Theatre;
  linkTo: string;
}) {
  return (
    <Link
      to={linkTo}
      className="card flex items-center gap-4 p-4 transition-transform hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand-500)]/10 text-lg text-[var(--color-brand-500)]">
        🎬
      </div>
      <div>
        <h3 className="font-semibold">{theatre.name}</h3>
        <p className="text-sm text-[var(--color-ink-500)]">
          {theatre.area}, {theatre.city}
        </p>
      </div>
    </Link>
  );
}
