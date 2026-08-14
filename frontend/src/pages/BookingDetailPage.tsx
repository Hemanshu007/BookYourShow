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
  if (isError || !booking) return <p className="text-[var(--color-brand-500)]">Booking not found.</p>;

  return (
    <div className="mx-auto max-w-lg">
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-br from-[var(--color-ink-950)] to-[var(--color-brand-600)] p-6 text-white">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-gold-400)]">
              {booking.is_cancelled ? "Cancelled" : "E-Ticket"}
            </p>
            {!booking.is_cancelled && <span className="badge badge-ok">Confirmed</span>}
          </div>
          <h1 className="mt-2 text-2xl font-extrabold">{booking.movie_name}</h1>
        </div>

        <div className="space-y-3 p-6 text-sm">
          <Row label="Theatre" value={`${booking.theatre_name} · ${booking.screen_name}`} />
          <Row label="Show time" value={new Date(booking.show_time).toLocaleString()} />
          <Row label="Seats" value={booking.seats.join(", ")} />
          <div className="flex justify-between border-t border-dashed border-[var(--color-ink-100)] pt-3 dark:border-[var(--color-ink-700)]">
            <span className="font-semibold">Total paid</span>
            <span className="text-lg font-extrabold tabular-nums">₹{booking.total_bill}</span>
          </div>
        </div>

        {!booking.is_cancelled && (
          <div className="border-t border-[var(--color-ink-100)] p-6 dark:border-[var(--color-ink-700)]">
            {confirmingCancel ? (
              <div className="flex gap-2">
                <button
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                  className="btn btn-primary"
                >
                  {cancelMutation.isPending ? "Cancelling..." : "Yes, cancel booking"}
                </button>
                <button onClick={() => setConfirmingCancel(false)} className="btn btn-ghost">
                  Keep booking
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmingCancel(true)} className="btn btn-danger">
                Cancel booking
              </button>
            )}
            {cancelMutation.isError && (
              <p className="mt-2 text-sm text-[var(--color-brand-500)]">
                {(cancelMutation.error as Error).message}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-[var(--color-ink-500)]">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
