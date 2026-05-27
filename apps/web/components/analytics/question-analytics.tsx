"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ChevronDownIcon, ChevronUpIcon, AlertTriangleIcon } from "lucide-react";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";

export interface QuestionAnalyticsItem {
	itemId: string;
	questionText: string;
	questionType: "text" | "slider" | "options";
	order: number;
	required: boolean;
	totalAnswers: number;
	skipRate: number;
	abandonedHere: number;
	abandonmentRate: number;
	textAnswers?: string[];
	sliderStats?: {
		min: number;
		max: number;
		average: number;
		median: number;
		distribution: { value: number; count: number }[];
	};
	optionStats?: {
		choice: string;
		count: number;
		percentage: number;
	}[];
}

interface QuestionAnalyticsProps {
	data: QuestionAnalyticsItem[] | undefined;
	isLoading: boolean;
}

function QuestionCard({ question }: { question: QuestionAnalyticsItem }) {
	const [isExpanded, setIsExpanded] = useState(false);
	const isHighAbandonment = question.abandonmentRate > 0.15;
	const isHighSkip = question.skipRate > 0.2;

	return (
		<Card className={cn(isHighAbandonment && "border-amber-500/50")}>
			<CardHeader>
				<div className="flex items-start justify-between gap-4">
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 mb-2">
							<Badge variant="outline" className="shrink-0">
								Q{Math.round(question.order)}
							</Badge>
							<Badge variant="secondary" className="shrink-0">
								{question.questionType}
							</Badge>
							{question.required && (
								<Badge variant="destructive" className="shrink-0">
									Required
								</Badge>
							)}
							{isHighAbandonment && (
								<div className="flex items-center gap-1 text-amber-600 text-xs">
									<AlertTriangleIcon className="h-3 w-3" />
									<span>High abandonment</span>
								</div>
							)}
						</div>
						<CardTitle className="text-base">{question.questionText}</CardTitle>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setIsExpanded(!isExpanded)}
						className="shrink-0"
					>
						{isExpanded ? (
							<ChevronUpIcon className="h-4 w-4" />
						) : (
							<ChevronDownIcon className="h-4 w-4" />
						)}
					</Button>
				</div>
				<div className="flex flex-wrap gap-4 text-sm">
					<div>
						<span className="text-muted-foreground">Answers:</span>{" "}
						<span className="font-semibold">{question.totalAnswers}</span>
					</div>
					<div>
						<span className="text-muted-foreground">Skip Rate:</span>{" "}
						<span className={cn("font-semibold", isHighSkip && "text-amber-600")}>
							{Math.round(question.skipRate * 100)}%
						</span>
					</div>
					<div>
						<span className="text-muted-foreground">Abandoned Here:</span>{" "}
						<span className={cn("font-semibold", isHighAbandonment && "text-amber-600")}>
							{question.abandonedHere} ({Math.round(question.abandonmentRate * 100)}%)
						</span>
					</div>
				</div>
			</CardHeader>

			{isExpanded && (
				<CardContent className="border-t pt-4">
					{question.questionType === "options" && question.optionStats && (
						<div className="space-y-3">
							<h4 className="text-sm font-semibold">Response Distribution</h4>
							<ResponsiveContainer width="100%" height={200}>
								<BarChart data={question.optionStats} layout="vertical">
									<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
									<XAxis type="number" className="text-xs" />
									<YAxis
										dataKey="choice"
										type="category"
										width={150}
										className="text-xs"
										tick={{ fill: "hsl(var(--muted-foreground))" }}
									/>
									<Tooltip
										contentStyle={{
											backgroundColor: "hsl(var(--background))",
											border: "1px solid hsl(var(--border))",
											borderRadius: "var(--radius)",
										}}
									/>
									<Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
										{question.optionStats.map((entry, index) => (
											<Cell
												key={`cell-${index}`}
												fill={`hsl(var(--chart-${(index % 5) + 1}))`}
											/>
										))}
									</Bar>
								</BarChart>
							</ResponsiveContainer>
							<div className="space-y-2">
								{question.optionStats.map((option, index) => (
									<div key={index} className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">{option.choice}</span>
										<span className="font-semibold">
											{option.count} ({Math.round(option.percentage * 100)}%)
										</span>
									</div>
								))}
							</div>
						</div>
					)}

					{question.questionType === "slider" && question.sliderStats && (
						<div className="space-y-3">
							<h4 className="text-sm font-semibold">Slider Statistics</h4>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<div>
									<div className="text-xs text-muted-foreground">Average</div>
									<div className="text-lg font-bold">{question.sliderStats.average}</div>
								</div>
								<div>
									<div className="text-xs text-muted-foreground">Median</div>
									<div className="text-lg font-bold">{question.sliderStats.median}</div>
								</div>
								<div>
									<div className="text-xs text-muted-foreground">Min</div>
									<div className="text-lg font-bold">{question.sliderStats.min}</div>
								</div>
								<div>
									<div className="text-xs text-muted-foreground">Max</div>
									<div className="text-lg font-bold">{question.sliderStats.max}</div>
								</div>
							</div>
							<ResponsiveContainer width="100%" height={200}>
								<BarChart data={question.sliderStats.distribution}>
									<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
									<XAxis
										dataKey="value"
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
									<Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
								</BarChart>
							</ResponsiveContainer>
						</div>
					)}

					{question.questionType === "text" && question.textAnswers && (
						<div className="space-y-3">
							<h4 className="text-sm font-semibold">
								Text Responses ({question.textAnswers.length})
							</h4>
							<div className="max-h-[300px] overflow-y-auto space-y-2">
								{question.textAnswers.slice(0, 20).map((answer, index) => (
									<div
										key={index}
										className="p-3 bg-muted rounded-md text-sm border border-border"
									>
										{answer || <span className="text-muted-foreground italic">Empty response</span>}
									</div>
								))}
								{question.textAnswers.length > 20 && (
									<p className="text-xs text-muted-foreground text-center py-2">
										Showing first 20 of {question.textAnswers.length} responses
									</p>
								)}
							</div>
						</div>
					)}
				</CardContent>
			)}
		</Card>
	);
}

export function QuestionAnalytics({ data, isLoading }: QuestionAnalyticsProps) {
	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<Skeleton className="h-6 w-48" />
				</div>
				{[...Array(3)].map((_, i) => (
					<Skeleton key={i} className="h-32 w-full" />
				))}
			</div>
		);
	}

	if (!data || data.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Question Analytics</CardTitle>
					<CardDescription>Detailed breakdown for each question</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center h-[200px] text-muted-foreground">
						No questions in this event yet
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			<div>
				<h3 className="text-lg font-semibold">Question Analytics</h3>
				<p className="text-sm text-muted-foreground">
					Detailed breakdown for each question ({data.length} questions)
				</p>
			</div>
			<div className="space-y-4">
				{data.map((question) => (
					<QuestionCard key={question.itemId} question={question} />
				))}
			</div>
		</div>
	);
}
