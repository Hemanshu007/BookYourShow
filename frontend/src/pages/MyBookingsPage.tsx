import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUserBookings } from "../api/bookings";
import BookingCard from "../components/BookingCard";
import { CardSkeletonGrid } from "../components/Skeleton";

export default function MyBookingsPage() {
  const [page, setPage] = useState(1);
  const { data: bookings, isLoading, isError } = useQuery({
    queryKey: ["userBookings", page],
    queryFn: () => getUserBookings(page, 10),
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">My Bookings</h1>

      {isLoading && <CardSkeletonGrid count={4} />}
      {isError && <p className="text-red-600">Could not load bookings.</p>}
      {bookings && bookings.length === 0 && (
        <p className="text-neutral-500">You haven't booked any tickets yet.</p>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {bookings?.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}

      <div className="mt-6 flex justify-center gap-2">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="rounded-md border border-neutral-300 px-3 py-1 text-sm disabled:opacity-40 dark:border-neutral-700"
        >
          Previous
        </button>
        <button
          disabled={!bookings || bookings.length < 10}
          onClick={() => setPage((p) => p + 1)}
          className="rounded-md border border-neutral-300 px-3 py-1 text-sm disabled:opacity-40 dark:border-neutral-700"
        >
          Next
        </button>
      </div>
    </div>
  );
}
