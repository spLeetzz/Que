"use client";

import { useEvent } from "~/hooks/use-event";
import { EventForm } from "~/components/features/event-form";
import { ItemEditor } from "~/components/features/item-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { LoadingSpinner } from "~/components/shared/loading-spinner";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import Link from "next/link";
import {
	ArrowLeftIcon,
	ExternalLinkIcon,
	BarChart3Icon,
	CopyIcon,
	PlayIcon,
	PauseIcon,
	ArchiveIcon,
	CheckCircleIcon,
} from "lucide-react";
import React from "react";
import { toast } from "sonner";
import {
	usePublishEvent,
	useUnpublishEvent,
	useArchiveEvent,
	useCompleteEvent,
} from "~/hooks/use-event-actions";

export default function EventEditPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = React.use(params);
	const { data: event, isLoading, isError, error } = useEvent(id);

	const { publish } = usePublishEvent(id);
	const { unpublish } = useUnpublishEvent(id);
	const { archive } = useArchiveEvent(id);
	const { complete } = useCompleteEvent(id);

	const handleCopyLink = () => {
		if (!event) return;
		const publicUrl = `${window.location.origin}/events/${event.slug || event.id}`;
		navigator.clipboard.writeText(publicUrl);
		toast.success("Event link copied to clipboard!");
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "published":
				return "default";
			case "draft":
				return "secondary";
			case "archived":
				return "outline";
			case "completed":
				return "destructive";
			default:
				return "outline";
		}
	};

	if (isLoading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<LoadingSpinner />
			</div>
		);
	}

	if (isError || !event) {
		return (
			<div className="container max-w-md py-12">
				<Card>
					<CardContent className="pt-6 space-y-4">
						<p className="text-destructive font-semibold">Error Loading Event</p>
						<p className="text-sm text-muted-foreground">{error?.message || "Event not found"}</p>
						<Button asChild className="w-full">
							<Link href="/events">Back to Dashboard</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container max-w-5xl py-6 space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<Button variant="ghost" size="icon" asChild className="size-8">
							<Link href="/events">
								<ArrowLeftIcon className="size-4" />
							</Link>
						</Button>
						<h1 className="text-2xl font-bold tracking-tight">{event.title}</h1>
						<Badge variant={getStatusColor(event.status)} className="ml-2 uppercase tracking-wider text-[10px] font-bold">
							{event.status}
						</Badge>
					</div>
					<p className="text-sm text-muted-foreground pl-10">
						Edit event settings, configure questions, or view analytics.
					</p>
				</div>
				<div className="flex items-center gap-2 pl-10 sm:pl-0 flex-wrap">
					{/* Status Controls */}
					{event.status === "draft" && (
						<Button variant="default" size="sm" onClick={publish} className="bg-emerald-600 hover:bg-emerald-700 text-white">
							<PlayIcon className="size-4 mr-1.5" />
							Publish Live
						</Button>
					)}
					{event.status === "published" && (
						<>
							<Button variant="outline" size="sm" onClick={unpublish}>
								<PauseIcon className="size-4 mr-1.5 text-amber-600" />
								Pause
							</Button>
							<Button variant="outline" size="sm" onClick={complete}>
								<CheckCircleIcon className="size-4 mr-1.5 text-blue-600" />
								Complete
							</Button>
						</>
					)}
					{event.status === "completed" && (
						<Button variant="outline" size="sm" onClick={archive}>
							<ArchiveIcon className="size-4 mr-1.5 text-muted-foreground" />
							Archive
						</Button>
					)}
					{event.status === "archived" && (
						<Button variant="default" size="sm" onClick={publish} className="bg-emerald-600 hover:bg-emerald-700 text-white">
							<PlayIcon className="size-4 mr-1.5" />
							Publish (Restore)
						</Button>
					)}

					<Button variant="outline" size="sm" onClick={handleCopyLink}>
						<CopyIcon className="size-4 mr-1.5" />
						Copy Link
					</Button>

					<Button variant="outline" size="sm" asChild>
						<Link href={`/events/${id}`} target="_blank">
							<ExternalLinkIcon className="size-4 mr-1.5" />
							View Public
						</Link>
					</Button>
					<Button variant="outline" size="sm" asChild>
						<Link href={`/events/${id}/results`}>
							<BarChart3Icon className="size-4 mr-1.5" />
							Results
						</Link>
					</Button>
				</div>
			</div>

			<Tabs defaultValue="questions" className="space-y-6">
				<TabsList>
					<TabsTrigger value="questions">Questions / Content</TabsTrigger>
					<TabsTrigger value="settings">Event Settings</TabsTrigger>
				</TabsList>

				<TabsContent value="questions" className="space-y-4">
					<ItemEditor eventId={event.id} eventType={event.type} />
				</TabsContent>

				<TabsContent value="settings" className="space-y-4">
					<EventForm eventId={event.id} />
				</TabsContent>
			</Tabs>
		</div>
	);
}
