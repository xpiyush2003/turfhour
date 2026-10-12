import { useCallback, useState } from "react";
import { approveTurf, getStats, getTurfs, rejectTurf } from "../api/admin.js";
import ErrorMessage from "../components/ErrorMessage.jsx";
import ReasonDialog from "../components/ReasonDialog.jsx";
import Spinner from "../components/Spinner.jsx";
import StatCard from "../components/StatCard.jsx";
import { formatHour } from "../utils/dates.js";
import { formatMoney } from "../utils/money.js";
import { sportLabel } from "../utils/sports.js";
import { useApi } from "../utils/useApi.js";

const tabs = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const emptyText = {
  pending: "No turfs are waiting for approval.",
  approved: "No turfs have been approved yet.",
  rejected: "No turfs have been rejected.",
};

export default function Admin() {
  const [status, setStatus] = useState("pending");
  const [rejecting, setRejecting] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");

  const stats = useApi(getStats);
  const loader = useCallback(() => getTurfs(status), [status]);
  const { data, error, loading, reload } = useApi(loader);

  async function refresh() {
    await Promise.all([reload(), stats.reload()]);
  }

  async function handleApprove(turf) {
    setBusyId(turf.id);
    setActionError("");
    try {
      await approveTurf(turf.id);
    } catch (err) {
      setActionError(err.message);
    }
    await refresh();
    setBusyId(null);
  }

  async function handleReject(reason) {
    await rejectTurf(rejecting.id, reason);
    await refresh();
    setRejecting(null);
  }

  function pickTab(key) {
    setStatus(key);
    setActionError("");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Turf approvals</h1>

      <ErrorMessage message={stats.error} />
      {stats.data && (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Waiting" value={stats.data.pending_turfs} />
          <StatCard label="Approved turfs" value={stats.data.approved_turfs} />
          <StatCard label="Customers" value={stats.data.customers} />
          <StatCard label="Owners" value={stats.data.owners} />
          <StatCard label="Bookings" value={stats.data.bookings} />
        </div>
      )}

      <div>
        <div className="mb-4 flex gap-1" role="tablist">
          {tabs.map((item) => (
            <button
              key={item.key}
              role="tab"
              aria-selected={status === item.key}
              onClick={() => pickTab(item.key)}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium ${
                status === item.key
                  ? "bg-emerald-700 text-white"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <ErrorMessage message={error || actionError} />
        {loading && <Spinner />}

        {data && data.turfs.length === 0 && (
          <div className="card text-center text-sm text-slate-600">
            {emptyText[status]}
          </div>
        )}

        {data && data.turfs.length > 0 && (
          <ul className="space-y-3">
            {data.turfs.map((turf) => (
              <li key={turf.id} className="card">
                <p className="font-semibold text-slate-900">{turf.name}</p>
                <p className="text-xs text-slate-500">
                  {sportLabel(turf.sport)} · {turf.address}, {turf.city}
                </p>
                {turf.description && (
                  <p className="mt-2 text-sm text-slate-700">
                    {turf.description}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-x-8 gap-y-1 text-sm">
                  <p>
                    {formatHour(turf.open_hour)} to{" "}
                    {formatHour(turf.close_hour)}
                  </p>
                  <p>{formatMoney(turf.price_per_hour)} per hour</p>
                  <p className="text-slate-500">
                    Owner: {turf.owner_name}, {turf.owner_email}
                  </p>
                </div>
                {turf.status === "rejected" && (
                  <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    Rejected: {turf.reject_reason}
                  </p>
                )}
                <div className="mt-4 flex gap-2">
                  {turf.status !== "approved" && (
                    <button
                      className="btn btn-primary btn-small"
                      onClick={() => handleApprove(turf)}
                      disabled={busyId === turf.id}
                    >
                      {busyId === turf.id ? "Approving..." : "Approve"}
                    </button>
                  )}
                  {turf.status !== "rejected" && (
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => setRejecting(turf)}
                    >
                      Reject
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {rejecting && (
        <ReasonDialog
          title="Reject this turf?"
          message={`${rejecting.name} will be hidden from customers. The owner will see your reason and can fix the turf and send it again.`}
          placeholder="For example: the address is incomplete"
          confirmLabel="Reject turf"
          onConfirm={handleReject}
          onClose={() => setRejecting(null)}
        />
      )}
    </div>
  );
}
