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

  return (
    <div className="mx-auto max-w-md rounded-lg border border-neutral-200 p-6 dark:border-neutral-800">
      <h1 className="mb-4 text-xl font-semibold">Profile</h1>

      <dl className="space-y-2 text-sm">
        <Row label="Email" value={user.email} />
        <Row label="Role" value={user.role} />
        {user.user_detail?.first_name && (
          <Row
            label="Name"
            value={`${user.user_detail.first_name} ${user.user_detail.last_name ?? ""}`.trim()}
          />
        )}
      </dl>

      <div className="mt-6 border-t border-neutral-100 pt-4 dark:border-neutral-800">
        {confirmingDelete ? (
          <div className="flex gap-2">
            <button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="rounded-md bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {deleteMutation.isPending ? "Deleting..." : "Yes, delete my account"}
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="rounded-md border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
          >
            Delete account
          </button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-neutral-100 pb-2 dark:border-neutral-800">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
