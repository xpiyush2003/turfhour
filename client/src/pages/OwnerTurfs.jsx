import { useState } from "react";
import { createTurf, deleteTurf, getTurfs, updateTurf } from "../api/owner.js";
import Badge, { TurfStatusBadge } from "../components/Badge.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";
import Modal from "../components/Modal.jsx";
import Spinner from "../components/Spinner.jsx";
import TurfForm from "../components/TurfForm.jsx";
import { formatHour } from "../utils/dates.js";
import { formatMoney } from "../utils/money.js";
import { sportLabel } from "../utils/sports.js";
import { useApi } from "../utils/useApi.js";

export default function OwnerTurfs() {
  const { data, error, loading, reload } = useApi(getTurfs);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [actionError, setActionError] = useState("");

  async function handleAdd(body) {
    await createTurf(body);
    await reload();
    setAdding(false);
  }

  async function handleEdit(body) {
    await updateTurf(editing.id, body);
    await reload();
    setEditing(null);
  }

  async function handleDelete() {
    await deleteTurf(deleting.id);
    await reload();
    setDeleting(null);
  }

  async function toggleListed(turf) {
    setActionError("");
    try {
      await updateTurf(turf.id, { is_listed: !turf.is_listed });
      await reload();
    } catch (err) {
      setActionError(err.message);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My turfs</h1>
        <button className="btn btn-primary" onClick={() => setAdding(true)}>
          Add turf
        </button>
      </div>

      <ErrorMessage message={error || actionError} />
      {loading && <Spinner />}

      {data && data.turfs.length === 0 && (
        <div className="card text-center">
          <p className="font-medium">You have not added a turf yet</p>
          <p className="mt-1 text-sm text-slate-600">
            Add one and it will be sent for approval. Customers can book it once
            it is approved.
          </p>
        </div>
      )}

      {data && data.turfs.length > 0 && (
        <ul className="space-y-3">
          {data.turfs.map((turf) => (
            <li key={turf.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{turf.name}</p>
                  <p className="text-xs text-slate-500">
                    {sportLabel(turf.sport)} · {turf.address}, {turf.city}
                  </p>
                </div>
                <div className="flex gap-1">
                  <TurfStatusBadge status={turf.status} />
                  {!turf.is_listed && <Badge>Unlisted</Badge>}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-8 gap-y-1 text-sm">
                <p>
                  {formatHour(turf.open_hour)} to {formatHour(turf.close_hour)}
                </p>
                <p>{formatMoney(turf.price_per_hour)} per hour</p>
                <p className="text-slate-500">
                  {turf.booking_count}{" "}
                  {turf.booking_count === 1 ? "booking" : "bookings"} so far
                </p>
              </div>

              {turf.status === "rejected" && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  Rejected: {turf.reject_reason} Edit the turf to send it for
                  approval again.
                </p>
              )}
              {turf.status === "pending" && (
                <p className="mt-3 text-sm text-slate-600">
                  Customers will see this turf once an admin approves it.
                </p>
              )}
              {turf.status === "approved" && !turf.is_listed && (
                <p className="mt-3 text-sm text-slate-600">
                  Hidden from customers. Existing bookings are not affected.
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => setEditing(turf)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => toggleListed(turf)}
                >
                  {turf.is_listed ? "Unlist" : "List again"}
                </button>
                {turf.booking_count === 0 && (
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => setDeleting(turf)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <Modal title="Add a turf" onClose={() => setAdding(false)} wide>
          <TurfForm onSave={handleAdd} onCancel={() => setAdding(false)} />
        </Modal>
      )}

      {editing && (
        <Modal title="Edit turf" onClose={() => setEditing(null)} wide>
          <TurfForm
            turf={editing}
            onSave={handleEdit}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete this turf?"
          message={`${deleting.name} will be removed for good.`}
          confirmLabel="Delete turf"
          onConfirm={handleDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
