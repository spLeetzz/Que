"use client";

import { useEvent } from "~/hooks/use-event";
import { useSocket } from "~/hooks/use-socket";
import {
	useAnalyticsOverview,
	useAnalyticsTimeline,
	useAbandonmentFunnel,
	useQuestionAnalytics,
	useParticipantJourneys,
	useFullAnalytics,
} from "~/hooks/use-analytics";
import { AnalyticsOverview } from "~/components/analytics/analytics-overview";
import { ResponseTimeline } from "~/components/analytics/response-timeline";
import { AbandonmentFunnel } from "~/components/analytics/abandonment-funnel";
import { QuestionAnalytics } from "~/components/analytics/question-analytics";
import { ParticipantJourneys } from "~/components/analytics/participant-journeys";
import { ExportMenu } from "~/components/analytics/export-menu";
import { LoadingSpinner } from "~/components/shared/loading-spinner";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import Link from "next/link";
import { ArrowLeftIcon, ExternalLinkIcon, ShareIcon } from "lucide-react";
import React from "react";
import { toast } from "sonner";

export default function EventResultsPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = React.use(params);
	const { data: event, isLoading: isLoadingEvent, isError, error } = useEvent(id);

	// Analytics data
	const { data: overview, isLoading: isLoadingOverview } = useAnalyticsOverview(id);
	const { data: timeline, isLoading: isLoadingTimeline } = useAnalyticsTimeline(id);
	const { data: funnel, isLoading: isLoadingFunnel } = useAbandonmentFunnel(id);
	const { data: questions, isLoading: isLoadingQuestions } = useQuestionAnalytics(id);
	const { data: participants, isLoading: isLoadingParticipants } = useParticipantJourneys(id);
	const { data: fullAnalytics } = useFullAnalytics(id);

	// Connect to Sockets to live update this results page!
	const { isConnected, onlineCount } = useSocket(id);

	const handleCopyLink = () => {
		const url = `${window.location.origin}/events/${id}`;
		navigator.clipboard.writeText(url);
		toast.success("Event link copied to clipboard");
	};

	if (isLoadingEvent) {
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
						<p className="text-destructive font-semibold">Error Loading Results</p>
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
		<div className="container max-w-7xl py-6 space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<Button variant="ghost" size="icon" asChild className="size-8">
							<Link href="/events">
								<ArrowLeftIcon className="size-4" />
							</Link>
						</Button>
						<h1 className="text-2xl font-bold tracking-tight">{event.title}</h1>
					</div>
					<p className="text-sm text-muted-foreground pl-10">
						Comprehensive analytics and insights for your event
					</p>
				</div>
				<div className="flex items-center gap-2 pl-10 sm:pl-0">
					{isConnected && (
						<div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs px-3 py-1.5 rounded-full border border-emerald-200/50">
							<span className="relative flex h-2 w-2">
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
								<span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
							</span>
							<span className="font-semibold">{onlineCount} online</span>
						</div>
					)}
					<Button variant="outline" size="sm" onClick={handleCopyLink}>
						<ShareIcon className="size-4" />
						Copy Link
					</Button>
					<Button variant="outline" size="sm" asChild>
						<Link href={`/events/${id}`} target="_blank">
							<ExternalLinkIcon className="size-4" />
							View Public
						</Link>
					</Button>
					{fullAnalytics && <ExportMenu eventTitle={event.title} fullAnalytics={fullAnalytics} />}
				</div>
			</div>

			{/* Overview Metrics */}
			<AnalyticsOverview data={overview} isLoading={isLoadingOverview} />

			{/* Tabs for different views */}
			<Tabs defaultValue="overview" className="space-y-6">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="questions">Questions</TabsTrigger>
					<TabsTrigger value="participants">
						{event.type === "banter" ? "Participants" : "Responses"}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-6">
					{/* Response Timeline */}
					<ResponseTimeline data={timeline} isLoading={isLoadingTimeline} />

					{/* Abandonment Funnel */}
					<AbandonmentFunnel data={funnel} isLoading={isLoadingFunnel} />
				</TabsContent>

				<TabsContent value="questions" className="space-y-6">
					{/* Question Analytics */}
					<QuestionAnalytics data={questions} isLoading={isLoadingQuestions} />
				</TabsContent>

				<TabsContent value="participants" className="space-y-6">
					{/* Participant Journeys */}
					<ParticipantJourneys
						data={participants}
						isLoading={isLoadingParticipants}
						eventType={event.type}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}
