import { Link, NavLink, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext.js";
import { homeFor } from "../utils/roles.js";

const links = {
  customer: [
    { to: "/turfs", label: "Turfs" },
    { to: "/bookings", label: "My bookings" },
  ],
  owner: [
    { to: "/owner", label: "Dashboard" },
    { to: "/owner/turfs", label: "My turfs" },
    { to: "/owner/bookings", label: "Bookings" },
  ],
  admin: [{ to: "/admin", label: "Turfs" }],
};

function linkClass({ isActive }) {
  const base = "rounded-lg px-3 py-1.5 text-sm font-medium";
  return isActive
    ? `${base} bg-emerald-50 text-emerald-800`
    : `${base} text-slate-600 hover:bg-slate-100`;
}

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link
            to={homeFor(user.role)}
            className="text-lg font-bold text-emerald-800"
          >
            TurfHour
          </Link>
          <nav className="order-3 flex w-full gap-1 sm:order-none sm:w-auto">
            {links[user.role].map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={linkClass}
                end={link.to === "/owner"}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-slate-600">
              {user.name}
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 capitalize">
                {user.role}
              </span>
              {user.is_demo && (
                <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                  Demo
                </span>
              )}
            </span>
            <button className="btn btn-secondary btn-small" onClick={logout}>
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
