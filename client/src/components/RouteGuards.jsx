import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext.js";
import { homeFor } from "../utils/roles.js";
import Spinner from "./Spinner.jsx";

// pages for one role, anyone else is sent to their own home page
export function RoleRoute({ role }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={homeFor(user.role)} replace />;
  return <Outlet />;
}

// landing, login and register are skipped when already logged in
export function PublicRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user) return <Navigate to={homeFor(user.role)} replace />;
  return <Outlet />;
}
