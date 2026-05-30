"use client";

import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Skeleton } from "~/components/ui/skeleton";
import { Button } from "~/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export type AnswerValue = string | string[] | number | null | undefined;

export interface AnswerCellProps {
	value: AnswerValue;
	questionType: "text" | "slider" | "options";
}

export interface QuestionMetadata {
	itemId: string;
	questionText: string;
	questionType: "text" | "slider" | "options";
	order: number;
}

export interface IndividualResponse {
	responseId: string;
	respondent: string;
	submittedAt: Date;
	answers: Record<string, string>; // itemId -> formatted answer value
}

export interface IndividualResponsesData {
	responses: IndividualResponse[];
	questions: QuestionMetadata[];
	pagination: {
		page: number;
		pageSize: number;
		totalResponses: number;
		totalPages: number;
	};
}

export interface IndividualResponseViewProps {
	data: IndividualResponsesData | undefined;
	isLoading: boolean;
	page: number;
	onPageChange: (page: number) => void;
}

// ============================================================================
// AnswerCell Component
// ============================================================================

export function AnswerCell({ value, questionType }: AnswerCellProps) {
	// Handle null/undefined values
	if (value === null || value === undefined || value === "") {
		return <span className="text-muted-foreground italic">(No answer)</span>;
	}

	// Handle array values (multiple-choice)
	if (Array.isArray(value)) {
		if (value.length === 0) {
			return <span className="text-muted-foreground italic">(No answer)</span>;
		}
		const displayValue = value.join(", ");
		
		// Truncate long text
		if (displayValue.length > 100) {
			return (
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<span className="cursor-help">
								{displayValue.substring(0, 100)}...
							</span>
						</TooltipTrigger>
						<TooltipContent className="max-w-md">
							<p className="whitespace-pre-wrap">{displayValue}</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			);
		}
		
		return <span>{displayValue}</span>;
	}

	// Handle number values (slider)
	if (typeof value === "number") {
		// Format with up to 2 decimal places
		const formatted = value % 1 === 0 ? value.toString() : value.toFixed(2);
		return <span>{formatted}</span>;
	}

	// Handle string values (text/single-choice)
	const stringValue = String(value);
	
	// Truncate long text
	if (stringValue.length > 100) {
		return (
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<span className="cursor-help">
							{stringValue.substring(0, 100)}...
						</span>
					</TooltipTrigger>
					<TooltipContent className="max-w-md">
						<p className="whitespace-pre-wrap">{stringValue}</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		);
	}

	return <span>{stringValue}</span>;
}

// ============================================================================
// Pagination Controls Component
// ============================================================================

interface PaginationControlsProps {
	page: number;
	totalPages: number;
	totalResponses: number;
	onPageChange: (page: number) => void;
}

function PaginationControls({ page, totalPages, totalResponses, onPageChange }: PaginationControlsProps) {
	return (
		<div className="flex items-center justify-between px-2 py-4">
			<div className="text-sm text-muted-foreground">
				Page {page} of {totalPages} ({totalResponses} total responses)
			</div>
			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					onClick={() => onPageChange(page - 1)}
					disabled={page <= 1}
				>
					<ChevronLeft className="h-4 w-4 mr-1" />
					Previous
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={() => onPageChange(page + 1)}
					disabled={page >= totalPages}
				>
					Next
					<ChevronRight className="h-4 w-4 ml-1" />
				</Button>
			</div>
		</div>
	);
}

// ============================================================================
// IndividualResponseView Component
// ============================================================================

export function IndividualResponseView({ data, isLoading, page, onPageChange }: IndividualResponseViewProps) {
	// Loading state
	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-4 w-64 mt-2" />
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
					</div>
				</CardContent>
			</Card>
		);
	}

	// Empty state
	if (!data || data.responses.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Individual Responses</CardTitle>
					<CardDescription>No responses yet</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground text-center py-8">
						No responses have been submitted for this event yet.
					</p>
				</CardContent>
			</Card>
		);
	}

	const { responses, questions, pagination } = data;

	// Format date helper
	const formatDate = (date: Date) => {
		return new Date(date).toLocaleString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Individual Responses</CardTitle>
				<CardDescription>
					View all responses with answers to each question
				</CardDescription>
			</CardHeader>
			<CardContent>
				{/* Desktop Table Layout */}
				<div className="hidden md:block overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="sticky left-0 bg-background z-10 min-w-[150px]">
									Respondent
								</TableHead>
								<TableHead className="min-w-[180px]">Submitted At</TableHead>
								{questions.map((question) => (
									<TableHead key={question.itemId} className="min-w-[200px]">
										{question.questionText}
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{responses.map((response) => (
								<TableRow key={response.responseId}>
									<TableCell className="sticky left-0 bg-background z-10 font-medium">
										{response.respondent}
									</TableCell>
									<TableCell>{formatDate(response.submittedAt)}</TableCell>
									{questions.map((question) => (
										<TableCell key={question.itemId}>
											<AnswerCell
												value={response.answers[question.itemId]}
												questionType={question.questionType}
											/>
										</TableCell>
									))}
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>

				{/* Mobile Card Layout */}
				<div className="md:hidden space-y-4">
					{responses.map((response) => (
						<Card key={response.responseId}>
							<CardHeader>
								<CardTitle className="text-base">{response.respondent}</CardTitle>
								<CardDescription>{formatDate(response.submittedAt)}</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								{questions.map((question) => (
									<div key={question.itemId}>
										<div className="text-sm font-medium mb-1">{question.questionText}</div>
										<div className="text-sm text-muted-foreground">
											<AnswerCell
												value={response.answers[question.itemId]}
												questionType={question.questionType}
											/>
										</div>
									</div>
								))}
							</CardContent>
						</Card>
					))}
				</div>

				{/* Pagination Controls */}
				<PaginationControls
					page={pagination.page}
					totalPages={pagination.totalPages}
					totalResponses={pagination.totalResponses}
					onPageChange={onPageChange}
				/>
			</CardContent>
		</Card>
	);
}

