/**
 * Public interface for the contact module.
 *
 * Per architecture rule #1 (public-interface), other layers import the contact
 * module only through this file — never its internals (contact.routes.ts).
 */
export { contactRouter } from "./contact.routes";
