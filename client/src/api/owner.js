import { request, toQuery } from "./client.js";

export function getDashboard() {
  return request("/owner/dashboard");
}

export function getTurfs() {
  return request("/owner/turfs");
}

export function createTurf(body) {
  return request("/owner/turfs", { method: "POST", body });
}

export function updateTurf(turfId, body) {
  return request(`/owner/turfs/${turfId}`, { method: "PATCH", body });
}

export function deleteTurf(turfId) {
  return request(`/owner/turfs/${turfId}`, { method: "DELETE" });
}

export function getSchedule(turfId, date) {
  return request(`/owner/turfs/${turfId}/schedule${toQuery({ date })}`);
}

export function getBookings(filters) {
  return request(`/owner/bookings${toQuery(filters)}`);
}

export function cancelBooking(bookingId, reason) {
  return request(`/owner/bookings/${bookingId}/cancel`, {
    method: "POST",
    body: { reason },
  });
}
