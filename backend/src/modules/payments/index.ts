// Public interface — other modules import only from here, never from internals.
export { paymentsRouter }     from "./payments.routes";
export { paymentsController } from "./payments.controller";
export { paymentsService }    from "./payments.service";
// Type-only — lets charters/waybills reuse the Paystack verification result
// without a runtime dependency on the payments module (no import cycle).
export type { VerifiedTransaction, TxState, VerifyOutcome } from "./payments.service";
