import { apiClient, unwrap } from "./client";
import type { ApiResponse, BookingDetail, BookingSummary } from "./types";

export function getUserBookings(page = 1, size = 10) {
  return unwrap(
    apiClient.get<ApiResponse<BookingSummary[]>>("/users/bookings", {
      params: { page, size },
    }),
  );
}

export function getBookingDetail(bookingId: string) {
  return unwrap(
    apiClient.get<ApiResponse<BookingDetail>>(`/users/booking/${bookingId}`),
  );
}

export function cancelBooking(bookingId: string) {
  return unwrap(
    apiClient.post<ApiResponse<null>>(`/users/booking/${bookingId}/cancel`),
  );
}
