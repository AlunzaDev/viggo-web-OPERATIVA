import type { ScannerInputMeta } from "../../types/cashPayments/cash-payments.types";

export const SCANNER_MAX_KEY_INTERVAL_MS = 45;
export const SCANNER_IDLE_RESOLVE_MS = 400;
export const SCANNER_MIN_LENGTH = 12;

export const isTicketIdReady = (value: string): boolean =>
  value.trim().length >= SCANNER_MIN_LENGTH;

export type ScannerTypingState = {
  startedAt: number;
  lastKeyAt: number;
  keyCount: number;
};

export const createEmptyScannerTypingState = (): ScannerTypingState => ({
  startedAt: 0,
  lastKeyAt: 0,
  keyCount: 0,
});

export const createEmptyScannerMeta = (): ScannerInputMeta => ({
  isScannerLikely: false,
  lastCompletedInput: null,
});

export const getScannerMetaAfterCharacter = (
  previous: ScannerTypingState,
  now: number,
): {
  typingState: ScannerTypingState;
  isScannerLikely: boolean;
} => {
  const isFastSequence =
    previous.lastKeyAt > 0 && now - previous.lastKeyAt <= SCANNER_MAX_KEY_INTERVAL_MS;
  const keyCount =
    previous.startedAt > 0 && isFastSequence ? previous.keyCount + 1 : 1;
  const startedAt = previous.startedAt > 0 && isFastSequence ? previous.startedAt : now;

  return {
    typingState: {
      startedAt,
      lastKeyAt: now,
      keyCount,
    },
    isScannerLikely:
      keyCount >= 4 && now - startedAt <= keyCount * SCANNER_MAX_KEY_INTERVAL_MS,
  };
};

export const getCompletedInputSource = (
  typingState: ScannerTypingState,
  qrValue: string,
  now: number,
): "scanner" | "manual" => {
  const elapsed =
    typingState.startedAt > 0
      ? now - typingState.startedAt
      : Number.POSITIVE_INFINITY;
  const normalizedValue = qrValue.trim();
  const looksLikeScanner =
    typingState.keyCount >= Math.max(3, normalizedValue.length - 1) &&
    normalizedValue.length >= SCANNER_MIN_LENGTH &&
    elapsed <= Math.max(160, typingState.keyCount * SCANNER_MAX_KEY_INTERVAL_MS + 50);

  return looksLikeScanner ? "scanner" : "manual";
};
