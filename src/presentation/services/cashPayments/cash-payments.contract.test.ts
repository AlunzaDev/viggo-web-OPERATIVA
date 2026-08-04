import { describe, expect, it } from "vitest";
import {
  buildCashCountPayload,
  normalizeCashSessionResponse,
  normalizeCashShiftListResponse,
  normalizeResolveQrResponse,
} from "./cash-payments.contract";

describe("cash-payments.contract", () => {
  it("normalizes shift list responses", () => {
    const result = normalizeCashShiftListResponse({
      items: [
        {
          shift: { id: "shift-1", moduloId: "m1", proyectoId: "p1", openedByUserId: "u1", status: "open", openingAmount: 100, openedAt: 1 },
          summary: { openingAmount: 100, totalIn: 10, totalOut: 0, expectedAmount: 110, countedAmount: null, differenceAmount: null, hasCut: false, cutStatus: null },
          movements: [],
          counts: [],
          cut: null,
        },
      ],
      total: 1,
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.shift.id).toBe("shift-1");
  });

  it("normalizes QR resolution payloads", () => {
    const result = normalizeResolveQrResponse({
      ticket: {
        id: "ticket-1",
        idBoleto: "B1",
        usuario: "u1",
        proyecto: "p1",
        monto: 20,
        duracion: 60,
        horaInicio: 1,
        horaCobro: -1,
        pagado: false,
      },
      activeSession: {
        id: "session-1",
        ticketId: "ticket-1",
        idBoleto: "B1",
        status: "created",
        amountExpected: 20,
        amountReceived: 0,
        changeAmount: 0,
        moduloId: "m1",
        startedAt: 1,
        events: [],
      },
    });

    expect(result.ticket.id).toBe("ticket-1");
    expect(result.activeSession?.id).toBe("session-1");
  });

  it("normalizes session wrapper and count payload", () => {
    const session = normalizeCashSessionResponse({
      session: {
        id: "session-2",
        ticketId: "ticket-2",
        idBoleto: "B2",
        status: "paid",
        amountExpected: 30,
        amountReceived: 50,
        changeAmount: 20,
        moduloId: "m2",
        startedAt: 2,
        events: [],
      },
    });

    const payload = buildCashCountPayload(
      [{ label: "$100", value: 100, quantity: "2" }],
      "arqueo",
    );

    expect(session.status).toBe("paid");
    expect(payload.denominations[0]).toEqual({ label: "$100", value: 100, quantity: 2 });
    expect(payload.notes).toBe("arqueo");
  });
});
