import { request } from "./client.js";

export function getBookings() {
  return request("/bookings");
}

export function createBooking(body) {
  return request("/bookings", { method: "POST", body });
}

export function cancelBooking(bookingId) {
  return request(`/bookings/${bookingId}/cancel`, { method: "POST" });
}

export function rescheduleBooking(bookingId, body) {
  return request(`/bookings/${bookingId}/reschedule`, {
    method: "POST",
    body,
  });
}
