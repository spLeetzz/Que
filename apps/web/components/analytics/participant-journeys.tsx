"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { CheckCircle2Icon, XCircleIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Skeleton } from "~/components/ui/skeleton";

interface ParticipantJourneysProps {
	data:
		| {
				participantId: string;
				alias: string;
				joinedAt: string | Date;
				submittedAt: string | Date | null;
				timeSpent: number | null;
				lastSeenItemId: string | null;
				lastSeenQuestionText: string | null;
				completed: boolean;
				answeredQuestions: number;
				totalQuestions: number;
				progressPercentage: number;
		  }[]
		| undefined;
	isLoading: boolean;
	eventType?: string;
}

function formatTime(seconds: number | null): string {
	if (seconds === null) return "-";
	if (seconds < 60) return `${seconds}s`;
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}

function formatDateTime(date: string | Date): string {
	return new Date(date).toLocaleString("en-US", {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
}

export function ParticipantJourneys({ data, isLoading, eventType = "banter" }: ParticipantJourneysProps) {
	const [filter, setFilter] = useState<"all" | "completed" | "abandoned">("all");
	const [page, setPage] = useState(1);
	const pageSize = 10;

	const isBanter = eventType === "banter";

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-4 w-64 mt-2" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-[400px] w-full" />
				</CardContent>
			</Card>
		);
	}

	if (!data || data.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{isBanter ? "Participant Journeys" : "Submissions"}</CardTitle>
					<CardDescription>
						{isBanter
							? "Individual participant progress and completion"
							: "Individual submission details and answers"}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center h-[200px] text-muted-foreground">
						{isBanter ? "No participants yet" : "No responses yet"}
					</div>
				</CardContent>
			</Card>
		);
	}

	// Filter data
	const filteredData = data.filter((p) => {
		if (filter === "completed") return p.completed;
		if (filter === "abandoned") return !p.completed;
		return true;
	});

	// Paginate
	const totalPages = Math.ceil(filteredData.length / pageSize);
	const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize);

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>{isBanter ? "Participant Journeys" : "Submissions"}</CardTitle>
						<CardDescription>
							{isBanter
								? `Individual participant progress and completion (${filteredData.length} participants)`
								: `Individual submission details and answers (${filteredData.length} responses)`}
						</CardDescription>
					</div>
					{isBanter && (
						<Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
							<SelectTrigger className="w-[150px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All</SelectItem>
								<SelectItem value="completed">Completed</SelectItem>
								<SelectItem value="abandoned">Abandoned</SelectItem>
							</SelectContent>
						</Select>
					)}
				</div>
			</CardHeader>
			<CardContent>
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{isBanter ? "Participant" : "Respondent"}</TableHead>
								<TableHead>{isBanter ? "Joined" : "Submitted"}</TableHead>
								{isBanter && <TableHead>Status</TableHead>}
								<TableHead>Progress</TableHead>
								{isBanter && <TableHead>Time Spent</TableHead>}
								{isBanter && <TableHead>Last Seen</TableHead>}
							</TableRow>
						</TableHeader>
						<TableBody>
							{paginatedData.map((participant) => (
								<TableRow key={participant.participantId}>
									<TableCell className="font-medium">{participant.alias}</TableCell>
									<TableCell className="text-sm text-muted-foreground">
										{formatDateTime(participant.joinedAt)}
									</TableCell>
									{isBanter && (
										<TableCell>
											{participant.completed ? (
												<Badge variant="default" className="gap-1">
													<CheckCircle2Icon className="h-3 w-3" />
													Completed
												</Badge>
											) : (
												<Badge variant="secondary" className="gap-1">
													<XCircleIcon className="h-3 w-3" />
													Abandoned
												</Badge>
											)}
										</TableCell>
									)}
									<TableCell>
										<div className="flex items-center gap-2">
											<div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[100px]">
												<div
													className="h-full bg-primary transition-all"
													style={{
														width: `${participant.progressPercentage * 100}%`,
													}}
												/>
											</div>
											<span className="text-xs text-muted-foreground">
												{participant.answeredQuestions}/{participant.totalQuestions}
											</span>
										</div>
									</TableCell>
									{isBanter && <TableCell className="text-sm">{formatTime(participant.timeSpent)}</TableCell>}
									{isBanter && (
										<TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
											{participant.lastSeenQuestionText || "-"}
										</TableCell>
									)}
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>

				{totalPages > 1 && (
					<div className="flex items-center justify-between mt-4">
						<div className="text-sm text-muted-foreground">
							Page {page} of {totalPages}
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								disabled={page === 1}
							>
								<ChevronLeftIcon className="h-4 w-4" />
								Previous
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
								disabled={page === totalPages}
							>
								Next
								<ChevronRightIcon className="h-4 w-4" />
							</Button>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
