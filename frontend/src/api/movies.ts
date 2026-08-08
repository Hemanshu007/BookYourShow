import { apiClient, unwrap } from "./client";
import type { ApiResponse, Movie, Theatre } from "./types";

export function getAllMovies(page = 1, size = 10) {
  return unwrap(
    apiClient.get<ApiResponse<Movie[]>>("/users/movies", { params: { page, size } }),
  );
}

export function getMoviesByTheatre(theatreId: string, page = 1, size = 10) {
  return unwrap(
    apiClient.get<ApiResponse<Movie[]>>(`/users/theatre/${theatreId}/movies`, {
      params: { page, size },
    }),
  );
}

export function getTheatresByMovie(movieId: string, page = 1, size = 10) {
  return unwrap(
    apiClient.get<ApiResponse<Theatre[]>>(`/users/movie/${movieId}/theatres`, {
      params: { page, size },
    }),
  );
}
