import { NavLink, Outlet } from "react-router-dom";

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
}

export default function DashboardLayout({
  title,
  items,
}: {
  title: string;
  items: NavItem[];
}) {
  return (
    <div className="flex min-h-[calc(100vh-64px)] gap-8">
      <aside className="w-52 shrink-0">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-ink-400)]">
          {title}
        </p>
        <nav className="flex flex-col gap-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[var(--color-brand-500)] text-white"
                    : "text-[var(--color-ink-500)] hover:bg-[var(--color-ink-100)] hover:text-[var(--color-ink-900)] dark:hover:bg-[var(--color-ink-800)] dark:hover:text-[var(--color-ink-100)]",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
