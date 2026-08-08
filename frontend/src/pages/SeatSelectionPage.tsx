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
      <div className="mx-auto max-w-md text-center">
        <p className="mb-4 text-neutral-600 dark:text-neutral-400">
          Log in to select seats and book tickets.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="rounded-md bg-purple-600 px-4 py-2 text-white"
        >
          Log in
        </button>
      </div>
    );
  }

  if (isLoading) return <Spinner label="Loading seat layout..." />;
  if (isError || !layout) return <p className="text-red-600">Could not load seat layout.</p>;

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
          {error}
        </p>
      )}

      <SeatGrid layout={layout} selected={selected} onToggleSeat={toggleSeat} />

      <div className="sticky bottom-0 mt-6 flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div>
          <p className="text-sm text-neutral-500">
            {selected.size} seat(s) selected
          </p>
          <p className="text-lg font-semibold">₹{totalPrice}</p>
          {phase === "locked" && (
            <p className="text-xs text-amber-600">Locked — complete within {countdown.label}</p>
          )}
        </div>

        {phase === "selecting" ? (
          <button
            disabled={selected.size === 0 || lockMutation.isPending}
            onClick={() => lockMutation.mutate()}
            className="rounded-md bg-purple-600 px-5 py-2 text-white disabled:opacity-40"
          >
            {lockMutation.isPending ? "Locking..." : "Lock Seats"}
          </button>
        ) : (
          <button
            disabled={bookMutation.isPending}
            onClick={() => bookMutation.mutate()}
            className="rounded-md bg-emerald-600 px-5 py-2 text-white disabled:opacity-40"
          >
            {bookMutation.isPending ? "Booking..." : "Confirm & Pay"}
          </button>
        )}
      </div>
    </div>
  );
}
