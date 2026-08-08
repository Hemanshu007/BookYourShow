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
      className="block rounded-lg border border-neutral-200 p-4 transition-shadow hover:shadow-md dark:border-neutral-800"
    >
      <h3 className="font-medium">{theatre.name}</h3>
      <p className="mt-1 text-sm text-neutral-500">
        {theatre.area}, {theatre.city}
      </p>
    </Link>
  );
}
