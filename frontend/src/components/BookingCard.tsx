import { Link } from "react-router-dom";
import type { BookingSummary } from "../api/types";

export default function BookingCard({ booking }: { booking: BookingSummary }) {
  return (
    <Link
      to={`/bookings/${booking.id}`}
      className="block rounded-lg border border-neutral-200 p-4 transition-shadow hover:shadow-md dark:border-neutral-800"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{booking.movie_name}</h3>
        {booking.is_cancelled && (
          <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700 dark:bg-red-950 dark:text-red-400">
            Cancelled
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-neutral-500">
        {booking.theatre_name} · {booking.screen_name}
      </p>
      <p className="mt-1 text-sm text-neutral-500">
        {new Date(booking.show_time).toLocaleString()}
      </p>
      <p className="mt-2 text-sm">
        {booking.number_of_seats} seat(s) · ₹{booking.total_bill}
      </p>
    </Link>
  );
}
