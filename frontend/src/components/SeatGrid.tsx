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
      <div className="mb-4 flex justify-center">
        <div className="w-2/3 rounded-t-full bg-neutral-300 py-1 text-center text-xs text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
          SCREEN
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
        {Array.from({ length: metadata.row }).map((_, row) => (
          <div key={row} className="flex gap-1">
            {Array.from({ length: metadata.column }).map((_, col) => {
              const cell = grid[row]?.[col];
              if (!cell || cell.grid_type !== "seat") {
                return <div key={col} className="h-7 w-7" />;
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
                    "h-7 w-7 rounded text-[10px] font-medium transition-colors",
                    isBooked && "cursor-not-allowed bg-neutral-300 text-neutral-400 dark:bg-neutral-700",
                    isLocked && "cursor-not-allowed bg-amber-200 text-amber-700 dark:bg-amber-900 dark:text-amber-400",
                    !disabled && isSelected && "bg-purple-600 text-white",
                    !disabled && !isSelected && "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300",
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

      <div className="mt-6 flex justify-center gap-6 text-xs text-neutral-500">
        <Legend swatch="bg-emerald-100 dark:bg-emerald-950" label="Available" />
        <Legend swatch="bg-purple-600" label="Selected" />
        <Legend swatch="bg-amber-200 dark:bg-amber-900" label="Locked" />
        <Legend swatch="bg-neutral-300 dark:bg-neutral-700" label="Booked" />
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
