import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useCurrentUser, useLogout } from "../hooks/useAuth";
import { deleteAccount } from "../api/user";
import { Spinner } from "../components/Skeleton";

export default function ProfilePage() {
  const { data: user, isLoading } = useCurrentUser();
  const logout = useLogout();
  const navigate = useNavigate();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      logout();
      navigate("/");
    },
  });

  if (isLoading || !user) return <Spinner label="Loading profile..." />;

  const initial = (user.user_detail?.first_name ?? user.email)[0]?.toUpperCase();

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand-500)] text-xl font-bold text-white">
            {initial}
          </div>
          <div>
            <p className="font-semibold">
              {user.user_detail?.first_name
                ? `${user.user_detail.first_name} ${user.user_detail.last_name ?? ""}`.trim()
                : user.email}
            </p>
            <span className="badge badge-neutral mt-1">{user.role}</span>
          </div>
        </div>

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between border-b border-[var(--color-ink-100)] pb-2 dark:border-[var(--color-ink-700)]">
            <dt className="text-[var(--color-ink-500)]">Email</dt>
            <dd className="font-medium">{user.email}</dd>
          </div>
        </dl>

        <div className="mt-6 border-t border-[var(--color-ink-100)] pt-5 dark:border-[var(--color-ink-700)]">
          {confirmingDelete ? (
            <div className="flex gap-2">
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="btn btn-primary"
              >
                {deleteMutation.isPending ? "Deleting..." : "Yes, delete my account"}
              </button>
              <button onClick={() => setConfirmingDelete(false)} className="btn btn-ghost">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmingDelete(true)} className="btn btn-danger">
              Delete account
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
