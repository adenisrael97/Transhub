// Public interface — other modules import only from here, never from internals.
export { inventoryService } from "./inventory.service";
export type { HoldResult }  from "./inventory.types";
// inventoryRepository is intentionally NOT exported — table ownership is enforced
// by keeping the repository internal to this module.
