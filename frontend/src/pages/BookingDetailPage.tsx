import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cancelBooking, getBookingDetail } from "../api/bookings";
import { Spinner } from "../components/Skeleton";

export default function BookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const queryClient = useQueryClient();
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const { data: booking, isLoading, isError } = useQuery({
    queryKey: ["bookingDetail", bookingId],
    queryFn: () => getBookingDetail(bookingId!),
    enabled: Boolean(bookingId),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelBooking(bookingId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookingDetail", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["userBookings"] });
      setConfirmingCancel(false);
    },
  });

  if (isLoading) return <Spinner label="Loading booking..." />;
  if (isError || !booking) return <p className="text-red-600">Booking not found.</p>;

  return (
    <div className="mx-auto max-w-lg rounded-lg border border-neutral-200 p-6 dark:border-neutral-800">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{booking.movie_name}</h1>
        {booking.is_cancelled && (
          <span className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 dark:bg-red-950 dark:text-red-400">
            Cancelled
          </span>
        )}
      </div>

      <dl className="space-y-2 text-sm">
        <Row label="Theatre" value={`${booking.theatre_name} · ${booking.screen_name}`} />
        <Row label="Show time" value={new Date(booking.show_time).toLocaleString()} />
        <Row label="Seats" value={booking.seats.join(", ")} />
        <Row label="Total paid" value={`₹${booking.total_bill}`} />
      </dl>

      {!booking.is_cancelled && (
        <div className="mt-6">
          {confirmingCancel ? (
            <div className="flex gap-2">
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="rounded-md bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {cancelMutation.isPending ? "Cancelling..." : "Yes, cancel booking"}
              </button>
              <button
                onClick={() => setConfirmingCancel(false)}
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700"
              >
                Keep booking
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingCancel(true)}
              className="rounded-md border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
            >
              Cancel booking
            </button>
          )}
          {cancelMutation.isError && (
            <p className="mt-2 text-sm text-red-600">
              {(cancelMutation.error as Error).message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-neutral-100 pb-2 dark:border-neutral-800">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
