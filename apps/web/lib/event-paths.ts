/** Public URL path for an event (prefers slug when set). */
export function getEventPath(event: { id: string; slug?: string | null }): string {
	return `/events/${event.slug || event.id}`;
}

export function getEventTabPath(
	event: { id: string; slug?: string | null },
	tab: string,
): string {
	return `${getEventPath(event)}?tab=${tab}`;
}
