export const buildInitials = (...values: Array<string | null | undefined>) => {
  const source = values
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .join(" ")
    .trim();

  const normalizedSource = source || "V";

  return normalizedSource
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};
