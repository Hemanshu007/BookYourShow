export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

export interface Tokens {
  access_token: string;
  refresh_token: string;
}

export interface Role {
  role: string;
}

export interface UserDetail {
  first_name: string | null;
  last_name: string | null;
  mobile_no: string | null;
}

export interface User {
  id: string;
  email: string;
  is_active: boolean;
  role: string;
  google_id: string | null;
  user_detail: UserDetail | null;
}

export interface Movie {
  id: string;
  name: string;
  description: string;
  rating: number;
  genre: string;
  imdb_id: string;
  duration: string;
  is_deleted: boolean;
}

export interface Theatre {
  id: string;
  name: string;
  area: string;
  city: string;
  is_active: boolean;
}

export interface Show {
  id: string;
  start_time: string;
  screen_id: string;
  movie_id: string;
  category_pricing: Record<string, number>;
  is_deleted: boolean;
  movie_name: string;
  theatre_name: string;
  screen_name: string;
}

export type SeatStatus = "Available" | "Locked" | "Booked";

export interface SeatCell {
  grid_type: "seat" | "wall" | null;
  category: string | null;
  price?: number;
  status?: SeatStatus;
}

export interface ShowLayout {
  layout: (SeatCell | null)[][];
  metadata: {
    row: number;
    column: number;
    total_seats: number;
  };
  category_pricing: Record<string, number>;
  seat_mapping: Record<string, [number, number]>;
}

export interface BookingSummary {
  id: string;
  show_id: string;
  total_bill: number;
  number_of_seats: number;
  is_cancelled: boolean;
  movie_name: string;
  theatre_name: string;
  screen_name: string;
  show_time: string;
}

export interface BookingDetail extends BookingSummary {
  seats: string[];
}

export interface SearchResultItem {
  type: "movie" | "theatre";
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface SearchResults {
  items: SearchResultItem[];
  total: number;
}

export interface Screen {
  id: string;
  name: string;
  theatre_id: string;
  theatre_name: string;
  layout_id: string;
  layout_name: string;
}

export interface LayoutGridCell {
  grid_type: "seat" | "wall" | null;
  category: string | null;
}

export interface RawLayoutPayload {
  layout: (LayoutGridCell | null)[][];
  metadata: { grid_rows: number; grid_columns: number };
}
