import { describe, expect, it, vi } from "vitest";
import { normalizeUserCollection, normalizeUserPayload, normalizeUserRecord, resolveUserImageUrl } from "./user.contract";

vi.mock("../http/axios.instance", () => ({
  api: {
    defaults: {
      baseURL: "http://localhost:3000",
    },
  },
}));

describe("user.contract", () => {
  it("normalizes nested user payloads", () => {
    const payload = normalizeUserPayload({ usuario: { _id: "u1", nombre: "Ceja" } });
    expect(payload.nombre).toBe("Ceja");
  });

  it("normalizes user records and collections", () => {
    const record = normalizeUserRecord({ user: { _id: "u2", nombre: "Dev", img: "/uploads/user.png" } });
    const collection = normalizeUserCollection({ usuarios: [{ _id: "u3", nombre: "Otro" }] });

    expect(record.img).toBe("http://localhost:3000/uploads/user.png");
    expect(collection[0]?.nombre).toBe("Otro");
    expect(resolveUserImageUrl("https://cdn.example.com/user.png")).toBe("https://cdn.example.com/user.png");
  });
});
