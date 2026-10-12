import { useCallback, useState } from "react";
import { Link, useParams } from "react-router";
import { createBooking } from "../api/bookings.js";
import { getAvailability } from "../api/turfs.js";
import DateStrip from "../components/DateStrip.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";
import SlotGrid from "../components/SlotGrid.jsx";
import Spinner from "../components/Spinner.jsx";
import {
  formatDate,
  formatHour,
  formatRange,
  todayInIndia,
} from "../utils/dates.js";
import { formatMoney } from "../utils/money.js";
import { selectionError } from "../utils/slots.js";
import { sportColor, sportLabel } from "../utils/sports.js";
import { useApi } from "../utils/useApi.js";

export default function TurfDetail() {
  const { id } = useParams();
  const [date, setDate] = useState(todayInIndia);
  const [startHour, setStartHour] = useState(null);
  const [hours, setHours] = useState(1);
  const [busy, setBusy] = useState(false);
  const [bookError, setBookError] = useState("");
  const [booked, setBooked] = useState(null);

  const loader = useCallback(() => getAvailability(id, date), [id, date]);
  const { data, error, loading, reload } = useApi(loader);

  function pickDate(newDate) {
    setDate(newDate);
    setStartHour(null);
    setBookError("");
    setBooked(null);
  }

  function pickHour(hour) {
    setStartHour(hour);
    setBookError("");
    setBooked(null);
  }

  async function handleBook() {
    setBusy(true);
    setBookError("");
    let result = null;
    try {
      result = await createBooking({
        turf_id: data.turf.id,
        booking_date: date,
        start_hour: startHour,
        hours,
      });
    } catch (err) {
      setBookError(err.message);
    }
    // show the latest slots either way, someone else may have booked
    await reload();
    if (result) {
      setBooked(result.booking);
      setStartHour(null);
    }
    setBusy(false);
  }

  if (loading) return <Spinner />;
  if (!data) return <ErrorMessage message={error} />;

  const turf = data.turf;
  const slotsReady = data.date === date;
  const selected = [];
  let problem = "";
  if (startHour !== null && slotsReady) {
    problem = selectionError(data.slots, startHour, hours);
    for (let hour = startHour; hour < startHour + hours; hour++) {
      selected.push(hour);
    }
  }

  return (
    <div className="space-y-5">
      <Link to="/turfs" className="text-sm text-emerald-800 hover:underline">
        ← All turfs
      </Link>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div
          className={`px-5 py-3 text-sm font-medium text-white ${sportColor(turf.sport)}`}
        >
          {sportLabel(turf.sport)}
        </div>
        <div className="p-5">
          <h1 className="text-2xl font-bold">{turf.name}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {turf.address}, {turf.city}
          </p>
          {turf.description && (
            <p className="mt-3 text-sm text-slate-700">{turf.description}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <p>
              <span className="text-slate-500">Open </span>
              {formatHour(turf.open_hour)} to {formatHour(turf.close_hour)},
              every day
            </p>
            <p>
              <span className="text-slate-500">Price </span>
              {formatMoney(turf.price_per_hour)} per hour, paid at the venue
            </p>
          </div>
        </div>
      </section>

      <section className="card">
        <h2 className="mb-3 font-semibold">1. Pick a date</h2>
        <DateStrip value={date} onChange={pickDate} />
      </section>

      <section className="card">
        <h2 className="font-semibold">2. Pick a start time</h2>
        <p className="mb-3 text-xs text-slate-500">
          {formatDate(date)}. All times are Indian time.
        </p>
        <ErrorMessage message={error} />
        {!slotsReady && !error && <Spinner />}
        {slotsReady && (
          <SlotGrid slots={data.slots} selected={selected} onPick={pickHour} />
        )}
      </section>

      {booked && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-5"
        >
          <p className="font-semibold text-emerald-900">
            Your booking is confirmed
          </p>
          <p className="mt-1 text-sm text-emerald-900">
            {formatDate(booked.booking_date)},{" "}
            {formatRange(booked.start_hour, booked.hours)}. Pay{" "}
            {formatMoney(booked.total_price)} at the venue.
          </p>
          <Link
            to="/bookings"
            className="mt-2 inline-block text-sm font-medium text-emerald-800 underline"
          >
            See my bookings
          </Link>
        </div>
      )}

      {!booked && bookError && <ErrorMessage message={bookError} />}

      {startHour !== null && slotsReady && (
        <section className="card">
          <h2 className="mb-3 font-semibold">3. Confirm</h2>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="label" htmlFor="hours">
                How long?
              </label>
              <select
                id="hours"
                className="input"
                value={hours}
                onChange={(event) => setHours(Number(event.target.value))}
              >
                <option value={1}>1 hour</option>
                <option value={2}>2 hours</option>
                <option value={3}>3 hours</option>
              </select>
            </div>
            <div className="text-sm">
              <p className="font-medium">
                {formatDate(date)}, {formatRange(startHour, hours)}
              </p>
              <p className="text-slate-600">
                Pay {formatMoney(hours * turf.price_per_hour)} at the venue
              </p>
            </div>
            <button
              className="btn btn-primary ml-auto"
              onClick={handleBook}
              disabled={busy || Boolean(problem)}
            >
              {busy ? "Booking..." : "Confirm booking"}
            </button>
          </div>
          {problem && <p className="mt-3 text-sm text-red-700">{problem}</p>}
        </section>
      )}
    </div>
  );
}
