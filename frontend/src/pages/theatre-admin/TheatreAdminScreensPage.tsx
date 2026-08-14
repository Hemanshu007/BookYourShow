import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLayout, createScreen, deleteScreen, getMyScreens, getMyTheatres } from "../../api/theatreAdmin";
import { Spinner } from "../../components/Skeleton";
import LayoutBuilder from "../../components/LayoutBuilder";
import type { RawLayoutPayload } from "../../api/types";

export default function TheatreAdminScreensPage() {
  const queryClient = useQueryClient();

  const { data: screens, isLoading } = useQuery({
    queryKey: ["theatreAdmin", "screens"],
    queryFn: () => getMyScreens(1, 50),
  });
  const { data: theatres } = useQuery({
    queryKey: ["theatreAdmin", "theatres"],
    queryFn: () => getMyTheatres(1, 50),
  });

  const [showBuilder, setShowBuilder] = useState(false);
  const [theatreId, setTheatreId] = useState("");
  const [screenName, setScreenName] = useState("");
  const [layoutName, setLayoutName] = useState("");
  const [layoutPayload, setLayoutPayload] = useState<RawLayoutPayload | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!layoutPayload) throw new Error("Design a layout first");
      const layout = await createLayout(layoutName, theatreId, layoutPayload);
      return createScreen(screenName, theatreId, layout.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["theatreAdmin", "screens"] });
      setShowBuilder(false);
      setScreenName("");
      setLayoutName("");
      setLayoutPayload(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteScreen(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["theatreAdmin", "screens"] }),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">Screens</h1>
        <button onClick={() => setShowBuilder((s) => !s)} className="btn btn-primary">
          {showBuilder ? "Cancel" : "New Screen"}
        </button>
      </div>

      {showBuilder && (
        <div className="card mb-8 p-5">
          <h2 className="mb-4 text-sm font-semibold text-[var(--color-ink-500)]">
            Design a seat layout and create a screen
          </h2>

          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <select value={theatreId} onChange={(e) => setTheatreId(e.target.value)} className="input">
              <option value="">Select theatre...</option>
              {theatres?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <input
              value={screenName}
              onChange={(e) => setScreenName(e.target.value)}
              placeholder="Screen name (e.g. Screen 1)"
              className="input"
            />
            <input
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              placeholder="Layout name"
              className="input"
            />
          </div>

          <LayoutBuilder onChange={setLayoutPayload} />

          <button
            onClick={() => createMutation.mutate()}
            disabled={!theatreId || !screenName || !layoutName || createMutation.isPending}
            className="btn btn-primary mt-5"
          >
            {createMutation.isPending ? "Creating..." : "Create Screen"}
          </button>
          {createMutation.isError && (
            <p className="mt-3 text-sm text-[var(--color-brand-500)]">{(createMutation.error as Error).message}</p>
          )}
        </div>
      )}

      {isLoading ? (
        <Spinner label="Loading screens..." />
      ) : screens && screens.length === 0 ? (
        <p className="text-[var(--color-ink-500)]">No screens yet.</p>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-ink-50)] text-left text-xs uppercase tracking-wide text-[var(--color-ink-400)] dark:bg-[var(--color-ink-800)]">
              <tr>
                <th className="px-4 py-3">Screen</th>
                <th className="px-4 py-3">Theatre</th>
                <th className="px-4 py-3">Layout</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {screens?.map((s) => (
                <tr key={s.id} className="border-t border-[var(--color-ink-100)] dark:border-[var(--color-ink-800)]">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-[var(--color-ink-500)]">{s.theatre_name}</td>
                  <td className="px-4 py-3 text-[var(--color-ink-500)]">{s.layout_name}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deleteMutation.mutate(s.id)}
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
