"use client";

import Link from "next/link";
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
import { copyToClipboard } from "~/lib/clipboard";
import { getEventPath, getEventTabPath } from "~/lib/event-paths";
import { cn } from "~/lib/utils";

interface EventCardProps {
	event: {
		id: string;
		slug?: string | null;
		title: string;
		description?: string | null;
		type: string;
		status: string;
		responseCount?: number;
		createdAt: Date | string;
	};
	onDelete: () => void;
}

export function EventCard({ event, onDelete }: EventCardProps) {
	const router = useRouter();
	const eventPath = getEventPath(event);

	const { publish } = usePublishEvent(event.id);
	const { unpublish } = useUnpublishEvent(event.id);
	const { archive } = useArchiveEvent(event.id);
	const { complete } = useCompleteEvent(event.id);
	const { duplicate } = useDuplicateEvent();

	const handleCopyLink = async (e: React.MouseEvent) => {
		e.stopPropagation();
		const url = `${window.location.origin}${eventPath}`;
		try {
			await copyToClipboard(url);
			toast.success("Event link copied!");
		} catch {
			toast.error("Could not copy link", { description: url });
		}
	};

	const openManage = () => router.push(getEventTabPath(event, "manage"));

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

	const formatDate = (date: Date | string) =>
		new Intl.DateTimeFormat("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		}).format(new Date(date));

	return (
		<Card
			role="button"
			tabIndex={0}
			onClick={openManage}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					openManage();
				}
			}}
			className={cn(
				"card-hover border border-border/50 shadow-sm relative overflow-hidden flex flex-col justify-between",
				"bg-card cursor-pointer group transition-all hover:border-primary/30 hover:shadow-md",
				"min-h-[220px]",
			)}
		>
			<div
				className={cn(
					"absolute top-0 left-0 right-0 h-1 transition-colors",
					event.status === "published"
						? "bg-green-500"
						: event.status === "draft"
							? "bg-amber-500"
							: event.status === "completed"
								? "bg-blue-500"
								: "bg-slate-400",
				)}
			/>

			<CardHeader className="pt-6 pb-2 flex-1">
				<div className="flex items-start justify-between gap-2">
					<div className="flex-1 min-w-0">
						<CardTitle
							className="truncate text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors"
							title={event.title}
						>
							{event.title}
						</CardTitle>
						<CardDescription className="line-clamp-2 mt-1.5 text-sm leading-relaxed text-muted-foreground">
							{event.description || "No description yet — click to add questions and settings."}
						</CardDescription>
					</div>
					<Badge
						variant="outline"
						className={cn(
							"text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase shrink-0",
							getStatusColor(event.status),
						)}
					>
						{event.status}
					</Badge>
				</div>
			</CardHeader>

			<CardContent className="pt-0 pb-4 space-y-3" onClick={(e) => e.stopPropagation()}>
				<div className="flex items-center gap-1.5 flex-wrap">
					<Badge
						variant="outline"
						className={cn(
							"text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase",
							getTypeColor(event.type),
						)}
					>
						{event.type}
					</Badge>
					{event.responseCount !== undefined && (
						<span className="text-[11px] text-muted-foreground font-medium">
							{event.responseCount} {event.responseCount === 1 ? "response" : "responses"}
						</span>
					)}
					<span className="text-[11px] text-muted-foreground font-medium inline-flex items-center gap-1 ml-auto">
						<CalendarDays className="size-3.5" />
						{formatDate(event.createdAt)}
					</span>
				</div>

				<div className="flex items-center gap-2">
					<Button asChild variant="outline" size="sm" className="flex-1 rounded-xl text-xs font-semibold h-9">
						<Link href={eventPath}>
							<ExternalLinkIcon className="size-3.5 mr-1.5" />
							Open
						</Link>
					</Button>
					<Button asChild size="sm" className="flex-1 rounded-xl text-xs font-semibold h-9">
						<Link href={getEventTabPath(event, "manage")}>
							<EditIcon className="size-3.5 mr-1.5" />
							Manage
						</Link>
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								type="button"
								variant="outline"
								size="icon"
								className="shrink-0 rounded-xl size-9"
								aria-label="More actions"
							>
								<MoreVerticalIcon className="size-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-[200px] rounded-xl">
							<DropdownMenuItem asChild>
								<Link href={getEventTabPath(event, "settings")} className="cursor-pointer gap-2">
									<EditIcon className="size-4" />
									Settings
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<Link href={getEventTabPath(event, "results")} className="cursor-pointer gap-2">
									<BarChartIcon className="size-4" />
									Results
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer gap-2">
								<CopyIcon className="size-4" />
								Copy link
							</DropdownMenuItem>

							<DropdownMenuSeparator />

							{event.status === "draft" && (
								<DropdownMenuItem
									onClick={(e) => {
										e.stopPropagation();
										publish();
									}}
									className="cursor-pointer gap-2 text-green-600"
								>
									<PlayIcon className="size-4" />
									Publish live
								</DropdownMenuItem>
							)}
							{event.status === "published" && (
								<>
									<DropdownMenuItem onClick={unpublish} className="cursor-pointer gap-2 text-amber-600">
										<PauseIcon className="size-4" />
										Pause (draft)
									</DropdownMenuItem>
									<DropdownMenuItem onClick={complete} className="cursor-pointer gap-2 text-blue-600">
										<CheckCircleIcon className="size-4" />
										Mark completed
									</DropdownMenuItem>
									<DropdownMenuItem onClick={archive} className="cursor-pointer gap-2">
										<ArchiveIcon className="size-4" />
										Archive
									</DropdownMenuItem>
								</>
							)}
							{event.status === "archived" && (
								<DropdownMenuItem onClick={publish} className="cursor-pointer gap-2 text-green-600">
									<PlayIcon className="size-4" />
									Restore & publish
								</DropdownMenuItem>
							)}
							{event.status === "completed" && (
								<DropdownMenuItem onClick={archive} className="cursor-pointer gap-2">
									<ArchiveIcon className="size-4" />
									Archive
								</DropdownMenuItem>
							)}

							<DropdownMenuItem
								onClick={() => duplicate(event.id)}
								className="cursor-pointer gap-2"
							>
								<FilesIcon className="size-4" />
								Duplicate
							</DropdownMenuItem>

							<DropdownMenuSeparator />
							<DropdownMenuItem
								variant="destructive"
								onClick={onDelete}
								className="cursor-pointer gap-2"
							>
								<TrashIcon className="size-4" />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</CardContent>
		</Card>
	);
}
