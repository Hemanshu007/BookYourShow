import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSendOtp, useSignin } from "../hooks/useAuth";
import { googleLoginUrl } from "../api/auth";

export default function LoginPage() {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();

  const sendOtp = useSendOtp();
  const signin = useSignin();

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    await sendOtp.mutateAsync(email);
    setStep("otp");
  }

  async function handleSignin(e: React.FormEvent) {
    e.preventDefault();
    await signin.mutateAsync({ email, otp });
    navigate("/");
  }

  return (
    <div className="mx-auto max-w-sm py-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-extrabold">Welcome back</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-500)]">
          Sign in to book your next show
        </p>
      </div>

      <div className="card p-6">
        {step === "email" ? (
          <form onSubmit={handleSendOtp} className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-400)]">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input"
            />
            <button type="submit" disabled={sendOtp.isPending} className="btn btn-primary w-full">
              {sendOtp.isPending ? "Sending..." : "Send OTP"}
            </button>
            {sendOtp.isError && (
              <p className="text-sm text-[var(--color-brand-500)]">{(sendOtp.error as Error).message}</p>
            )}
          </form>
        ) : (
          <form onSubmit={handleSignin} className="space-y-3">
            <p className="text-sm text-[var(--color-ink-500)]">OTP sent to <strong>{email}</strong></p>
            <input
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="6-digit code"
              className="input text-center text-lg tracking-[0.3em]"
              maxLength={6}
            />
            <button type="submit" disabled={signin.isPending} className="btn btn-primary w-full">
              {signin.isPending ? "Verifying..." : "Verify & Continue"}
            </button>
            {signin.isError && (
              <p className="text-sm text-[var(--color-brand-500)]">{(signin.error as Error).message}</p>
            )}
          </form>
        )}

        <div className="my-5 flex items-center gap-3 text-xs text-[var(--color-ink-400)]">
          <div className="h-px flex-1 bg-[var(--color-ink-100)] dark:bg-[var(--color-ink-700)]" />
          OR
          <div className="h-px flex-1 bg-[var(--color-ink-100)] dark:bg-[var(--color-ink-700)]" />
        </div>

        <a href={googleLoginUrl()} className="btn btn-ghost w-full">
          Continue with Google
        </a>
      </div>
    </div>
  );
}
