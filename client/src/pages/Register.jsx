import { useState } from "react";
import { Link } from "react-router";
import ErrorMessage from "../components/ErrorMessage.jsx";
import SlowServerNote from "../components/SlowServerNote.jsx";
import { useAuth } from "../context/AuthContext.js";

const roles = [
  {
    value: "customer",
    title: "I want to book turfs",
    text: "Browse turfs and book free hours.",
  },
  {
    value: "owner",
    title: "I own a turf",
    text: "List your turf and manage its bookings.",
  },
];

export default function Register() {
  const { register } = useAuth();
  const [role, setRole] = useState("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await register({ name, email, password, role });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <Link
        to="/"
        className="block text-center text-lg font-bold text-emerald-800"
      >
        TurfHour
      </Link>
      <div className="card mt-6">
        <h1 className="mb-4 text-xl font-semibold">Create an account</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="label">What brings you here?</legend>
            {roles.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${
                  role === option.value
                    ? "border-emerald-600 bg-emerald-50"
                    : "border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  className="mt-1 accent-emerald-700"
                  value={option.value}
                  checked={role === option.value}
                  onChange={() => setRole(option.value)}
                />
                <span>
                  <span className="block text-sm font-medium">
                    {option.title}
                  </span>
                  <span className="block text-xs text-slate-600">
                    {option.text}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
          <div>
            <label className="label" htmlFor="register-name">
              Name
            </label>
            <input
              id="register-name"
              className="input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              maxLength={50}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="register-email">
              Email
            </label>
            <input
              id="register-email"
              type="email"
              className="input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="register-password">
              Password
            </label>
            <input
              id="register-password"
              type="password"
              className="input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
            <p className="mt-1 text-xs text-slate-500">
              At least 8 characters.
            </p>
          </div>
          <ErrorMessage message={error} />
          <button className="btn btn-primary w-full" disabled={busy}>
            {busy ? "Creating account..." : "Sign up"}
          </button>
          <SlowServerNote waiting={busy} />
        </form>
      </div>
      <p className="mt-4 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-medium text-emerald-800 hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
