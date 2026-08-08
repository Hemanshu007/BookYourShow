import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCountdown } from "./useCountdown";

describe("useCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("is not expired while deadline is null", () => {
    const { result } = renderHook(() => useCountdown(null));
    expect(result.current.expired).toBe(false);
  });

  it("reflects a fresh deadline immediately, without waiting for a tick", () => {
    // Regression test: the deadline transitioning from null to a real
    // timestamp must not report `expired: true` for even one render, since
    // that falsely resets an in-progress seat lock the instant it's acquired.
    const deadline = Date.now() + 10 * 60 * 1000;
    const { result } = renderHook(() => useCountdown(deadline));

    expect(result.current.expired).toBe(false);
    expect(result.current.label).toBe("10:00");
  });

  it("counts down and expires once the deadline passes", () => {
    const deadline = Date.now() + 5000;
    const { result } = renderHook(() => useCountdown(deadline));

    expect(result.current.expired).toBe(false);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.expired).toBe(false);
    expect(result.current.remainingMs).toBeLessThanOrEqual(2000);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.expired).toBe(true);
  });

  it("resets correctly when the deadline changes to a new value", () => {
    const { result, rerender } = renderHook(
      ({ deadline }) => useCountdown(deadline),
      { initialProps: { deadline: Date.now() + 1000 } },
    );

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.expired).toBe(true);

    const newDeadline = Date.now() + 10 * 60 * 1000;
    rerender({ deadline: newDeadline });

    // Must reflect the new deadline right away, not carry over the previous
    // expired state.
    expect(result.current.expired).toBe(false);
  });
});
