import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";
import { useSessionHydration } from "./hooks/useAuth";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import MoviePage from "./pages/MoviePage";
import TheatrePage from "./pages/TheatrePage";
import ShowsPage from "./pages/ShowsPage";
import SeatSelectionPage from "./pages/SeatSelectionPage";
import LoginPage from "./pages/LoginPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import BookingDetailPage from "./pages/BookingDetailPage";
import ProfilePage from "./pages/ProfilePage";
import NotFoundPage from "./pages/NotFoundPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminTheatresPage from "./pages/admin/AdminTheatresPage";
import AdminMoviesPage from "./pages/admin/AdminMoviesPage";
import TheatreAdminTheatresPage from "./pages/theatre-admin/TheatreAdminTheatresPage";
import TheatreAdminScreensPage from "./pages/theatre-admin/TheatreAdminScreensPage";
import TheatreAdminShowsPage from "./pages/theatre-admin/TheatreAdminShowsPage";
import TheatreAdminVerifyTicketPage from "./pages/theatre-admin/TheatreAdminVerifyTicketPage";

const ADMIN_NAV = [
  { to: "/admin/users", label: "Users" },
  { to: "/admin/theatres", label: "Theatres" },
  { to: "/admin/movies", label: "Movies" },
];

const THEATRE_ADMIN_NAV = [
  { to: "/theatre-admin/theatres", label: "My Theatres" },
  { to: "/theatre-admin/screens", label: "Screens" },
  { to: "/theatre-admin/shows", label: "Shows" },
  { to: "/theatre-admin/verify-ticket", label: "Verify Ticket" },
];

export default function App() {
  const { isHydrated } = useSessionHydration();

  if (!isHydrated) {
    return null;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="movies/:movieId" element={<MoviePage />} />
        <Route path="theatres/:theatreId" element={<TheatrePage />} />
        <Route path="theatre/:theatreId/movie/:movieId" element={<ShowsPage />} />
        <Route path="shows/:showId" element={<SeatSelectionPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="auth/callback" element={<AuthCallbackPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="my-bookings" element={<MyBookingsPage />} />
          <Route path="bookings/:bookingId" element={<BookingDetailPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route element={<RoleProtectedRoute role="admin" />}>
          <Route path="admin" element={<DashboardLayout title="Admin" items={ADMIN_NAV} />}>
            <Route index element={<Navigate to="users" replace />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="theatres" element={<AdminTheatresPage />} />
            <Route path="movies" element={<AdminMoviesPage />} />
          </Route>
        </Route>

        <Route element={<RoleProtectedRoute role="theatre_admin" />}>
          <Route
            path="theatre-admin"
            element={<DashboardLayout title="Theatre Admin" items={THEATRE_ADMIN_NAV} />}
          >
            <Route index element={<Navigate to="theatres" replace />} />
            <Route path="theatres" element={<TheatreAdminTheatresPage />} />
            <Route path="screens" element={<TheatreAdminScreensPage />} />
            <Route path="shows" element={<TheatreAdminShowsPage />} />
            <Route path="verify-ticket" element={<TheatreAdminVerifyTicketPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
