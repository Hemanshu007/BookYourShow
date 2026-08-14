import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/auth";

export default function RoleProtectedRoute({ role }: { role: string }) {
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!isHydrated) {
    return null;
  }

  if (!refreshToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // user hydrates asynchronously after refreshToken is present; wait rather
  // than bounce someone with the right role to "/" during that gap.
  if (!user) {
    return null;
  }

  if (user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
