import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { verifyTicket } from "../../api/theatreAdmin";

export default function TheatreAdminVerifyTicketPage() {
  const [hash, setHash] = useState("");

  const verifyMutation = useMutation({
    mutationFn: () => verifyTicket(hash),
  });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">Verify Ticket</h1>

      <div className="card max-w-md p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            verifyMutation.mutate();
          }}
          className="space-y-3"
        >
          <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-400)]">
            Ticket hash (from QR code)
          </label>
          <textarea
            value={hash}
            onChange={(e) => setHash(e.target.value)}
            className="input min-h-24 font-mono text-xs"
            required
          />
          <button type="submit" disabled={verifyMutation.isPending} className="btn btn-primary w-full">
            {verifyMutation.isPending ? "Verifying..." : "Verify"}
          </button>
        </form>

        {verifyMutation.isSuccess && (
          <p className="mt-4 rounded-lg bg-[var(--color-ok-500)]/10 p-3 text-center text-sm font-semibold text-[var(--color-ok-500)]">
            ✓ Ticket verified — valid entry
          </p>
        )}
        {verifyMutation.isError && (
          <p className="mt-4 rounded-lg bg-[var(--color-brand-500)]/10 p-3 text-center text-sm font-semibold text-[var(--color-brand-500)]">
            {(verifyMutation.error as Error).message || "Invalid ticket"}
          </p>
        )}
      </div>
    </div>
  );
}
