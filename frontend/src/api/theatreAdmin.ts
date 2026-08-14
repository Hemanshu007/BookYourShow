import { apiClient, unwrap } from "./client";
import type { ApiResponse, RawLayoutPayload, Screen, Theatre } from "./types";

export function getMyTheatres(page = 1, size = 20) {
  return unwrap(
    apiClient.get<ApiResponse<Theatre[]>>("/theatre-admin/my-theatres", {
      params: { page, size },
    }),
  );
}

export function getMyScreens(page = 1, size = 20) {
  return unwrap(
    apiClient.get<ApiResponse<Screen[]>>("/theatre-admin/my-screens", {
      params: { page, size },
    }),
  );
}

export function createLayout(name: string, theatreId: string, layout: RawLayoutPayload) {
  return unwrap(
    apiClient.post<ApiResponse<{ id: string }>>("/theatre-admin/create-layout", {
      name,
      theatre_id: theatreId,
      layout,
    }),
  );
}

export function createScreen(name: string, theatreId: string, layoutId: string) {
  return unwrap(
    apiClient.post<ApiResponse<Screen>>("/theatre-admin/create-screen", {
      name,
      theatre_id: theatreId,
      layout_id: layoutId,
    }),
  );
}

export function createShow(
  screenId: string,
  movieId: string,
  startTime: string,
  categoryPrice: Record<string, number>,
) {
  return unwrap(
    apiClient.post<ApiResponse<{ id: string }>>("/theatre-admin/create-show", {
      screen_id: screenId,
      movie_id: movieId,
      start_time: startTime,
      category_price: categoryPrice,
    }),
  );
}

export function deleteScreen(screenId: string) {
  return unwrap(
    apiClient.delete<ApiResponse<null>>(`/theatre-admin/screen/delete/${screenId}`),
  );
}

export function deleteShow(showId: string) {
  return unwrap(apiClient.delete<ApiResponse<null>>(`/theatre-admin/show/delete/${showId}`));
}

export function verifyTicket(ticketHash: string) {
  return unwrap(
    apiClient.post<ApiResponse<null>>("/theatre-admin/verify-ticket", {
      ticket_hash: ticketHash,
    }),
  );
}
