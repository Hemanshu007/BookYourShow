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
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold">Log in</h1>

      {step === "email" ? (
        <form onSubmit={handleSendOtp} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />
          <button
            type="submit"
            disabled={sendOtp.isPending}
            className="w-full rounded-md bg-purple-600 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {sendOtp.isPending ? "Sending..." : "Send OTP"}
          </button>
          {sendOtp.isError && (
            <p className="text-sm text-red-600">{(sendOtp.error as Error).message}</p>
          )}
        </form>
      ) : (
        <form onSubmit={handleSignin} className="space-y-3">
          <p className="text-sm text-neutral-500">OTP sent to {email}</p>
          <input
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="6-digit code"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />
          <button
            type="submit"
            disabled={signin.isPending}
            className="w-full rounded-md bg-purple-600 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {signin.isPending ? "Verifying..." : "Verify & Continue"}
          </button>
          {signin.isError && (
            <p className="text-sm text-red-600">{(signin.error as Error).message}</p>
          )}
        </form>
      )}

      <div className="my-4 flex items-center gap-3 text-xs text-neutral-400">
        <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
        OR
        <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
      </div>

      <a
        href={googleLoginUrl()}
        className="block w-full rounded-md border border-neutral-300 py-2 text-center hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
      >
        Continue with Google
      </a>
    </div>
  );
}
