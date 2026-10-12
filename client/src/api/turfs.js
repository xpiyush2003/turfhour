import { request, toQuery } from "./client.js";

export function getTurfs(filters) {
  return request(`/turfs${toQuery(filters)}`);
}

export function getAvailability(turfId, date) {
  return request(`/turfs/${turfId}/availability${toQuery({ date })}`);
}
