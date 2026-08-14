import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-sm py-16 text-center">
      <p className="text-6xl font-black text-[var(--color-brand-500)]">404</p>
      <p className="mb-6 mt-2 text-[var(--color-ink-500)]">This page doesn't exist.</p>
      <Link to="/" className="btn btn-primary">
        Back to home
      </Link>
    </div>
  );
}
