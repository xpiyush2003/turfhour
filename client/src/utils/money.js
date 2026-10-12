const rupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});
const wholeRupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

// 120000 -> "₹1,200", 120050 -> "₹1,200.50"
export function formatMoney(paise) {
  const format = paise % 100 === 0 ? wholeRupees : rupees;
  return format.format(paise / 100);
}

// "1200.50" -> 120050, or null if it is not a valid amount
export function toPaise(text) {
  const value = String(text).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const [whole, decimals = ""] = value.split(".");
  return Number(whole) * 100 + Number(decimals.padEnd(2, "0"));
}

// 120050 -> "1200.5", for filling in a form
export function toRupees(paise) {
  return String(paise / 100);
}
