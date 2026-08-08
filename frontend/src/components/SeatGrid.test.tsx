import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SeatGrid from "./SeatGrid";
import type { ShowLayout } from "../api/types";

function buildLayout(overrides?: Partial<Record<string, string>>): ShowLayout {
  const status = { A1: "Available", A2: "Locked", A3: "Booked", ...overrides };
  return {
    layout: [
      [
        { grid_type: "seat", category: "recliner", price: 400, status: status.A1 as never },
        { grid_type: "seat", category: "recliner", price: 400, status: status.A2 as never },
        { grid_type: "seat", category: "recliner", price: 400, status: status.A3 as never },
      ],
    ],
    metadata: { row: 1, column: 3, total_seats: 3 },
    category_pricing: { recliner: 400 },
    seat_mapping: { A1: [0, 0], A2: [0, 1], A3: [0, 2] },
  };
}

describe("SeatGrid", () => {
  it("renders each seat with its label", () => {
    render(<SeatGrid layout={buildLayout()} selected={new Set()} onToggleSeat={vi.fn()} />);
    expect(screen.getByRole("button", { name: "A1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "A2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "A3" })).toBeInTheDocument();
  });

  it("disables locked and booked seats but not available ones", () => {
    render(<SeatGrid layout={buildLayout()} selected={new Set()} onToggleSeat={vi.fn()} />);
    expect(screen.getByRole("button", { name: "A1" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "A2" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "A3" })).toBeDisabled();
  });

  it("calls onToggleSeat with the seat id when an available seat is clicked", async () => {
    const onToggleSeat = vi.fn();
    const user = userEvent.setup();
    render(<SeatGrid layout={buildLayout()} selected={new Set()} onToggleSeat={onToggleSeat} />);

    await user.click(screen.getByRole("button", { name: "A1" }));

    expect(onToggleSeat).toHaveBeenCalledWith("A1");
    expect(onToggleSeat).toHaveBeenCalledTimes(1);
  });

  it("does not call onToggleSeat when a locked seat is clicked", async () => {
    const onToggleSeat = vi.fn();
    const user = userEvent.setup();
    render(<SeatGrid layout={buildLayout()} selected={new Set()} onToggleSeat={onToggleSeat} />);

    await user.click(screen.getByRole("button", { name: "A2" }));

    expect(onToggleSeat).not.toHaveBeenCalled();
  });
});
