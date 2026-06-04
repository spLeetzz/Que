"use client";

import { EventList } from "~/components/features/event-list";
import { PageHeader } from "~/components/shared/page-header";

export default function EventsPage() {

	return (
		<div className="space-y-6">
			<PageHeader
				title="Events"
				description="Manage your forms, polls, and banter sessions"
			/>

			<EventList />
		</div>
	);
}
