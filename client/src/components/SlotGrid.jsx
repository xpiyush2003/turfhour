import { formatRange } from "../utils/dates.js";
import { canPick } from "../utils/slots.js";

const styles = {
  free: "border-emerald-300 bg-white text-slate-900 hover:bg-emerald-50 cursor-pointer",
  selected: "border-emerald-700 bg-emerald-700 text-white cursor-pointer",
  current:
    "border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100 cursor-pointer",
  booked: "border-slate-200 bg-slate-100 text-slate-400",
  yours: "border-blue-200 bg-blue-50 text-blue-800",
  past: "border-slate-100 bg-white text-slate-300",
};

const notes = {
  free: "Free",
  selected: "Selected",
  current: "Current",
  booked: "Booked",
  yours: "Yours",
  past: "Over",
};

// every hourly slot of one day, the free ones can be clicked
export default function SlotGrid({ slots, selected, onPick, ownBookingId }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {slots.map((slot) => {
        const pickable = canPick(slot, ownBookingId);
        let look = slot.status;
        if (pickable) look = slot.status === "yours" ? "current" : "free";
        if (selected.includes(slot.start_hour)) look = "selected";

        return (
          <button
            key={slot.start_hour}
            disabled={!pickable}
            onClick={() => onPick(slot.start_hour)}
            aria-pressed={look === "selected"}
            className={`rounded-lg border px-2 py-2 text-center text-sm ${styles[look]}`}
          >
            <span className="block font-medium">
              {formatRange(slot.start_hour, 1)}
            </span>
            <span className="block text-xs">{notes[look]}</span>
          </button>
        );
      })}
    </div>
  );
}
