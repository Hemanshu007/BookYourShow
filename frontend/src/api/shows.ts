import { apiClient, unwrap } from "./client";
import type { ApiResponse, Show, ShowLayout } from "./types";

export function getShows(theatreId: string, movieId: string, page = 1, size = 10) {
  return unwrap(
    apiClient.get<ApiResponse<Show[]>>(
      `/users/theatre/${theatreId}/movie/${movieId}`,
      { params: { page, size } },
    ),
  );
}

export function getShowById(showId: string) {
  return unwrap(apiClient.get<ApiResponse<ShowLayout>>(`/users/show/${showId}`));
}

export function lockSeats(showId: string, seatArray: string[]) {
  return unwrap(
    apiClient.post<ApiResponse<null>>(`/users/show/${showId}/seat-lock`, {
      seat_array: seatArray,
    }),
  );
}

export function bookSeats(showId: string, seatArray: string[]) {
  return unwrap(
    apiClient.post<ApiResponse<{ booking_id: string; total_paid: number }>>(
      `/users/show/${showId}/seat-book`,
      { seat_array: seatArray },
    ),
  );
}
