import { formatHour } from "./dates.js";

// a slot can be picked if it is free, or held by the booking being moved
export function canPick(slot, ownBookingId) {
  if (slot.status === "free") return true;
  return slot.status === "yours" && slot.booking_id === ownBookingId;
}

// says what is wrong with the picked hours, or "" if they are fine
export function selectionError(slots, startHour, hours, ownBookingId) {
  for (let hour = startHour; hour < startHour + hours; hour++) {
    const slot = slots.find((item) => item.start_hour === hour);
    if (!slot) {
      return `The turf closes at ${formatHour(hour)}. Pick an earlier start or fewer hours.`;
    }
    if (!canPick(slot, ownBookingId)) {
      return `The ${formatHour(hour)} hour is not free. Pick another start or fewer hours.`;
    }
  }
  return "";
}
