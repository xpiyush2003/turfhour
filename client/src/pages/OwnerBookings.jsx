import { useCallback, useState } from "react";
import {
  cancelBooking,
  getBookings,
  getSchedule,
  getTurfs,
} from "../api/owner.js";
import { BookingStateBadge } from "../components/Badge.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";
import ReasonDialog from "../components/ReasonDialog.jsx";
import Spinner from "../components/Spinner.jsx";
import { formatDate, formatRange, todayInIndia } from "../utils/dates.js";
import { formatMoney } from "../utils/money.js";
import { useApi } from "../utils/useApi.js";

// asks the owner for a reason, then cancels and reloads the list behind it
function CancelDialog({ booking, onDone, onClose }) {
  async function handleCancel(reason) {
    await cancelBooking(booking.id, reason);
    await onDone();
    onClose();
  }

  return (
    <ReasonDialog
      title="Cancel this booking?"
      message={`${booking.customer_name}, ${booking.turf_name}, ${formatDate(booking.booking_date)}, ${formatRange(booking.start_hour, booking.hours)}. The customer will see your reason.`}
      placeholder="For example: the pitch is closed for maintenance"
      confirmLabel="Cancel booking"
      onConfirm={handleCancel}
      onClose={onClose}
    />
  );
}

function BookingList({ turfs }) {
  const [turfId, setTurfId] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("");
  const [cancelling, setCancelling] = useState(null);

  const loader = useCallback(
    () => getBookings({ turf_id: turfId, date, status }),
    [turfId, date, status],
  );
  const { data, error, loading, reload } = useApi(loader);

  return (
    <div>
      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        <select
          className="input"
          value={turfId}
          onChange={(event) => setTurfId(event.target.value)}
          aria-label="Turf"
        >
          <option value="">All turfs</option>
          {turfs.map((turf) => (
            <option key={turf.id} value={turf.id}>
              {turf.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="input"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          aria-label="Date"
        />
        <select
          className="input"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Status"
        >
          <option value="">Confirmed and cancelled</option>
          <option value="confirmed">Confirmed only</option>
          <option value="cancelled">Cancelled only</option>
        </select>
      </div>

      <ErrorMessage message={error} />
      {loading && <Spinner />}

      {data && data.bookings.length === 0 && (
        <div className="card text-center text-sm text-slate-600">
          No bookings match these filters.
        </div>
      )}

      {data && data.bookings.length > 0 && (
        <ul className="space-y-3">
          {data.bookings.map((booking) => (
            <li key={booking.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">
                    {booking.customer_name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {booking.customer_email}
                  </p>
                </div>
                <BookingStateBadge state={booking.state} />
              </div>
              <div className="mt-3 flex flex-wrap gap-x-8 gap-y-1 text-sm">
                <p>{booking.turf_name}</p>
                <p>{formatDate(booking.booking_date)}</p>
                <p>{formatRange(booking.start_hour, booking.hours)}</p>
                <p>{formatMoney(booking.total_price)}</p>
              </div>
              {booking.state === "cancelled" && (
                <p className="mt-3 text-sm text-slate-600">
                  {booking.cancelled_by_role === "owner"
                    ? `Cancelled by you: ${booking.cancel_reason}`
                    : "Cancelled by the customer."}
                </p>
              )}
              {booking.state === "upcoming" && (
                <button
                  className="btn btn-secondary btn-small mt-4"
                  onClick={() => setCancelling(booking)}
                >
                  Cancel booking
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {cancelling && (
        <CancelDialog
          booking={cancelling}
          onDone={reload}
          onClose={() => setCancelling(null)}
        />
      )}
    </div>
  );
}

function DayView({ turfs }) {
  const [turfId, setTurfId] = useState(turfs[0].id);
  const [date, setDate] = useState(todayInIndia);
  const [cancelling, setCancelling] = useState(null);

  const loader = useCallback(() => getSchedule(turfId, date), [turfId, date]);
  const { data, error, loading, reload } = useApi(loader);
  const ready = data && data.date === date && data.turf.id === turfId;

  return (
    <div>
      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        <select
          className="input"
          value={turfId}
          onChange={(event) => setTurfId(Number(event.target.value))}
          aria-label="Turf"
        >
          {turfs.map((turf) => (
            <option key={turf.id} value={turf.id}>
              {turf.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="input"
          value={date}
          onChange={(event) => setDate(event.target.value || todayInIndia())}
          aria-label="Date"
        />
      </div>

      <ErrorMessage message={error} />
      {(loading || (!ready && !error)) && <Spinner />}

      {ready && (
        <div className="card">
          <p className="mb-3 text-sm font-medium">{formatDate(date)}</p>
          <ul className="divide-y divide-slate-100">
            {data.slots.map((slot) => {
              const booking = slot.booking;
              const firstHour = booking?.start_hour === slot.start_hour;
              return (
                <li
                  key={slot.start_hour}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2 text-sm"
                >
                  <span
                    className={`w-32 shrink-0 ${slot.is_past ? "text-slate-400" : "text-slate-700"}`}
                  >
                    {formatRange(slot.start_hour, 1)}
                  </span>
                  {booking ? (
                    <span className="font-medium text-slate-900">
                      {booking.customer_name}
                      <span className="ml-2 font-normal text-slate-500">
                        {booking.customer_email}
                      </span>
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      {slot.is_past ? "Not booked" : "Free"}
                    </span>
                  )}
                  {booking && firstHour && !slot.is_past && (
                    <button
                      className="btn btn-secondary btn-small ml-auto"
                      onClick={() =>
                        setCancelling({
                          ...booking,
                          booking_date: date,
                          turf_name: data.turf.name,
                        })
                      }
                    >
                      Cancel booking
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {cancelling && (
        <CancelDialog
          booking={cancelling}
          onDone={reload}
          onClose={() => setCancelling(null)}
        />
      )}
    </div>
  );
}

export default function OwnerBookings() {
  const { data, error, loading } = useApi(getTurfs);
  const [view, setView] = useState("list");

  if (loading) return <Spinner />;
  if (!data) return <ErrorMessage message={error} />;

  const turfs = data.turfs;
  const views = [
    { key: "list", label: "All bookings" },
    { key: "day", label: "Day view" },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Bookings</h1>
        {turfs.length > 0 && (
          <div className="flex gap-1">
            {views.map((item) => (
              <button
                key={item.key}
                aria-pressed={view === item.key}
                onClick={() => setView(item.key)}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium ${
                  view === item.key
                    ? "bg-emerald-700 text-white"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {turfs.length === 0 && (
        <div className="card text-center text-sm text-slate-600">
          Bookings will show up here once you have added a turf.
        </div>
      )}
      {turfs.length > 0 && view === "list" && <BookingList turfs={turfs} />}
      {turfs.length > 0 && view === "day" && <DayView turfs={turfs} />}
    </div>
  );
}
