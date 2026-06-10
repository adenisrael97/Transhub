/**
 * Typed application errors. Throw these anywhere; the central error middleware
 * turns them into a consistent JSON response with the right HTTP status.
 * Anything that is NOT an AppError is treated as an unexpected 500.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    // Required when extending built-ins in TypeScript: ensures `instanceof AppError`
    // works correctly regardless of the compilation target.
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid request", details?: unknown) {
    super(400, message, "VALIDATION_ERROR", details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(401, message, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have access to this resource") {
    super(403, message, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(404, message, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  // `code` defaults to the generic CONFLICT but callers can pass a domain-specific
  // code (e.g. TRIP_FULL, HOLD_EXPIRED, INSUFFICIENT_SEATS) so the frontend can
  // show targeted copy instead of string-matching on the message.
  constructor(message = "Resource conflict", code = "CONFLICT", details?: unknown) {
    super(409, message, code, details);
  }
}

export class InsufficientSeatsError extends ConflictError {
  constructor(message = "Not enough seats available on this trip") {
    super(message, "INSUFFICIENT_SEATS");
  }
}

export class HoldExpiredError extends ConflictError {
  constructor(message = "Hold has expired or seats are no longer available") {
    super(message, "HOLD_EXPIRED");
  }
}

export class TooManyRequestsError extends AppError {
  constructor(retryAfterSec: number) {
    super(429, "Too many requests — please slow down and try again later", "RATE_LIMITED", {
      retryAfterSec,
    });
  }
}
