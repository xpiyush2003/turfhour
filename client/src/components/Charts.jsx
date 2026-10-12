import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDate, formatHour, formatShortDate } from "../utils/dates.js";
import { formatMoney } from "../utils/money.js";

const BAR_COLOR = "#059669";
const GRID_COLOR = "#e2e8f0";
const AXIS_TEXT = { fontSize: 12, fill: "#64748b" };
const LABEL_TEXT = { fontSize: 12, fill: "#334155" };

// short labels for the axis, like ₹12k
const compact = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 1,
});

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
      <p className="text-slate-500">{row.title}</p>
      <p className="font-medium text-slate-900">{row.text}</p>
    </div>
  );
}

// one column per day
export function RevenueChart({ data }) {
  const rows = data.map((row) => ({
    ...row,
    label: formatShortDate(row.date),
    title: formatDate(row.date),
    text: formatMoney(row.revenue),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID_COLOR} />
        <XAxis
          dataKey="label"
          tick={AXIS_TEXT}
          axisLine={{ stroke: "#cbd5e1" }}
          tickLine={false}
          interval={5}
        />
        <YAxis
          width={56}
          tick={AXIS_TEXT}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => compact.format(value / 100)}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f1f5f9" }} />
        <Bar
          dataKey="revenue"
          fill={BAR_COLOR}
          radius={[3, 3, 0, 0]}
          maxBarSize={24}
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// one column per hour of the day, taller means busier
export function BusyHoursChart({ data }) {
  const rows = data.map((row) => ({
    ...row,
    label: formatHour(row.hour),
    title: `${formatHour(row.hour)} to ${formatHour(row.hour + 1)}`,
    text: `Booked ${row.bookings} ${row.bookings === 1 ? "time" : "times"}`,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID_COLOR} />
        <XAxis
          dataKey="label"
          tick={AXIS_TEXT}
          axisLine={{ stroke: "#cbd5e1" }}
          tickLine={false}
          interval={2}
        />
        <YAxis
          width={32}
          tick={AXIS_TEXT}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f1f5f9" }} />
        <Bar
          dataKey="bookings"
          fill={BAR_COLOR}
          radius={[3, 3, 0, 0]}
          maxBarSize={24}
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// one horizontal bar per turf, biggest first
export function TurfRevenueChart({ data }) {
  const rows = data
    .toSorted((a, b) => b.revenue - a.revenue)
    .map((row) => ({
      ...row,
      title: row.name,
      text: formatMoney(row.revenue),
    }));

  return (
    <ResponsiveContainer width="100%" height={rows.length * 40 + 8}>
      <BarChart
        data={rows}
        layout="vertical"
        margin={{ top: 0, right: 72, bottom: 0, left: 0 }}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={150}
          tick={AXIS_TEXT}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f1f5f9" }} />
        <Bar
          dataKey="revenue"
          fill={BAR_COLOR}
          radius={[0, 4, 4, 0]}
          barSize={18}
          isAnimationActive={false}
        >
          <LabelList
            dataKey="revenue"
            position="right"
            formatter={(value) => compact.format(value / 100)}
            style={LABEL_TEXT}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
