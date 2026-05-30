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
	CalendarDays,
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
				return "bg-blue-500/10 text-blue-500 border-blue-500/25";
			case "poll":
				return "bg-indigo-500/10 text-indigo-500 border-indigo-500/25";
			case "banter":
				return "bg-emerald-500/10 text-emerald-500 border-emerald-500/25";
			default:
				return "bg-muted text-muted-foreground border-border/30";
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "published":
				return "bg-green-500/10 text-green-500 border-green-500/25";
			case "draft":
				return "bg-amber-500/10 text-amber-500 border-amber-500/25";
			case "archived":
				return "bg-slate-500/10 text-slate-500 border-slate-500/25";
			case "completed":
				return "bg-blue-500/10 text-blue-500 border-blue-500/25";
			default:
				return "bg-muted text-muted-foreground border-border/30";
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
		<Card className="card-hover border border-border/50 shadow-sm relative overflow-hidden flex flex-col justify-between h-[210px] bg-card">
			{/* Color indicator stripe depending on status */}
			<div className={`absolute top-0 left-0 right-0 h-1.2 transition-colors duration-300 ${
				event.status === "published" ? "bg-green-500" :
				event.status === "draft" ? "bg-amber-500" :
				event.status === "completed" ? "bg-blue-500" :
				"bg-slate-400"
			}`} />
			
			<CardHeader className="pt-6 pb-2">
				<div className="flex items-start justify-between">
					<div className="flex-1 min-w-0 pr-3">
						<CardTitle className="truncate text-lg font-bold tracking-tight text-foreground" title={event.title}>
							{event.title}
						</CardTitle>
						<CardDescription className="line-clamp-2 mt-1 text-sm leading-relaxed text-muted-foreground min-h-[2.5rem]">
							{event.description || "No description provided."}
						</CardDescription>
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" className="shrink-0 rounded-xl hover:bg-secondary border border-transparent hover:border-border/30 size-8 transition-all">
								<MoreVerticalIcon className="size-4 text-muted-foreground" />
								<span className="sr-only">Open menu</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-[190px] rounded-xl shadow-lg border border-border/60">
							<DropdownMenuItem onClick={() => router.push(`/events/${event.id}/edit`)} className="rounded-lg m-1 px-3 py-2 cursor-pointer gap-2">
								<EditIcon className="size-4 text-muted-foreground" />
								<span>Edit Settings</span>
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => router.push(`/events/${event.id}`)} className="rounded-lg m-1 px-3 py-2 cursor-pointer gap-2">
								<ExternalLinkIcon className="size-4 text-muted-foreground" />
								<span>View Public Page</span>
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => router.push(`/events/${event.id}/results`)} className="rounded-lg m-1 px-3 py-2 cursor-pointer gap-2">
								<BarChartIcon className="size-4 text-muted-foreground" />
								<span>Results</span>
							</DropdownMenuItem>
							<DropdownMenuItem onClick={handleCopyLink} className="rounded-lg m-1 px-3 py-2 cursor-pointer gap-2">
								<CopyIcon className="size-4 text-muted-foreground" />
								<span>Copy Link</span>
							</DropdownMenuItem>

							<DropdownMenuSeparator className="my-1" />

							{/* Dynamic state machine transitions */}
							{event.status === "draft" && (
								<DropdownMenuItem onClick={publish} className="rounded-lg m-1 px-3 py-2 cursor-pointer gap-2 text-green-600 focus:text-green-600 focus:bg-green-500/10">
									<PlayIcon className="size-4" />
									<span>Publish Live</span>
								</DropdownMenuItem>
							)}

							{event.status === "published" && (
								<>
									<DropdownMenuItem onClick={unpublish} className="rounded-lg m-1 px-3 py-2 cursor-pointer gap-2 text-amber-600 focus:text-amber-600 focus:bg-amber-500/10">
										<PauseIcon className="size-4" />
										<span>Pause (Draft)</span>
									</DropdownMenuItem>
									<DropdownMenuItem onClick={complete} className="rounded-lg m-1 px-3 py-2 cursor-pointer gap-2 text-blue-600 focus:text-blue-600 focus:bg-blue-500/10">
										<CheckCircleIcon className="size-4" />
										<span>Mark Completed</span>
									</DropdownMenuItem>
									<DropdownMenuItem onClick={archive} className="rounded-lg m-1 px-3 py-2 cursor-pointer gap-2 text-slate-500 focus:text-slate-500 focus:bg-slate-500/10">
										<ArchiveIcon className="size-4" />
										<span>Archive Event</span>
									</DropdownMenuItem>
								</>
							)}

							{event.status === "archived" && (
								<DropdownMenuItem onClick={publish} className="rounded-lg m-1 px-3 py-2 cursor-pointer gap-2 text-green-600 focus:text-green-600 focus:bg-green-500/10">
									<PlayIcon className="size-4" />
									<span>Restore (Publish)</span>
								</DropdownMenuItem>
							)}

							{event.status === "completed" && (
								<DropdownMenuItem onClick={archive} className="rounded-lg m-1 px-3 py-2 cursor-pointer gap-2 text-slate-500 focus:text-slate-500 focus:bg-slate-500/10">
									<ArchiveIcon className="size-4" />
									<span>Archive Event</span>
								</DropdownMenuItem>
							)}

							<DropdownMenuItem onClick={() => duplicate(event.id)} className="rounded-lg m-1 px-3 py-2 cursor-pointer gap-2">
								<FilesIcon className="size-4 text-muted-foreground" />
								<span>Duplicate Event</span>
							</DropdownMenuItem>

							<DropdownMenuSeparator className="my-1" />
							<DropdownMenuItem variant="destructive" onClick={onDelete} className="rounded-lg m-1 px-3 py-2 cursor-pointer gap-2">
								<TrashIcon className="size-4" />
								<span>Delete Event</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</CardHeader>
			<CardContent className="pt-0">
				<div className="flex items-center justify-between gap-2 border-t border-border/40 pt-3 mb-3">
					<div className="flex items-center gap-1.5 flex-wrap">
						<Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 rounded-lg tracking-wide uppercase ${getTypeColor(event.type)}`}>
							{event.type}
						</Badge>
						<Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 rounded-lg tracking-wide uppercase ${getStatusColor(event.status)}`}>
							{event.status}
						</Badge>
						{event.responseCount !== undefined && (
							<span className="text-[11px] text-muted-foreground font-semibold ml-1">
								• {event.responseCount} {event.responseCount === 1 ? "response" : "responses"}
							</span>
						)}
					</div>
					<div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium shrink-0">
						<CalendarDays className="size-3.5" />
						<span>{formatDate(event.createdAt)}</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
