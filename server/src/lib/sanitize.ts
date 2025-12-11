const stripHtml = (text: string): string =>
  text.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

// Keep links intact; we only strip HTML for safety.
const sanitizeText = (value: string): string => stripHtml(value);

export type Json = Record<string, unknown> | Array<unknown> | string | number | boolean | null;

export const sanitizeJson = (input: unknown): Json => {
  if (typeof input === "string") {
    return sanitizeText(input);
  }
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeJson(item)) as Json;
  }
  if (input && typeof input === "object") {
    const output: Record<string, Json> = {};
    for (const [key, value] of Object.entries(input)) {
      // Drop tokens or fields that could carry credentials
      if (/token|cookie|session/i.test(key)) continue;
      output[key] = sanitizeJson(value as Json);
    }
    return output;
  }
  return input as Json;
};
