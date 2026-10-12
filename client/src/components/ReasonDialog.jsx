import { useState } from "react";
import ErrorMessage from "./ErrorMessage.jsx";
import Modal from "./Modal.jsx";

// like ConfirmDialog, but the person has to say why
export default function ReasonDialog({
  title,
  message,
  placeholder,
  confirmLabel,
  onConfirm,
  onClose,
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onConfirm(reason);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-600">{message}</p>
        <div>
          <label className="label" htmlFor="reason">
            Reason
          </label>
          <textarea
            id="reason"
            className="input"
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={placeholder}
            maxLength={200}
            required
            autoFocus
          />
        </div>
        <ErrorMessage message={error} />
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Go back
          </button>
          <button className="btn btn-danger" disabled={busy}>
            {busy ? "Please wait..." : confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
