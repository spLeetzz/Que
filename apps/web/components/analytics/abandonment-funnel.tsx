"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { AlertTriangleIcon } from "lucide-react";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";

interface AbandonmentFunnelProps {
	data:
		| {
				step: number;
				questionText: string;
				itemId: string;
				participantsReached: number;
				participantsAbandoned: number;
				abandonmentRate: number;
				cumulativeCompletion: number;
		  }[]
		| undefined;
	isLoading: boolean;
}

export function AbandonmentFunnel({ data, isLoading }: AbandonmentFunnelProps) {
	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-4 w-64 mt-2" />
				</CardHeader>
				<CardContent className="space-y-3">
					{[...Array(5)].map((_, i) => (
						<Skeleton key={i} className="h-16 w-full" />
					))}
				</CardContent>
			</Card>
		);
	}

	if (!data || data.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Abandonment Funnel</CardTitle>
					<CardDescription>See where participants drop off</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center h-[200px] text-muted-foreground">
						No questions in this event yet
					</div>
				</CardContent>
			</Card>
		);
	}

	const maxReached = data[0]?.participantsReached || 1;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Abandonment Funnel</CardTitle>
				<CardDescription>Track participant progression through questions</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				{data.map((step) => {
					const widthPercentage = (step.participantsReached / maxReached) * 100;
					const isHighAbandonment = step.abandonmentRate > 0.15;

					return (
						<div key={step.itemId} className="space-y-2">
							<div className="flex items-start justify-between gap-4">
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<span className="text-sm font-medium">Q{step.step}</span>
										<span className="text-sm text-muted-foreground truncate">{step.questionText}</span>
										{isHighAbandonment && (
											<AlertTriangleIcon className="h-4 w-4 text-amber-500 shrink-0" />
										)}
									</div>
								</div>
								<div className="text-right shrink-0">
									<div className="text-sm font-semibold">
										{step.participantsReached} ({Math.round(step.cumulativeCompletion * 100)}%)
									</div>
									{step.participantsAbandoned > 0 && (
										<div className="text-xs text-destructive">
											-{step.participantsAbandoned} abandoned
										</div>
									)}
								</div>
							</div>
							<div className="relative h-8 bg-muted rounded-md overflow-hidden">
								<div
									className={cn(
										"absolute inset-y-0 left-0 rounded-md transition-all",
										isHighAbandonment
											? "bg-gradient-to-r from-amber-500 to-amber-600"
											: "bg-gradient-to-r from-primary to-primary/80"
									)}
									style={{ width: `${widthPercentage}%` }}
								/>
								<div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-foreground mix-blend-difference">
									{step.participantsReached} reached
								</div>
							</div>
						</div>
					);
				})}
			</CardContent>
		</Card>
	);
}
