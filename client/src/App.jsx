import { Route, Routes } from "react-router";
import Layout from "./components/Layout.jsx";
import { PublicRoute, RoleRoute } from "./components/RouteGuards.jsx";
import Admin from "./pages/Admin.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import MyBookings from "./pages/MyBookings.jsx";
import NotFound from "./pages/NotFound.jsx";
import OwnerBookings from "./pages/OwnerBookings.jsx";
import OwnerDashboard from "./pages/OwnerDashboard.jsx";
import OwnerTurfs from "./pages/OwnerTurfs.jsx";
import Register from "./pages/Register.jsx";
import TurfDetail from "./pages/TurfDetail.jsx";
import Turfs from "./pages/Turfs.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<RoleRoute role="customer" />}>
        <Route element={<Layout />}>
          <Route path="/turfs" element={<Turfs />} />
          <Route path="/turfs/:id" element={<TurfDetail />} />
          <Route path="/bookings" element={<MyBookings />} />
        </Route>
      </Route>

      <Route element={<RoleRoute role="owner" />}>
        <Route element={<Layout />}>
          <Route path="/owner" element={<OwnerDashboard />} />
          <Route path="/owner/turfs" element={<OwnerTurfs />} />
          <Route path="/owner/bookings" element={<OwnerBookings />} />
        </Route>
      </Route>

      <Route element={<RoleRoute role="admin" />}>
        <Route element={<Layout />}>
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
