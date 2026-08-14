import { Link } from "react-router-dom";
import type { BookingSummary } from "../api/types";

export default function BookingCard({ booking }: { booking: BookingSummary }) {
  const showTime = new Date(booking.show_time);
  const isPast = showTime.getTime() < Date.now();

  return (
    <Link to={`/bookings/${booking.id}`} className="card flex overflow-hidden transition-transform hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex w-20 shrink-0 flex-col items-center justify-center border-r border-[var(--color-ink-100)] bg-[var(--color-ink-50)] dark:border-[var(--color-ink-700)] dark:bg-[var(--color-ink-800)]">
        <span className="text-xs font-semibold uppercase text-[var(--color-ink-400)]">
          {showTime.toLocaleDateString(undefined, { month: "short" })}
        </span>
        <span className="text-2xl font-bold tabular-nums">{showTime.getDate()}</span>
      </div>

      <div className="flex-1 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold">{booking.movie_name}</h3>
          {booking.is_cancelled ? (
            <span className="badge badge-danger">Cancelled</span>
          ) : isPast ? (
            <span className="badge badge-neutral">Watched</span>
          ) : (
            <span className="badge badge-ok">Upcoming</span>
          )}
        </div>
        <p className="mt-1 text-sm text-[var(--color-ink-500)]">
          {booking.theatre_name} · {booking.screen_name}
        </p>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-[var(--color-ink-400)]">{booking.number_of_seats} seat(s)</span>
          <span className="font-semibold tabular-nums">₹{booking.total_bill}</span>
        </div>
      </div>
    </Link>
  );
}
