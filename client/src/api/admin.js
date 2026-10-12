import { request, toQuery } from "./client.js";

export function getStats() {
  return request("/admin/stats");
}

export function getTurfs(status) {
  return request(`/admin/turfs${toQuery({ status })}`);
}

export function approveTurf(turfId) {
  return request(`/admin/turfs/${turfId}/approve`, { method: "POST" });
}

export function rejectTurf(turfId, reason) {
  return request(`/admin/turfs/${turfId}/reject`, {
    method: "POST",
    body: { reason },
  });
}
