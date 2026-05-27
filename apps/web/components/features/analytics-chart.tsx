"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useResponseAnalytics } from "~/hooks/use-response-analytics";
import { useItems } from "~/hooks/use-items";
import { LoadingSpinner } from "~/components/shared/loading-spinner";

interface AnalyticsChartProps {
	eventId: string;
}

export function AnalyticsChart({ eventId }: AnalyticsChartProps) {
	const { data: analytics, isLoading: loadingAnalytics } = useResponseAnalytics(eventId);
	const { data: items, isLoading: loadingItems } = useItems(eventId);

	if (loadingAnalytics || loadingItems) {
		return <div className="flex justify-center py-8"><LoadingSpinner /></div>;
	}

	if (!analytics) {
		return (
			<Card>
				<CardContent className="pt-6 text-center text-muted-foreground">
					No analytics data available yet.
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			<div className="grid gap-4 sm:grid-cols-3">
				<Card>
					<CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Responses</CardTitle></CardHeader>
					<CardContent><p className="text-2xl font-bold">{analytics.totalResponses}</p></CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Questions</CardTitle></CardHeader>
					<CardContent><p className="text-2xl font-bold">{items?.filter((i: any) => i.category === "question").length ?? 0}</p></CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Latest Activity</CardTitle></CardHeader>
					<CardContent>
						<p className="text-2xl font-bold">
							{analytics.responseTrend.length > 0
								? analytics.responseTrend[analytics.responseTrend.length - 1]?.date ?? "N/A"
								: "N/A"}
						</p>
					</CardContent>
				</Card>
			</div>

			{analytics.responseTrend.length > 0 && (
				<Card>
					<CardHeader><CardTitle>Response Trend</CardTitle></CardHeader>
					<CardContent>
						<div className="space-y-2">
							{analytics.responseTrend.map((entry) => (
								<div key={entry.date} className="flex items-center gap-3">
									<span className="text-sm text-muted-foreground w-24 shrink-0">{entry.date}</span>
									<div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
										<div
											className="bg-primary h-full rounded-full transition-all"
											style={{ width: `${Math.min((entry.count / analytics.totalResponses) * 100, 100)}%` }}
										/>
									</div>
									<span className="text-sm font-medium w-8 text-right">{entry.count}</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
