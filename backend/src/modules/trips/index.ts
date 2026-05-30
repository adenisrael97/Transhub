/** Public interface for the trips module. Other modules import only from here. */
export { tripsRouter } from "./trips.routes";
export { tripsService } from "./trips.service";
export type { TripDTO } from "./trips.repository";
