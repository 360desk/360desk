import { createHash } from "node:crypto";

/**
 * Stable UUID derived from TurkiyeAPI numeric IDs so re-seeding is idempotent
 * even when the database uses UUID primary keys.
 */
export function deterministicLocationUuid(
  scope: "city" | "district" | "neighborhood",
  sourceId: number
): string {
  const hash = createHash("sha256")
    .update(`360desk-location:${scope}:${sourceId}`)
    .digest("hex");

  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `4${hash.slice(13, 16)}`,
    hash.slice(16, 20),
    hash.slice(20, 32),
  ].join("-");
}
