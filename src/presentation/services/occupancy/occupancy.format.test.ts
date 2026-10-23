import { describe, expect, it } from "vitest";
import { formatParkingTime } from "./occupancy.format";

describe("parking times", () => {
  it("shows times in the parking's zone, with the day when it is not today", () => {
    const now = Date.parse("2026-10-22T18:30:00Z");
    // 08:05 in Mexico City, 07:05 in Tijuana (summer time until November 1st).
    expect(formatParkingTime(Date.parse("2026-10-22T14:05:00Z"), "America/Mexico_City", now)).toBe("08:05");
    expect(formatParkingTime(Date.parse("2026-10-22T14:05:00Z"), "America/Tijuana", now)).toBe("07:05");
    expect(formatParkingTime(Date.parse("2026-10-14T14:05:00Z"), "America/Mexico_City", now)).toMatch(/^14 oct\.? 08:05$/);
  });

});
