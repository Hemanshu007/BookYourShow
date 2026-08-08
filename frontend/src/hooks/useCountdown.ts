import { useEffect, useRef, useState } from "react";

export function useCountdown(deadline: number | null) {
  const [remainingMs, setRemainingMs] = useState(0);
  const prevDeadlineRef = useRef<number | null | undefined>(undefined);

  // Adjust state during render when `deadline` changes, rather than in an
  // effect. An effect-based reset runs strictly after commit, so on the very
  // render where `deadline` flips from null to a real timestamp, `remainingMs`
  // would still hold its previous (stale) value for that one render — long
  // enough for a sibling effect reading `expired` to observe a false positive.
  if (deadline !== prevDeadlineRef.current) {
    prevDeadlineRef.current = deadline;
    setRemainingMs(deadline ? Math.max(0, deadline - Date.now()) : 0);
  }

  useEffect(() => {
    if (!deadline) return;
    const id = setInterval(() => {
      setRemainingMs(Math.max(0, deadline - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return {
    remainingMs,
    expired: deadline !== null && remainingMs <= 0,
    label: `${minutes}:${seconds.toString().padStart(2, "0")}`,
  };
}
