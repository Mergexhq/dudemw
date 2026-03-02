/**
 * Recursively serializes objects returned by Prisma to plain JavaScript objects.
 * Specifically converts Prisma.Decimal objects to numbers because Next.js Server Components
 * cannot pass complex objects (like Decimal) to Client Components.
 * Keeps Date objects intact natively for React Server Components.
 */
export function serializePrisma<T>(obj: T): T {
    if (obj === null || obj === undefined) return obj;

    // Primitives
    if (typeof obj !== 'object') return obj;

    // Keep Dates
    if (obj instanceof Date) return obj;

    // Convert Prisma.Decimal
    if (typeof (obj as any).toNumber === 'function') return (obj as any).toNumber();

    // Arrays
    if (Array.isArray(obj)) {
        return obj.map(item => serializePrisma(item)) as unknown as T;
    }

    // Plain objects
    const res: any = {};
    for (const key of Object.keys(obj)) {
        res[key] = serializePrisma((obj as Record<string, any>)[key]);
    }

    return res as T;
}
