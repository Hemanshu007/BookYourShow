import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
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

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
