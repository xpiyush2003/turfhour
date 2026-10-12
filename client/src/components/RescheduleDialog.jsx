import { useCallback, useState } from "react";
import { rescheduleBooking } from "../api/bookings.js";
import { getAvailability } from "../api/turfs.js";
import { formatDate, formatRange } from "../utils/dates.js";
import { formatMoney } from "../utils/money.js";
import { selectionError } from "../utils/slots.js";
import { useApi } from "../utils/useApi.js";
import DateStrip from "./DateStrip.jsx";
import ErrorMessage from "./ErrorMessage.jsx";
import Modal from "./Modal.jsx";
import SlotGrid from "./SlotGrid.jsx";
import Spinner from "./Spinner.jsx";

// moves a booking to a new date and start time, the length stays the same
export default function RescheduleDialog({ booking, onDone, onClose }) {
  const [date, setDate] = useState(booking.booking_date);
  const [startHour, setStartHour] = useState(null);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState("");

  const loader = useCallback(
    () => getAvailability(booking.turf_id, date),
    [booking.turf_id, date],
  );
  const { data, error, reload } = useApi(loader);

  function pickDate(newDate) {
    setDate(newDate);
    setStartHour(null);
    setSaveError("");
  }

  async function handleSave() {
    setBusy(true);
    setSaveError("");
    try {
      await rescheduleBooking(booking.id, {
        booking_date: date,
        start_hour: startHour,
      });
      await onDone();
    } catch (err) {
      setSaveError(err.message);
      setStartHour(null);
      await reload();
      setBusy(false);
    }
  }

  const slotsReady = data && data.date === date;
  const sameTime =
    date === booking.booking_date && startHour === booking.start_hour;
  const selected = [];
  let problem = "";
  if (startHour !== null && slotsReady) {
    problem = selectionError(data.slots, startHour, booking.hours, booking.id);
    if (sameTime) problem = "This is the time you already have.";
    for (let hour = startHour; hour < startHour + booking.hours; hour++) {
      selected.push(hour);
    }
  }

  return (
    <Modal title="Reschedule booking" onClose={onClose} wide>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          {booking.turf_name}, currently {formatDate(booking.booking_date)},{" "}
          {formatRange(booking.start_hour, booking.hours)}. Pick a new date and
          start time. A booking can be rescheduled once.
        </p>
        <DateStrip value={date} onChange={pickDate} />
        <ErrorMessage message={error} />
        {!slotsReady && !error && <Spinner />}
        {slotsReady && (
          <SlotGrid
            slots={data.slots}
            selected={selected}
            onPick={setStartHour}
            ownBookingId={booking.id}
          />
        )}

        {startHour !== null && slotsReady && !problem && (
          <p className="text-sm">
            <span className="font-medium">
              New time: {formatDate(date)},{" "}
              {formatRange(startHour, booking.hours)}.
            </span>{" "}
            Pay {formatMoney(booking.hours * data.turf.price_per_hour)} at the
            venue.
          </p>
        )}
        {problem && <p className="text-sm text-red-700">{problem}</p>}
        <ErrorMessage message={saveError} />

        <div className="flex justify-end gap-2">
          <button className="btn btn-secondary" onClick={onClose}>
            Go back
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={busy || startHour === null || Boolean(problem)}
          >
            {busy ? "Saving..." : "Move booking"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
