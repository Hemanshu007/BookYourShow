import { useMemo } from "react";
import type { ShowLayout } from "../api/types";

interface Props {
  layout: ShowLayout;
  selected: Set<string>;
  onToggleSeat: (seatId: string) => void;
}

export default function SeatGrid({ layout, selected, onToggleSeat }: Props) {
  const { layout: grid, metadata } = layout;

  const seatIdByPosition = useMemo(() => {
    const map = new Map<string, string>();
    for (const [seatId, [r, c]] of Object.entries(layout.seat_mapping)) {
      map.set(`${r},${c}`, seatId);
    }
    return map;
  }, [layout.seat_mapping]);

  return (
    <div>
      <div className="mb-8 flex justify-center">
        <div className="relative h-6 w-4/5 max-w-md">
          <div
            className="absolute inset-0 rounded-[50%] bg-gradient-to-b from-[var(--color-gold-500)]/60 to-transparent"
            style={{ clipPath: "polygon(0% 100%, 100% 100%, 88% 0%, 12% 0%)" }}
          />
          <p className="absolute inset-x-0 -bottom-5 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-ink-400)]">
            Screen
          </p>
        </div>
      </div>

      <div className="mt-10 flex flex-col items-center gap-1.5 overflow-x-auto pb-2">
        {Array.from({ length: metadata.row }).map((_, row) => (
          <div key={row} className="flex gap-1.5">
            {Array.from({ length: metadata.column }).map((_, col) => {
              const cell = grid[row]?.[col];
              if (!cell || cell.grid_type !== "seat") {
                return <div key={col} className="h-7 w-7 shrink-0" />;
              }

              const seatId = seatIdByPosition.get(`${row},${col}`) ?? null;
              const isSelected = seatId ? selected.has(seatId) : false;
              const isBooked = cell.status === "Booked";
              const isLocked = cell.status === "Locked";
              const disabled = isBooked || isLocked;

              return (
                <button
                  key={col}
                  type="button"
                  disabled={disabled}
                  onClick={() => seatId && onToggleSeat(seatId)}
                  aria-label={seatId ?? undefined}
                  title={seatId ? `${seatId} · ${cell.category} · ₹${cell.price}` : ""}
                  className={[
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-t-md rounded-b-sm text-[9px] font-bold transition-all",
                    isBooked && "cursor-not-allowed bg-[var(--color-ink-200)] text-[var(--color-ink-400)] dark:bg-[var(--color-ink-700)] dark:text-[var(--color-ink-500)]",
                    isLocked && "cursor-not-allowed bg-[var(--color-warn-500)]/25 text-[var(--color-warn-500)]",
                    !disabled && isSelected && "scale-110 bg-[var(--color-brand-500)] text-white shadow-md shadow-[var(--color-brand-500)]/30",
                    !disabled && !isSelected && "bg-[var(--color-ok-500)]/12 text-[var(--color-ok-500)] hover:bg-[var(--color-ok-500)]/25",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {seatId}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-5 text-xs text-[var(--color-ink-500)]">
        <Legend swatch="bg-[var(--color-ok-500)]/25" label="Available" />
        <Legend swatch="bg-[var(--color-brand-500)]" label="Selected" />
        <Legend swatch="bg-[var(--color-warn-500)]/40" label="Locked" />
        <Legend swatch="bg-[var(--color-ink-200)] dark:bg-[var(--color-ink-700)]" label="Booked" />
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded ${swatch}`} />
      {label}
    </div>
  );
}
