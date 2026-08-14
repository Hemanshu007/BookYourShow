import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createUser, getAllUsers } from "../../api/admin";
import { sendOtp } from "../../api/auth";
import { Spinner } from "../../components/Skeleton";

type Role = "admin" | "theatre_admin" | "user";

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => getAllUsers(1, 50),
  });

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [role, setRole] = useState<Role>("theatre_admin");
  const [otpSent, setOtpSent] = useState(false);

  const sendOtpMutation = useMutation({
    mutationFn: () => sendOtp(email),
    onSuccess: () => setOtpSent(true),
  });

  const createMutation = useMutation({
    mutationFn: () => createUser(email, otp, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setEmail("");
      setOtp("");
      setOtpSent(false);
    },
  });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">Users</h1>

      <div className="card mb-8 p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--color-ink-500)]">Create a new user</h2>
        <p className="mb-4 text-xs text-[var(--color-ink-400)]">
          The person must enter the OTP sent to their email — this creates the account with the role you assign.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-400)]">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="person@example.com"
              className="input"
            />
          </div>
          {!otpSent ? (
            <button
              onClick={() => sendOtpMutation.mutate()}
              disabled={!email || sendOtpMutation.isPending}
              className="btn btn-ghost"
            >
              {sendOtpMutation.isPending ? "Sending..." : "Send OTP"}
            </button>
          ) : (
            <>
              <div className="w-32">
                <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-400)]">OTP</label>
                <input value={otp} onChange={(e) => setOtp(e.target.value)} className="input" maxLength={6} />
              </div>
              <div className="w-40">
                <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-400)]">Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="input">
                  <option value="user">User</option>
                  <option value="theatre_admin">Theatre Admin</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!otp || createMutation.isPending}
                className="btn btn-primary"
              >
                {createMutation.isPending ? "Creating..." : "Create User"}
              </button>
            </>
          )}
        </div>
        {(sendOtpMutation.isError || createMutation.isError) && (
          <p className="mt-3 text-sm text-[var(--color-brand-500)]">
            {((sendOtpMutation.error ?? createMutation.error) as Error).message}
          </p>
        )}
      </div>

      {isLoading ? (
        <Spinner label="Loading users..." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-ink-50)] text-left text-xs uppercase tracking-wide text-[var(--color-ink-400)] dark:bg-[var(--color-ink-800)]">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => (
                <tr key={u.id} className="border-t border-[var(--color-ink-100)] dark:border-[var(--color-ink-800)]">
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="badge badge-neutral">{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    {u.is_active ? (
                      <span className="badge badge-ok">Active</span>
                    ) : (
                      <span className="badge badge-danger">Inactive</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
