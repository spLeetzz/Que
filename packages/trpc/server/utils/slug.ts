import { db } from "@repo/database";
import { events } from "@repo/database/schema";
import { and, eq, isNull, ne } from "drizzle-orm";

export function slugifyTitle(title: string): string {
	const base = title
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 60);

	return base || "event";
}

export function normalizeSlugInput(slug: string | null | undefined): string | null {
	if (slug == null || slug.trim() === "") return null;

	const normalized = slug
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9-]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 60);

	return normalized || null;
}

async function slugExists(slug: string, excludeEventId?: string): Promise<boolean> {
	const existing = await db
		.select({ id: events.id })
		.from(events)
		.where(and(eq(events.slug, slug), isNull(events.deletedAt), ne(events.status, "deleted")))
		.limit(1);

	return existing.some((row) => row.id !== excludeEventId);
}

/** Resolves a unique slug from user input or title. */
export async function resolveUniqueSlug(
	preferred: string | null | undefined,
	title: string,
	excludeEventId?: string,
): Promise<string> {
	const base = normalizeSlugInput(preferred) ?? slugifyTitle(title);
	let candidate = base;
	let suffix = 2;

	while (await slugExists(candidate, excludeEventId)) {
		const suffixStr = `-${suffix}`;
		candidate = `${base.slice(0, Math.max(1, 60 - suffixStr.length))}${suffixStr}`;
		suffix += 1;
	}

	return candidate;
}
