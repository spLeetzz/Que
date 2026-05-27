"use client";

import { useState } from "react";
import { EventList } from "~/components/features/event-list";
import { EventForm } from "~/components/features/event-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { PageHeader } from "~/components/shared/page-header";

export default function EventsPage() {
	const [showCreateDialog, setShowCreateDialog] = useState(false);

	return (
		<div className="space-y-6">
			<PageHeader
				title="Events"
				description="Manage your forms, polls, and banter sessions"
			/>

			<EventList onCreateClick={() => setShowCreateDialog(true)} />

			<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Create New Event</DialogTitle>
					</DialogHeader>
					<EventForm onSuccess={() => setShowCreateDialog(false)} />
				</DialogContent>
			</Dialog>
		</div>
	);
}
