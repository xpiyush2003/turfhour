import { useCallback, useState } from "react";
import { Link } from "react-router";
import { getTurfs } from "../api/turfs.js";
import ErrorMessage from "../components/ErrorMessage.jsx";
import Spinner from "../components/Spinner.jsx";
import { formatHour } from "../utils/dates.js";
import { formatMoney } from "../utils/money.js";
import { SPORTS, sportColor, sportLabel } from "../utils/sports.js";
import { useApi } from "../utils/useApi.js";

export default function Turfs() {
  const [city, setCity] = useState("");
  const [sport, setSport] = useState("");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");

  const loader = useCallback(
    () => getTurfs({ city, sport, q }),
    [city, sport, q],
  );
  const { data, error, loading } = useApi(loader);

  function handleSearch(event) {
    event.preventDefault();
    setQ(search.trim());
  }

  function clearFilters() {
    setCity("");
    setSport("");
    setSearch("");
    setQ("");
  }

  const filtered = Boolean(city || sport || q);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Find a turf</h1>

      <form
        onSubmit={handleSearch}
        className="mb-5 grid gap-2 sm:grid-cols-[1fr_1fr_2fr_auto]"
      >
        <select
          className="input"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          aria-label="City"
        >
          <option value="">All cities</option>
          {data?.cities.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={sport}
          onChange={(event) => setSport(event.target.value)}
          aria-label="Sport"
        >
          <option value="">All sports</option>
          {SPORTS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <input
          className="input"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name"
          aria-label="Search by name"
          maxLength={60}
        />
        <button className="btn btn-secondary">Search</button>
      </form>

      <ErrorMessage message={error} />
      {loading && <Spinner />}

      {data && data.turfs.length === 0 && (
        <div className="card text-center">
          <p className="font-medium">No turfs found</p>
          <p className="mt-1 text-sm text-slate-600">
            {filtered
              ? "Try a different city, sport or name."
              : "No turfs have been listed yet. Please check back soon."}
          </p>
          {filtered && (
            <button className="btn btn-secondary mt-4" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      )}

      {data && data.turfs.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.turfs.map((turf) => (
            <li key={turf.id}>
              <Link
                to={`/turfs/${turf.id}`}
                className="block overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-emerald-400"
              >
                <div
                  className={`px-4 py-3 text-sm font-medium text-white ${sportColor(turf.sport)}`}
                >
                  {sportLabel(turf.sport)}
                </div>
                <div className="p-4">
                  <p className="font-semibold text-slate-900">{turf.name}</p>
                  <p className="text-sm text-slate-600">{turf.city}</p>
                  <p className="mt-3 text-xs text-slate-500">
                    Open {formatHour(turf.open_hour)} to{" "}
                    {formatHour(turf.close_hour)}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {formatMoney(turf.price_per_hour)}{" "}
                    <span className="font-normal text-slate-500">per hour</span>
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
