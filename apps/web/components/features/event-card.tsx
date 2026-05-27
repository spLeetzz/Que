"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
	MoreVerticalIcon,
	EditIcon,
	TrashIcon,
	ExternalLinkIcon,
	BarChartIcon,
	PlayIcon,
	PauseIcon,
	ArchiveIcon,
	CheckCircleIcon,
	CopyIcon,
	FilesIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
	usePublishEvent,
	useUnpublishEvent,
	useArchiveEvent,
	useCompleteEvent,
	useDuplicateEvent,
} from "~/hooks/use-event-actions";

interface EventCardProps {
	event: any;
	onDelete: () => void;
}

export function EventCard({ event, onDelete }: EventCardProps) {
	const router = useRouter();

	const { publish } = usePublishEvent(event.id);
	const { unpublish } = useUnpublishEvent(event.id);
	const { archive } = useArchiveEvent(event.id);
	const { complete } = useCompleteEvent(event.id);
	const { duplicate } = useDuplicateEvent();

	const handleCopyLink = () => {
		const publicUrl = `${window.location.origin}/events/${event.slug || event.id}`;
		navigator.clipboard.writeText(publicUrl);
		toast.success("Event link copied to clipboard!");
	};

	const getTypeColor = (type: string) => {
		switch (type) {
			case "form":
				return "default";
			case "poll":
				return "secondary";
			case "banter":
				return "outline";
			default:
				return "default";
		}
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

	const formatDate = (date: Date) => {
		return new Intl.DateTimeFormat("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		}).format(new Date(date));
	};

	return (
		<Card className="hover:shadow-md transition-shadow relative overflow-hidden">
			{/* Color indicator stripe depending on status */}
			<div className={`absolute top-0 left-0 right-0 h-1 ${
				event.status === "published" ? "bg-emerald-500" :
				event.status === "draft" ? "bg-amber-500" :
				event.status === "completed" ? "bg-blue-500" :
				"bg-muted-foreground/30"
			}`} />
			
			<CardHeader className="pt-5">
				<div className="flex items-start justify-between">
					<div className="flex-1 min-w-0">
						<CardTitle className="truncate text-lg font-bold">{event.title}</CardTitle>
						<CardDescription className="line-clamp-2 mt-1 min-h-[2.5rem]">
							{event.description || "No description provided."}
						</CardDescription>
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" className="shrink-0 ml-2">
								<MoreVerticalIcon className="size-4" />
								<span className="sr-only">Open menu</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-[180px]">
							<DropdownMenuItem onClick={() => router.push(`/events/${event.id}/edit`)}>
								<EditIcon className="size-4 mr-2" />
								Edit Settings
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => router.push(`/events/${event.id}`)}>
								<ExternalLinkIcon className="size-4 mr-2" />
								View Public Page
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => router.push(`/events/${event.id}/results`)}>
								<BarChartIcon className="size-4 mr-2" />
								Results
							</DropdownMenuItem>
							<DropdownMenuItem onClick={handleCopyLink}>
								<CopyIcon className="size-4 mr-2" />
								Copy Link
							</DropdownMenuItem>

							<DropdownMenuSeparator />

							{/* Dynamic state machine transitions */}
							{event.status === "draft" && (
								<DropdownMenuItem onClick={publish}>
									<PlayIcon className="size-4 mr-2 text-emerald-600" />
									Publish Live
								</DropdownMenuItem>
							)}

							{event.status === "published" && (
								<>
									<DropdownMenuItem onClick={unpublish}>
										<PauseIcon className="size-4 mr-2 text-amber-600" />
										Pause (Draft)
									</DropdownMenuItem>
									<DropdownMenuItem onClick={complete}>
										<CheckCircleIcon className="size-4 mr-2 text-blue-600" />
										Mark Completed
									</DropdownMenuItem>
									<DropdownMenuItem onClick={archive}>
										<ArchiveIcon className="size-4 mr-2 text-muted-foreground" />
										Archive Event
									</DropdownMenuItem>
								</>
							)}

							{event.status === "archived" && (
								<DropdownMenuItem onClick={publish}>
									<PlayIcon className="size-4 mr-2 text-emerald-600" />
									Restore (Publish)
								</DropdownMenuItem>
							)}

							{event.status === "completed" && (
								<DropdownMenuItem onClick={archive}>
									<ArchiveIcon className="size-4 mr-2 text-muted-foreground" />
									Archive Event
								</DropdownMenuItem>
							)}

							<DropdownMenuItem onClick={() => duplicate(event.id)}>
								<FilesIcon className="size-4 mr-2" />
								Duplicate Event
							</DropdownMenuItem>

							<DropdownMenuSeparator />
							<DropdownMenuItem variant="destructive" onClick={onDelete}>
								<TrashIcon className="size-4 mr-2" />
								Delete Event
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</CardHeader>
			<CardContent>
				<div className="flex items-center justify-between gap-2 border-t pt-3">
					<div className="flex items-center gap-2 flex-wrap">
						<Badge variant={getTypeColor(event.type)} className="text-[10px] uppercase font-bold tracking-wider">{event.type}</Badge>
						<Badge variant={getStatusColor(event.status)} className="text-[10px] uppercase font-bold tracking-wider">{event.status}</Badge>
						{event.responseCount !== undefined && (
							<span className="text-xs text-muted-foreground font-medium">
								• {event.responseCount} {event.responseCount === 1 ? "response" : "responses"}
							</span>
						)}
					</div>
					<span className="text-xs text-muted-foreground shrink-0 font-medium">
						{formatDate(event.createdAt)}
					</span>
				</div>
			</CardContent>
		</Card>
	);
}
