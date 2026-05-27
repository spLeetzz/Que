"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Skeleton } from "~/components/ui/skeleton";

interface ResponseTimelineProps {
	data:
		| {
				date: string;
				responseCount: number;
				participantCount: number;
		  }[]
		| undefined;
	isLoading: boolean;
}

export function ResponseTimeline({ data, isLoading }: ResponseTimelineProps) {
	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-4 w-64 mt-2" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-[300px] w-full" />
				</CardContent>
			</Card>
		);
	}

	if (!data || data.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Response Timeline</CardTitle>
					<CardDescription>Track responses over time</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center h-[300px] text-muted-foreground">
						No response data available yet
					</div>
				</CardContent>
			</Card>
		);
	}

	// Format dates for display
	const formattedData = data.map((point) => ({
		...point,
		displayDate: new Date(point.date).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
		}),
	}));

	return (
		<Card>
			<CardHeader>
				<CardTitle>Response Timeline</CardTitle>
				<CardDescription>Track responses and participants over time</CardDescription>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width="100%" height={300}>
					<LineChart data={formattedData}>
						<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
						<XAxis
							dataKey="displayDate"
							className="text-xs"
							tick={{ fill: "hsl(var(--muted-foreground))" }}
						/>
						<YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
						<Tooltip
							contentStyle={{
								backgroundColor: "hsl(var(--background))",
								border: "1px solid hsl(var(--border))",
								borderRadius: "var(--radius)",
							}}
						/>
						<Legend />
						<Line
							type="monotone"
							dataKey="responseCount"
							stroke="hsl(var(--primary))"
							strokeWidth={2}
							name="Responses"
							dot={{ fill: "hsl(var(--primary))" }}
						/>
						<Line
							type="monotone"
							dataKey="participantCount"
							stroke="hsl(var(--chart-2))"
							strokeWidth={2}
							name="Participants"
							dot={{ fill: "hsl(var(--chart-2))" }}
						/>
					</LineChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}
