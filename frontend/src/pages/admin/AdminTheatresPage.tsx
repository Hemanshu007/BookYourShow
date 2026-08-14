import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTheatre, deleteTheatreAdmin, getAllTheatresAdmin } from "../../api/admin";
import { Spinner } from "../../components/Skeleton";

export default function AdminTheatresPage() {
  const queryClient = useQueryClient();
  const { data: theatres, isLoading } = useQuery({
    queryKey: ["admin", "theatres"],
    queryFn: () => getAllTheatresAdmin(1, 50),
  });

  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");
  const [operatorEmail, setOperatorEmail] = useState("");

  const createMutation = useMutation({
    mutationFn: () => createTheatre(name, area, city, operatorEmail),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "theatres"] });
      setName("");
      setArea("");
      setCity("");
      setOperatorEmail("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTheatreAdmin(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "theatres"] }),
  });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">Theatres</h1>

      <div className="card mb-8 p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--color-ink-500)]">Register a theatre</h2>
        <p className="mb-4 text-xs text-[var(--color-ink-400)]">
          The operator email must already belong to a user created with the theatre_admin role.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="input" required />
          <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Area" className="input" required />
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="input" required />
          <input
            value={operatorEmail}
            onChange={(e) => setOperatorEmail(e.target.value)}
            placeholder="Operator email"
            className="input"
            required
          />
          <button type="submit" disabled={createMutation.isPending} className="btn btn-primary col-span-2 sm:col-span-4">
            {createMutation.isPending ? "Creating..." : "Create Theatre"}
          </button>
        </form>
        {createMutation.isError && (
          <p className="mt-3 text-sm text-[var(--color-brand-500)]">{(createMutation.error as Error).message}</p>
        )}
      </div>

      {isLoading ? (
        <Spinner label="Loading theatres..." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-ink-50)] text-left text-xs uppercase tracking-wide text-[var(--color-ink-400)] dark:bg-[var(--color-ink-800)]">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {theatres?.map((t) => (
                <tr key={t.id} className="border-t border-[var(--color-ink-100)] dark:border-[var(--color-ink-800)]">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3 text-[var(--color-ink-500)]">
                    {t.area}, {t.city}
                  </td>
                  <td className="px-4 py-3">
                    {t.is_active ? <span className="badge badge-ok">Active</span> : <span className="badge badge-danger">Inactive</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deleteMutation.mutate(t.id)}
                      disabled={deleteMutation.isPending}
                      className="text-xs font-semibold text-[var(--color-brand-500)] hover:underline"
                    >
                      Delete
                    </button>
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
