/**
 * PostgREST often returns `numeric` columns as strings. Coerce to finite numbers
 * so admin forms, menu math, and cart pricing match the database.
 */
export function n(value: unknown, fallback = 0): number {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() === '') return fallback;
    const parsed = parseFloat(String(value));
    return Number.isFinite(parsed) ? parsed : fallback;
}

export function nint(value: unknown, fallback = 0): number {
    return Math.trunc(n(value, fallback));
}

export function nOrNull(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string' && value.trim() === '') return null;
    const parsed = n(value, NaN);
    return Number.isFinite(parsed) ? parsed : null;
}
