import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getShowById, lockSeats, bookSeats } from "../api/shows";
import { useAuthStore } from "../stores/auth";
import { useCountdown } from "../hooks/useCountdown";
import SeatGrid from "../components/SeatGrid";
import { Spinner } from "../components/Skeleton";

const LOCK_DURATION_MS = 10 * 60 * 1000;

type Phase = "selecting" | "locked";

export default function SeatSelectionPage() {
  const { showId } = useParams<{ showId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  const [phase, setPhase] = useState<Phase>("selecting");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lockDeadline, setLockDeadline] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: layout, isLoading, isError } = useQuery({
    queryKey: ["showLayout", showId],
    queryFn: () => getShowById(showId!),
    enabled: Boolean(showId),
    // Kept conservative: the backend's rate limiter is a single per-IP bucket
    // shared across every endpoint (capacity 10, refill 0.1/s), so polling much
    // faster than this would starve the user's other requests during normal use.
    refetchInterval: phase === "selecting" ? 20000 : false,
  });

  const countdown = useCountdown(phase === "locked" ? lockDeadline : null);

  const totalPrice = useMemo(() => {
    if (!layout) return 0;
    let sum = 0;
    for (const seatId of selected) {
      const pos = layout.seat_mapping[seatId];
      if (!pos) continue;
      const cell = layout.layout[pos[0]]?.[pos[1]];
      sum += cell?.price ?? 0;
    }
    return sum;
  }, [layout, selected]);

  const lockMutation = useMutation({
    mutationFn: () => lockSeats(showId!, Array.from(selected)),
    onSuccess: () => {
      setLockDeadline(Date.now() + LOCK_DURATION_MS);
      setPhase("locked");
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
      queryClient.invalidateQueries({ queryKey: ["showLayout", showId] });
    },
  });

  const bookMutation = useMutation({
    mutationFn: () => bookSeats(showId!, Array.from(selected)),
    onSuccess: (result) => {
      navigate(`/bookings/${result.booking_id}`);
    },
    onError: (err: Error) => {
      setError(err.message);
      setPhase("selecting");
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ["showLayout", showId] });
    },
  });

  useEffect(() => {
    if (countdown.expired && phase === "locked") {
      setPhase("selecting");
      setSelected(new Set());
      setLockDeadline(null);
      setError("Your seat lock expired. Please select seats again.");
      queryClient.invalidateQueries({ queryKey: ["showLayout", showId] });
    }
  }, [countdown.expired, phase, queryClient, showId]);

  function toggleSeat(seatId: string) {
    if (phase !== "selecting") return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(seatId)) next.delete(seatId);
      else next.add(seatId);
      return next;
    });
  }

  if (!accessToken) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <p className="mb-4 text-[var(--color-ink-500)]">
          Log in to select seats and book tickets.
        </p>
        <button onClick={() => navigate("/login")} className="btn btn-primary">
          Log in
        </button>
      </div>
    );
  }

  if (isLoading) return <Spinner label="Loading seat layout..." />;
  if (isError || !layout) return <p className="text-[var(--color-brand-500)]">Could not load seat layout.</p>;

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-lg bg-[var(--color-brand-500)]/10 p-3 text-sm text-[var(--color-brand-500)]">
          {error}
        </p>
      )}

      <div className="card p-6 sm:p-10">
        <SeatGrid layout={layout} selected={selected} onToggleSeat={toggleSeat} />
      </div>

      <div className="sticky bottom-4 mt-6 flex items-center justify-between rounded-xl border border-[var(--color-ink-100)] bg-white/95 p-4 shadow-lg backdrop-blur dark:border-[var(--color-ink-700)] dark:bg-[var(--color-ink-900)]/95">
        <div>
          <p className="text-sm text-[var(--color-ink-500)]">
            {selected.size} seat(s) selected
          </p>
          <p className="text-xl font-extrabold tabular-nums">₹{totalPrice}</p>
          {phase === "locked" && (
            <p className="text-xs font-semibold text-[var(--color-warn-500)]">
              Locked — complete within {countdown.label}
            </p>
          )}
        </div>

        {phase === "selecting" ? (
          <button
            disabled={selected.size === 0 || lockMutation.isPending}
            onClick={() => lockMutation.mutate()}
            className="btn btn-primary px-6 py-2.5"
          >
            {lockMutation.isPending ? "Locking..." : "Lock Seats"}
          </button>
        ) : (
          <button
            disabled={bookMutation.isPending}
            onClick={() => bookMutation.mutate()}
            className="btn px-6 py-2.5 text-white"
            style={{ background: "var(--color-ok-500)" }}
          >
            {bookMutation.isPending ? "Booking..." : "Confirm & Pay"}
          </button>
        )}
      </div>
    </div>
  );
}
