import { describe, expect, it } from "vitest";
import {
  normalizeProjectCollection,
  normalizeProjectPage,
  normalizeProjectRecord,
} from "./parking.contract";

describe("parking.contract", () => {
  it("normalizes project records and image paths", () => {
    const project = normalizeProjectRecord({
      proyecto: {
        _id: "p1",
        nombre: "AKIA",
        img: "uploads/projects/akia.png",
      },
    });

    expect(project._id).toBe("p1");
    expect(project.img).toBe("/uploads/projects/akia.png");
  });

  it("normalizes project collections and paginated responses", () => {
    const items = normalizeProjectCollection({
      proyectos: [{ _id: "p1", nombre: "AKIA" }],
    });

    expect(items).toHaveLength(1);

    const page = normalizeProjectPage(
      { proyectos: [{ _id: "p2", nombre: "ACCESSONE" }], total: 1 },
      1,
      10,
    );

    expect(page.items).toHaveLength(1);
    expect(page.items[0]?._id).toBe("p2");
  });
});
