import { useState } from "react";
import { Link } from "react-router";
import { cancelBooking, getBookings } from "../api/bookings.js";
import { BookingStateBadge } from "../components/Badge.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";
import RescheduleDialog from "../components/RescheduleDialog.jsx";
import Spinner from "../components/Spinner.jsx";
import { formatDate, formatRange } from "../utils/dates.js";
import { formatMoney } from "../utils/money.js";
import { sportLabel } from "../utils/sports.js";
import { useApi } from "../utils/useApi.js";

const tabs = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "cancelled", label: "Cancelled" },
];

const emptyText = {
  upcoming: "You have no upcoming bookings.",
  past: "You have no past bookings yet.",
  cancelled: "You have no cancelled bookings.",
};

function tabOf(booking) {
  if (booking.state === "cancelled") return "cancelled";
  if (booking.state === "completed") return "past";
  return "upcoming";
}

function BookingCard({ booking, onCancel, onReschedule }) {
  const upcoming = booking.state === "upcoming";

  return (
    <li className="card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900">{booking.turf_name}</p>
          <p className="text-xs text-slate-500">
            {sportLabel(booking.turf_sport)} · {booking.turf_address},{" "}
            {booking.turf_city}
          </p>
        </div>
        <BookingStateBadge state={booking.state} />
      </div>

      <div className="mt-3 flex flex-wrap gap-x-8 gap-y-1 text-sm">
        <p>{formatDate(booking.booking_date)}</p>
        <p>
          {formatRange(booking.start_hour, booking.hours)} ({booking.hours}{" "}
          {booking.hours === 1 ? "hour" : "hours"})
        </p>
        <p>
          {formatMoney(booking.total_price)}{" "}
          <span className="text-slate-500">at the venue</span>
        </p>
      </div>

      {booking.state === "cancelled" && (
        <p className="mt-3 text-sm text-slate-600">
          {booking.cancelled_by_role === "owner"
            ? `Cancelled by the turf owner: ${booking.cancel_reason}`
            : "Cancelled by you."}
        </p>
      )}

      {upcoming && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {booking.can_reschedule && (
            <button
              className="btn btn-secondary btn-small"
              onClick={() => onReschedule(booking)}
            >
              Reschedule
            </button>
          )}
          {booking.can_cancel && (
            <button
              className="btn btn-secondary btn-small"
              onClick={() => onCancel(booking)}
            >
              Cancel booking
            </button>
          )}
          {booking.can_cancel && booking.rescheduled && (
            <span className="text-xs text-slate-500">
              Already rescheduled once.
            </span>
          )}
          {!booking.can_cancel && (
            <span className="text-xs text-slate-500">
              Less than 2 hours to go, so it is too late to change this online.
            </span>
          )}
        </div>
      )}
    </li>
  );
}

export default function MyBookings() {
  const { data, error, loading, reload } = useApi(getBookings);
  const [tab, setTab] = useState("upcoming");
  const [cancelling, setCancelling] = useState(null);
  const [rescheduling, setRescheduling] = useState(null);

  async function handleCancel() {
    await cancelBooking(cancelling.id);
    await reload();
    setCancelling(null);
  }

  async function handleRescheduled() {
    await reload();
    setRescheduling(null);
  }

  if (loading) return <Spinner />;
  if (!data) return <ErrorMessage message={error} />;

  const shown = data.bookings.filter((booking) => tabOf(booking) === tab);
  // soonest first for upcoming, newest first for the rest
  if (tab !== "upcoming") shown.reverse();

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">My bookings</h1>

      <div className="mb-4 flex gap-1" role="tablist">
        {tabs.map((item) => {
          const count = data.bookings.filter(
            (booking) => tabOf(booking) === item.key,
          ).length;
          return (
            <button
              key={item.key}
              role="tab"
              aria-selected={tab === item.key}
              onClick={() => setTab(item.key)}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium ${
                tab === item.key
                  ? "bg-emerald-700 text-white"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              {item.label} ({count})
            </button>
          );
        })}
      </div>

      <ErrorMessage message={error} />

      {shown.length === 0 ? (
        <div className="card text-center">
          <p className="text-sm text-slate-600">{emptyText[tab]}</p>
          {tab === "upcoming" && (
            <Link to="/turfs" className="btn btn-primary mt-4">
              Find a turf
            </Link>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {shown.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onCancel={setCancelling}
              onReschedule={setRescheduling}
            />
          ))}
        </ul>
      )}

      {cancelling && (
        <ConfirmDialog
          title="Cancel this booking?"
          message={`${cancelling.turf_name}, ${formatDate(cancelling.booking_date)}, ${formatRange(cancelling.start_hour, cancelling.hours)}. The slot will be free for someone else to book.`}
          confirmLabel="Cancel booking"
          onConfirm={handleCancel}
          onClose={() => setCancelling(null)}
        />
      )}

      {rescheduling && (
        <RescheduleDialog
          booking={rescheduling}
          onDone={handleRescheduled}
          onClose={() => setRescheduling(null)}
        />
      )}
    </div>
  );
}
