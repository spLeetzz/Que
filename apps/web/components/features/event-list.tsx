"use client";

import { useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "~/components/ui/alert-dialog";
import { SearchIcon, PlusIcon } from "lucide-react";
import { useEvents } from "~/hooks/use-events";
import { useDeleteEvent } from "~/hooks/use-delete-event";
import { EventCard } from "./event-card";
import { LoadingSpinner } from "~/components/shared/loading-spinner";
import { EmptyState } from "~/components/shared/empty-state";
import type { EventType, EventStatus } from "@repo/trpc/server/modules/events";

interface EventListProps {
	onCreateClick?: () => void;
}

export function EventList({ onCreateClick }: EventListProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [typeFilter, setTypeFilter] = useState<EventType | "all">("all");
	const [statusFilter, setStatusFilter] = useState<EventStatus | "all">("all");
	const [deleteEventId, setDeleteEventId] = useState<string | null>(null);

	const { data, isLoading, isError, error } = useEvents({
		type: typeFilter === "all" ? undefined : typeFilter,
		status: statusFilter === "all" ? undefined : statusFilter,
	});

	const deleteEvent = useDeleteEvent(deleteEventId ?? "");

	const handleDeleteConfirm = async () => {
		if (deleteEventId) {
			await deleteEvent.mutateAsync();
			setDeleteEventId(null);
		}
	};

	const filteredEvents = data?.events.filter((event) =>
		event.title.toLowerCase().includes(searchQuery.toLowerCase())
	) ?? [];

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<LoadingSpinner />
			</div>
		);
	}

	if (isError) {
		return (
			<Card>
				<CardContent className="pt-6">
					<p className="text-destructive">Error loading events: {error?.message}</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-col sm:flex-row gap-4">
				<div className="relative flex-1">
					<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
					<Input
						placeholder="Search events by title..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>
				<Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as EventType | "all")}>
					<SelectTrigger className="w-full sm:w-[150px]">
						<SelectValue placeholder="Type" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Types</SelectItem>
						<SelectItem value="form">Form</SelectItem>
						<SelectItem value="poll">Poll</SelectItem>
						<SelectItem value="banter">Banter</SelectItem>
					</SelectContent>
				</Select>
				<Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as EventStatus | "all")}>
					<SelectTrigger className="w-full sm:w-[150px]">
						<SelectValue placeholder="Status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Status</SelectItem>
						<SelectItem value="draft">Draft</SelectItem>
						<SelectItem value="published">Published</SelectItem>
						<SelectItem value="archived">Archived</SelectItem>
						<SelectItem value="completed">Completed</SelectItem>
					</SelectContent>
				</Select>
				{onCreateClick && (
					<Button onClick={onCreateClick} className="shrink-0">
						<PlusIcon className="size-4" />
						Create Event
					</Button>
				)}
			</div>

			{filteredEvents.length === 0 ? (
				<EmptyState
					title="No events found"
					description={searchQuery ? "Try adjusting your search or filters" : "Get started by creating your first event"}
					action={onCreateClick ? { label: "Create Event", onClick: onCreateClick } : undefined}
				/>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{filteredEvents.map((event) => (
						<EventCard
							key={event.id}
							event={event}
							onDelete={() => setDeleteEventId(event.id)}
						/>
					))}
				</div>
			)}

			<AlertDialog open={!!deleteEventId} onOpenChange={(open) => !open && setDeleteEventId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Event</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this event? This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleDeleteConfirm} disabled={deleteEvent.isLoading}>
							{deleteEvent.isLoading ? "Deleting..." : "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
