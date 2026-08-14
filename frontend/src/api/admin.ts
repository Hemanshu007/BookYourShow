import { apiClient, unwrap } from "./client";
import type { ApiResponse, Movie, Theatre, User } from "./types";

export function createUser(email: string, otp: string, role: "admin" | "theatre_admin" | "user") {
  return unwrap(
    apiClient.post<ApiResponse<User>>("/admin/create-user", { email, otp, role }),
  );
}

export function createTheatre(
  name: string,
  area: string,
  city: string,
  operatorEmail: string,
) {
  return unwrap(
    apiClient.post<ApiResponse<Theatre>>("/admin/create-theatre", {
      name,
      area,
      city,
      operator_email: operatorEmail,
    }),
  );
}

export function createMovie(imdbId: string) {
  return unwrap(
    apiClient.post<ApiResponse<Movie>>("/admin/create-movie", { imdb_id: imdbId }),
  );
}

export function getAllUsers(page = 1, size = 20) {
  return unwrap(
    apiClient.get<ApiResponse<User[]>>("/admin/users", { params: { page, size } }),
  );
}

export function getAllTheatresAdmin(page = 1, size = 20) {
  return unwrap(
    apiClient.get<ApiResponse<Theatre[]>>("/admin/theatres", { params: { page, size } }),
  );
}

export function getAllMoviesAdmin(page = 1, size = 20) {
  return unwrap(
    apiClient.get<ApiResponse<Movie[]>>("/admin/movies", { params: { page, size } }),
  );
}

export function deleteTheatreAdmin(theatreId: string) {
  return unwrap(apiClient.delete<ApiResponse<null>>(`/admin/theatre/delete/${theatreId}`));
}

export function deleteMovieAdmin(movieId: string) {
  return unwrap(apiClient.delete<ApiResponse<null>>(`/admin/movie/delete/${movieId}`));
}
