import { Link } from "react-router";
import DemoButtons from "../components/DemoButtons.jsx";

const features = [
  {
    title: "For players",
    text: "Find a turf near you, see which hours are free on any day and book in a few clicks. Pay at the venue.",
  },
  {
    title: "For turf owners",
    text: "List your turf, set your hours and price, and see every booking and your earnings in one place.",
  },
  {
    title: "No double bookings",
    text: "If two people go for the same hour at the same moment, only one of them gets it.",
  },
];

export default function Landing() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="text-center">
        <p className="text-3xl font-bold text-emerald-800 sm:text-4xl">
          TurfHour
        </p>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Book a sports turf by the hour
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-slate-600">
          Football, cricket, badminton, tennis and basketball. Pick a turf, pick
          a free hour and show up to play.
        </p>
        <div className="mt-8 flex flex-wrap items-start justify-center gap-3">
          <Link to="/register" className="btn btn-primary">
            Sign up
          </Link>
          <Link to="/login" className="btn btn-secondary">
            Log in
          </Link>
        </div>

        <div className="mx-auto mt-10 max-w-xl rounded-xl border border-slate-200 bg-white p-5">
          <p className="font-medium text-slate-900">Just looking around?</p>
          <p className="mt-1 mb-4 text-sm text-slate-600">
            Open a demo account with sample data. There is one for each side of
            the app.
          </p>
          <DemoButtons />
        </div>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.title} className="card">
            <h2 className="font-semibold text-slate-900">{feature.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{feature.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
