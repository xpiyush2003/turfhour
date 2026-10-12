import {
  addDays,
  formatShortDate,
  todayInIndia,
  weekday,
} from "../utils/dates.js";

const DAYS_AHEAD = 14;

// a row of buttons for today and the next 14 days
export default function DateStrip({ value, onChange }) {
  const today = todayInIndia();
  const dates = [];
  for (let i = 0; i <= DAYS_AHEAD; i++) {
    dates.push(addDays(today, i));
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {dates.map((date) => {
        const selected = date === value;
        return (
          <button
            key={date}
            onClick={() => onChange(date)}
            aria-pressed={selected}
            className={`shrink-0 cursor-pointer rounded-lg border px-3 py-2 text-center text-sm ${
              selected
                ? "border-emerald-700 bg-emerald-700 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span className="block text-xs">
              {date === today ? "Today" : weekday(date)}
            </span>
            <span className="block font-medium whitespace-nowrap">
              {formatShortDate(date)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
