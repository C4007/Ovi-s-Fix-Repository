// ============================================================================
// lib/validate-ticker.js
// ============================================================================

const MAX_LINES = 30;

export function validateTicker(input) {
  if (!Array.isArray(input)) return "Expected an array of heading lines.";
  if (input.length > MAX_LINES) return `Too many lines (max ${MAX_LINES}).`;

  for (let i = 0; i < input.length; i++) {
    const item = input[i];
    const label = `Line ${i + 1}`;
    if (!item || typeof item !== "object") return `${label}: not a valid object.`;
    if (typeof item.en !== "string" || !item.en.trim()) return `${label}: English text is required.`;
    if (typeof item.bn !== "string" || !item.bn.trim()) return `${label}: Bangla text is required.`;
  }

  return null;
}
