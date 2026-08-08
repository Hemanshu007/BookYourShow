import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-sm text-center">
      <h1 className="mb-2 text-3xl font-semibold">404</h1>
      <p className="mb-6 text-neutral-500">This page doesn't exist.</p>
      <Link
        to="/"
        className="rounded-md bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
      >
        Back to home
      </Link>
    </div>
  );
}
