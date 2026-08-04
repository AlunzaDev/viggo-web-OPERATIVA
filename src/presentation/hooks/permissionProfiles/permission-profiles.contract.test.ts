import { describe, expect, it } from "vitest";
import {
  normalizePermissionProfileCollection,
  normalizePermissionProfileRecord,
} from "./permission-profiles.contract";

describe("permission-profiles.contract", () => {
  it("normalizes profile record and collection", () => {
    const record = normalizePermissionProfileRecord({
      profile: { _id: "p1", nombre: "Supervisor", modules: ["users"] },
    });
    const collection = normalizePermissionProfileCollection({
      profiles: [{ _id: "p2", nombre: "Caja", modules: ["cashPayments"] }],
    });

    expect(record.nombre).toBe("Supervisor");
    expect(collection[0]?.nombre).toBe("Caja");
  });
});
