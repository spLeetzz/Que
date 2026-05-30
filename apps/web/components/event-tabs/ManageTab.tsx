"use client";

import React from "react";
import { ItemEditor } from "~/components/features/item-editor";

interface ManageTabProps {
	eventId: string;
	items: any[];
	eventType: "form" | "poll" | "banter";
}

export function ManageTab({ eventId, eventType }: ManageTabProps) {
	return (
		<div className="space-y-4">
			<div className="space-y-1">
				<h3 className="text-xl font-bold tracking-tight">Form & Question Builder</h3>
				<p className="text-sm text-muted-foreground">
					Design, structure, and organize your questions. Changes are automatically saved in real-time.
				</p>
			</div>
			<div className="pt-2">
				<ItemEditor eventId={eventId} eventType={eventType} />
			</div>
		</div>
	);
}
