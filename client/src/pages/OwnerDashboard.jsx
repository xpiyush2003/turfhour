import { Link } from "react-router";
import { getDashboard } from "../api/owner.js";
import {
  BusyHoursChart,
  RevenueChart,
  TurfRevenueChart,
} from "../components/Charts.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";
import Spinner from "../components/Spinner.jsx";
import StatCard from "../components/StatCard.jsx";
import { useAuth } from "../context/AuthContext.js";
import { formatMoney } from "../utils/money.js";
import { useApi } from "../utils/useApi.js";

function ChartCard({ title, note, empty, children }) {
  return (
    <section className="card">
      <h2 className="font-semibold">{title}</h2>
      <p className="mb-4 text-xs text-slate-500">{note}</p>
      {empty ? (
        <p className="py-10 text-center text-sm text-slate-500">
          No bookings in the last 30 days.
        </p>
      ) : (
        children
      )}
    </section>
  );
}

export default function OwnerDashboard() {
  const { user } = useAuth();
  const { data, error, loading } = useApi(getDashboard);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;

  const firstName = user.name.split(" ")[0];
  const noBookings = data.hours_booked === 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Hi, {firstName}</h1>

      {data.by_turf.length === 0 ? (
        <div className="card text-center">
          <p className="font-medium">Welcome to TurfHour</p>
          <p className="mt-1 text-sm text-slate-600">
            Add your first turf. Customers can book it once it is approved.
          </p>
          <Link to="/owner/turfs" className="btn btn-primary mt-4">
            Go to my turfs
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Revenue"
              value={formatMoney(data.revenue)}
              note="Last 30 days, paid at the venue"
            />
            <StatCard
              label="Hours booked"
              value={data.hours_booked}
              note="Last 30 days"
            />
            <StatCard
              label="Upcoming bookings"
              value={data.upcoming_bookings}
              note="From now on"
            />
            <StatCard
              label="Cancelled"
              value={`${data.cancelled_percent}%`}
              note="Of bookings in the last 30 days"
            />
          </div>

          <ChartCard
            title="Revenue per day"
            note="Confirmed bookings, last 30 days"
            empty={noBookings}
          >
            <RevenueChart data={data.by_day} />
          </ChartCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Busiest hours"
              note="How often each hour was booked, last 30 days"
              empty={noBookings}
            >
              <BusyHoursChart data={data.by_hour} />
            </ChartCard>
            <ChartCard
              title="Revenue per turf"
              note="Confirmed bookings, last 30 days"
              empty={noBookings}
            >
              <TurfRevenueChart data={data.by_turf} />
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
