"use client";

import { useState } from "react";
import { useEvents } from "~/hooks/use-events";
import { AnalyticsChart } from "~/components/features/analytics-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { PageHeader } from "~/components/shared/page-header";
import { LoadingSpinner } from "~/components/shared/loading-spinner";

export default function AnalyticsPage() {
	const { data, isLoading } = useEvents();
	const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

	const events = data?.events ?? [];

	return (
		<div className="space-y-6">
			<PageHeader
				title="Analytics"
				description="Monitor responses, participation rates, and insights across all your events"
			/>

			{isLoading ? (
				<div className="flex justify-center py-12">
					<LoadingSpinner />
				</div>
			) : events.length === 0 ? (
				<Card>
					<CardContent className="py-12 text-center text-muted-foreground">
						You haven't created any events yet. Create an event first to see analytics.
					</CardContent>
				</Card>
			) : (
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Select Event</CardTitle>
							<CardDescription>
								Choose one of your events to view its specific response analytics
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Select
								value={selectedEventId ?? ""}
								onValueChange={(val) => setSelectedEventId(val || null)}
							>
								<SelectTrigger className="w-full md:w-[300px]">
									<SelectValue placeholder="Choose an event..." />
								</SelectTrigger>
								<SelectContent>
									{events.map((event) => (
										<SelectItem key={event.id} value={event.id}>
											{event.title} ({event.type})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</CardContent>
					</Card>

					{selectedEventId ? (
						<AnalyticsChart eventId={selectedEventId} />
					) : (
						<Card>
							<CardContent className="py-12 text-center text-muted-foreground">
								Please select an event above to display its analytics and charts.
							</CardContent>
						</Card>
					)}
				</div>
			)}
		</div>
	);
}
