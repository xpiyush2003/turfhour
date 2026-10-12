// an error that carries the HTTP status to send back
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const SLOT_TAKEN =
  "Someone just booked that slot. Please pick another time.";
