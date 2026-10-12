export const SPORTS = [
  { value: "football", label: "Football", color: "bg-emerald-600" },
  { value: "cricket", label: "Cricket", color: "bg-sky-600" },
  { value: "badminton", label: "Badminton", color: "bg-violet-600" },
  { value: "tennis", label: "Tennis", color: "bg-lime-600" },
  { value: "basketball", label: "Basketball", color: "bg-orange-600" },
];

export function sportLabel(value) {
  return SPORTS.find((sport) => sport.value === value)?.label ?? value;
}

export function sportColor(value) {
  return SPORTS.find((sport) => sport.value === value)?.color ?? "bg-slate-600";
}
