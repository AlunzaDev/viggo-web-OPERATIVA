import { describe, expect, it } from "vitest";
import {
  normalizeOperationalLogItem,
  normalizeOperationalLogsListResponse,
  normalizeOperationalLogsSummary,
} from "./operational-logs.contract";

describe("operational-logs.contract", () => {
  it("normalizes a single operational log item with safe fallbacks", () => {
    const item = normalizeOperationalLogItem({
      id: "log-1",
      kind: "incident",
      scope: "device",
      severity: "critical",
      source: "device",
      type: "heartbeat_lost",
      message: "Heartbeat vencido",
      createdAt: "12345",
      projectName: "AKIA1",
      metadata: { timeoutMs: 45000 },
    });

    expect(item.id).toBe("log-1");
    expect(item.kind).toBe("incident");
    expect(item.scope).toBe("device");
    expect(item.severity).toBe("critical");
    expect(item.source).toBe("device");
    expect(item.createdAt).toBe(12345);
    expect(item.metadata?.timeoutMs).toBe(45000);
  });

  it("normalizes summary counters", () => {
    const summary = normalizeOperationalLogsSummary({
      byKind: { event: "4", incident: 2 },
      bySeverity: { info: 1, warning: "3", critical: 2 },
    });

    expect(summary?.byKind?.event).toBe(4);
    expect(summary?.byKind?.incident).toBe(2);
    expect(summary?.bySeverity?.warning).toBe(3);
    expect(summary?.bySeverity?.critical).toBe(2);
  });

  it("normalizes full paginated operational logs response", () => {
    const result = normalizeOperationalLogsListResponse({
      items: [
        {
          id: "log-1",
          kind: "event",
          scope: "access_flow",
          severity: "info",
          source: "backend",
          type: "barrier_open_requested",
          message: "Apertura solicitada",
          createdAt: 123,
        },
      ],
      pagination: {
        page: 2,
        limit: 20,
        total: 25,
        totalPages: 2,
      },
      summary: {
        byKind: { event: 10, incident: 5 },
        bySeverity: { info: 7, warning: 6, critical: 2 },
      },
    });

    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(2);
    expect(result.total).toBe(25);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.type).toBe("barrier_open_requested");
    expect(result.summary?.byKind?.incident).toBe(5);
  });
});
