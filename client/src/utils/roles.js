// the first page each role sees after logging in
export function homeFor(role) {
  if (role === "owner") return "/owner";
  if (role === "admin") return "/admin";
  return "/turfs";
}
