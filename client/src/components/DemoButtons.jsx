import { useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import ErrorMessage from "./ErrorMessage.jsx";
import SlowServerNote from "./SlowServerNote.jsx";

const demos = [
  { role: "customer", label: "Try as customer" },
  { role: "owner", label: "Try as owner" },
  { role: "admin", label: "Try as admin" },
];

// one-click logins, one for each side of the app
export default function DemoButtons() {
  const { demoLogin } = useAuth();
  const [busyRole, setBusyRole] = useState("");
  const [error, setError] = useState("");

  async function handleClick(role) {
    setBusyRole(role);
    setError("");
    try {
      await demoLogin(role);
    } catch (err) {
      setError(err.message);
      setBusyRole("");
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap justify-center gap-2">
        {demos.map((demo) => (
          <button
            key={demo.role}
            className="btn btn-secondary"
            onClick={() => handleClick(demo.role)}
            disabled={Boolean(busyRole)}
          >
            {busyRole === demo.role ? "Opening..." : demo.label}
          </button>
        ))}
      </div>
      <ErrorMessage message={error} />
      <SlowServerNote waiting={Boolean(busyRole)} />
    </div>
  );
}
