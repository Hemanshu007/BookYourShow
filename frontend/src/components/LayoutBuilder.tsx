import { useState } from "react";
import type { LayoutGridCell, RawLayoutPayload } from "../api/types";

const CATEGORIES = ["standard", "premium", "recliner"] as const;
const CATEGORY_COLORS: Record<string, string> = {
  standard: "bg-[var(--color-ok-500)]/25 text-[var(--color-ok-500)]",
  premium: "bg-[var(--color-gold-500)]/30 text-[var(--color-gold-500)]",
  recliner: "bg-[var(--color-brand-500)]/25 text-[var(--color-brand-500)]",
};

function emptyGrid(rows: number, cols: number): (LayoutGridCell | null)[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ grid_type: "wall" as const, category: null })),
  );
}

function nextCellState(cell: LayoutGridCell | null): LayoutGridCell {
  if (!cell || cell.grid_type === "wall") {
    return { grid_type: "seat", category: "standard" };
  }
  const idx = CATEGORIES.indexOf(cell.category as (typeof CATEGORIES)[number]);
  const next = CATEGORIES[idx + 1];
  if (!next) return { grid_type: "wall", category: null };
  return { grid_type: "seat", category: next };
}

export default function LayoutBuilder({
  onChange,
}: {
  onChange: (payload: RawLayoutPayload) => void;
}) {
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(6);
  const [grid, setGrid] = useState<(LayoutGridCell | null)[][]>(() => emptyGrid(4, 6));

  function resize(newRows: number, newCols: number) {
    setRows(newRows);
    setCols(newCols);
    const next = emptyGrid(newRows, newCols);
    for (let r = 0; r < Math.min(newRows, grid.length); r++) {
      for (let c = 0; c < Math.min(newCols, grid[r].length); c++) {
        next[r][c] = grid[r][c];
      }
    }
    setGrid(next);
    onChange({ layout: next, metadata: { grid_rows: newRows, grid_columns: newCols } });
  }

  function toggleCell(r: number, c: number) {
    const next = grid.map((row) => [...row]);
    next[r][c] = nextCellState(next[r][c]);
    setGrid(next);
    onChange({ layout: next, metadata: { grid_rows: rows, grid_columns: cols } });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-400)]">Rows</label>
          <input
            type="number"
            min={1}
            max={12}
            value={rows}
            onChange={(e) => resize(Number(e.target.value) || 1, cols)}
            className="input w-20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-400)]">Columns</label>
          <input
            type="number"
            min={1}
            max={20}
            value={cols}
            onChange={(e) => resize(rows, Number(e.target.value) || 1)}
            className="input w-20"
          />
        </div>
        <p className="text-xs text-[var(--color-ink-400)]">
          Click a cell to cycle: wall → standard → premium → recliner → wall
        </p>
      </div>

      <div className="inline-flex flex-col gap-1 rounded-xl border border-[var(--color-ink-100)] bg-[var(--color-ink-50)] p-4 dark:border-[var(--color-ink-700)] dark:bg-[var(--color-ink-800)]">
        {grid.map((row, r) => (
          <div key={r} className="flex gap-1">
            {row.map((cell, c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleCell(r, c)}
                className={[
                  "h-7 w-7 rounded text-[8px] font-bold uppercase transition-colors",
                  cell?.grid_type === "seat"
                    ? CATEGORY_COLORS[cell.category ?? "standard"]
                    : "bg-[var(--color-ink-200)] dark:bg-[var(--color-ink-700)]",
                ].join(" ")}
              >
                {cell?.grid_type === "seat" ? cell.category?.[0] : ""}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-4 text-xs text-[var(--color-ink-500)]">
        {CATEGORIES.map((cat) => (
          <div key={cat} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded ${CATEGORY_COLORS[cat]}`} />
            {cat}
          </div>
        ))}
      </div>
    </div>
  );
}
