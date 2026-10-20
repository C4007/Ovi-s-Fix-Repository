// ============================================================================
// lib/validate-services.js — sanity-checks a services array before it's
// written to storage, so a slip in the admin UI can't corrupt the data the
// live site reads on every visit.
// ============================================================================

const MAX_ITEMS = 200;

/** Returns an error message string, or null if the input is valid. */
export function validateServices(input) {
  if (!Array.isArray(input)) return "Expected an array of services.";
  if (input.length > MAX_ITEMS) return `Too many services (max ${MAX_ITEMS}).`;

  const seenIds = new Set();

  for (let i = 0; i < input.length; i++) {
    const item = input[i];
    const label = `Item ${i + 1}`;

    if (!item || typeof item !== "object") return `${label}: not a valid object.`;
    if (!item.id || typeof item.id !== "string" || !item.id.trim()) {
      return `${label}: missing an id.`;
    }
    if (seenIds.has(item.id)) return `${label}: duplicate id "${item.id}".`;
    seenIds.add(item.id);

    if (!item.free && typeof item.price !== "number") {
      return `${label} (${item.id}): price must be a number (or mark it "free").`;
    }
    if (item.price !== undefined && (typeof item.price !== "number" || item.price < 0)) {
      return `${label} (${item.id}): price must be a non-negative number.`;
    }

    for (const field of ["title", "desc", "unit"]) {
      const value = item[field];
      if (!value || typeof value.en !== "string" || typeof value.bn !== "string") {
        return `${label} (${item.id}): ${field}.en and ${field}.bn are required.`;
      }
    }
  }

  return null;
}
