import { describe, expect, it } from "vitest";
import { formatParkingTime, formatStay, occupancyTone } from "./occupancy.format";

describe("occupancy formats", () => {
  it("writes how long a car has been inside", () => {
    expect(formatStay(45)).toBe("45 min");
    expect(formatStay(125)).toBe("2 h 05 min");
    expect(formatStay(8 * 24 * 60 + 300)).toBe("8 d 5 h");
    expect(formatStay(-3)).toBe("0 min");
  });

  it("shows times in the parking's zone, with the day when it is not today", () => {
    const now = Date.parse("2026-10-22T18:30:00Z");
    // 08:05 in Mexico City, 07:05 in Tijuana (summer time until November 1st).
    expect(formatParkingTime(Date.parse("2026-10-22T14:05:00Z"), "America/Mexico_City", now)).toBe("08:05");
    expect(formatParkingTime(Date.parse("2026-10-22T14:05:00Z"), "America/Tijuana", now)).toBe("07:05");
    expect(formatParkingTime(Date.parse("2026-10-14T14:05:00Z"), "America/Mexico_City", now)).toMatch(/^14 oct\.? 08:05$/);
  });

  it("tones the occupancy: none without capacity, warning from 80 %, danger from 95 %", () => {
    expect(occupancyTone(null)).toBe("neutral");
    expect(occupancyTone(30)).toBe("success");
    expect(occupancyTone(85)).toBe("warning");
    expect(occupancyTone(100)).toBe("danger");
  });
});
