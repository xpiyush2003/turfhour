const tones = {
  green: "bg-emerald-100 text-emerald-800",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-800",
  slate: "bg-slate-100 text-slate-700",
};

export default function Badge({ tone = "slate", children }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

const turfTones = { pending: "amber", approved: "green", rejected: "red" };
const turfLabels = {
  pending: "Waiting for approval",
  approved: "Approved",
  rejected: "Rejected",
};

export function TurfStatusBadge({ status }) {
  return <Badge tone={turfTones[status]}>{turfLabels[status]}</Badge>;
}

const bookingTones = {
  upcoming: "green",
  ongoing: "blue",
  completed: "slate",
  cancelled: "red",
};
const bookingLabels = {
  upcoming: "Confirmed",
  ongoing: "Happening now",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function BookingStateBadge({ state }) {
  return <Badge tone={bookingTones[state]}>{bookingLabels[state]}</Badge>;
}
