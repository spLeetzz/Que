"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { UsersIcon, CheckCircle2Icon, ClockIcon, XCircleIcon } from "lucide-react";
import { Skeleton } from "~/components/ui/skeleton";

interface AnalyticsOverviewProps {
	data: {
		totalResponses: number;
		totalParticipants: number;
		completionRate: number;
		averageTimeToComplete: number | null;
		abandonmentRate: number;
		responseRate: number;
	} | undefined;
	isLoading: boolean;
}

function formatTime(seconds: number | null): string {
	if (seconds === null) return "N/A";
	if (seconds < 60) return `${seconds}s`;
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}

function formatPercentage(value: number): string {
	return `${Math.round(value * 100)}%`;
}

export function AnalyticsOverview({ data, isLoading }: AnalyticsOverviewProps) {
	if (isLoading) {
		return (
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{[...Array(4)].map((_, i) => (
					<Card key={i}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-4 rounded-full" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-16 mb-1" />
							<Skeleton className="h-3 w-32" />
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	if (!data) return null;

	const metrics = [
		{
			title: "Total Responses",
			value: data.totalResponses,
			description: `${data.totalParticipants} participants`,
			icon: UsersIcon,
			color: "text-blue-600",
		},
		{
			title: "Completion Rate",
			value: formatPercentage(data.completionRate),
			description: `${Math.round(data.totalParticipants * data.completionRate)} completed`,
			icon: CheckCircle2Icon,
			color: "text-green-600",
		},
		{
			title: "Avg. Time",
			value: formatTime(data.averageTimeToComplete),
			description: "to complete",
			icon: ClockIcon,
			color: "text-amber-600",
		},
		{
			title: "Abandonment Rate",
			value: formatPercentage(data.abandonmentRate),
			description: `${Math.round(data.totalParticipants * data.abandonmentRate)} abandoned`,
			icon: XCircleIcon,
			color: "text-red-600",
		},
	];

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{metrics.map((metric) => {
				const Icon = metric.icon;
				return (
					<Card key={metric.title}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
							<Icon className={`h-4 w-4 ${metric.color}`} />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{metric.value}</div>
							<p className="text-xs text-muted-foreground">{metric.description}</p>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}
