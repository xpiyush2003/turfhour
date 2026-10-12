import { useState } from "react";
import { formatHour } from "../utils/dates.js";
import { toPaise, toRupees } from "../utils/money.js";
import { SPORTS } from "../utils/sports.js";
import ErrorMessage from "./ErrorMessage.jsx";

const openHours = Array.from({ length: 24 }, (_, hour) => hour);
const closeHours = Array.from({ length: 24 }, (_, hour) => hour + 1);

// used for adding a turf and for editing one
export default function TurfForm({ turf, onSave, onCancel }) {
  const [name, setName] = useState(turf?.name ?? "");
  const [sport, setSport] = useState(turf?.sport ?? "football");
  const [city, setCity] = useState(turf?.city ?? "");
  const [address, setAddress] = useState(turf?.address ?? "");
  const [description, setDescription] = useState(turf?.description ?? "");
  const [openHour, setOpenHour] = useState(turf?.open_hour ?? 6);
  const [closeHour, setCloseHour] = useState(turf?.close_hour ?? 22);
  const [price, setPrice] = useState(turf ? toRupees(turf.price_per_hour) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const pricePerHour = toPaise(price);
    if (pricePerHour === null || pricePerHour < 100) {
      setError("Enter a price of at least ₹1, like 800 or 799.50");
      return;
    }
    if (openHour >= closeHour) {
      setError("Closing time must be after opening time");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await onSave({
        name,
        sport,
        city,
        address,
        description,
        open_hour: openHour,
        close_hour: closeHour,
        price_per_hour: pricePerHour,
      });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="turf-name">
            Turf name
          </label>
          <input
            id="turf-name"
            className="input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={60}
            required
            autoFocus
          />
        </div>
        <div>
          <label className="label" htmlFor="turf-sport">
            Sport
          </label>
          <select
            id="turf-sport"
            className="input"
            value={sport}
            onChange={(event) => setSport(event.target.value)}
          >
            {SPORTS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="turf-city">
            City
          </label>
          <input
            id="turf-city"
            className="input"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            maxLength={40}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="turf-price">
            Price per hour (₹)
          </label>
          <input
            id="turf-price"
            className="input"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            inputMode="decimal"
            placeholder="800"
            required
          />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="turf-address">
          Address
        </label>
        <input
          id="turf-address"
          className="input"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Building, street, area and a landmark"
          maxLength={150}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="turf-description">
          Description (optional)
        </label>
        <textarea
          id="turf-description"
          className="input"
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={500}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="turf-open">
            Opens at
          </label>
          <select
            id="turf-open"
            className="input"
            value={openHour}
            onChange={(event) => setOpenHour(Number(event.target.value))}
          >
            {openHours.map((hour) => (
              <option key={hour} value={hour}>
                {formatHour(hour)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="turf-close">
            Closes at
          </label>
          <select
            id="turf-close"
            className="input"
            value={closeHour}
            onChange={(event) => setCloseHour(Number(event.target.value))}
          >
            {closeHours.map((hour) => (
              <option key={hour} value={hour}>
                {hour === 24 ? "12 am (midnight)" : formatHour(hour)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="text-xs text-slate-500">
        The same hours apply every day. All times are Indian time.
      </p>
      <ErrorMessage message={error} />
      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Go back
        </button>
        <button className="btn btn-primary" disabled={busy}>
          {busy ? "Saving..." : turf ? "Save changes" : "Add turf"}
        </button>
      </div>
    </form>
  );
}
