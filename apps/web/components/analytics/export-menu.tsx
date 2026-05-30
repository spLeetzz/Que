"use client";

import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { DownloadIcon, FileTextIcon, FileJsonIcon } from "lucide-react";
import { toast } from "sonner";

interface ExportMenuProps {
	eventTitle: string;
	fullAnalytics: any;
}

function downloadFile(content: string, filename: string, mimeType: string) {
	try {
		const blob = new Blob([content], { type: mimeType });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		a.style.display = "none";
		document.body.appendChild(a);
		a.click();
		// Clean up after a short delay to ensure download starts
		setTimeout(() => {
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		}, 100);
	} catch (err) {
		console.error("Download failed:", err);
		toast.error("Failed to download file");
	}
}

function formatTimestamp(): string {
	return new Date().toISOString().split("T")[0] || "";
}

/**
 * Simple CSV encoder that doesn't require papaparse.
 * Handles quoting, commas, newlines, and special characters.
 */
function toCSV(rows: Record<string, string | number | boolean | null | undefined>[]): string {
	if (rows.length === 0) return "";

	const headers = Object.keys(rows[0]!);
	const escape = (val: unknown): string => {
		const str = val === null || val === undefined ? "" : String(val);
		// Quote fields that contain commas, quotes, or newlines
		if (str.includes(",") || str.includes('"') || str.includes("\n")) {
			return `"${str.replace(/"/g, '""')}"`;
		}
		return str;
	};

	const headerLine = headers.map(escape).join(",");
	const dataLines = rows.map((row) => headers.map((h) => escape(row[h])).join(","));
	return [headerLine, ...dataLines].join("\n");
}

/**
 * Format answer values for CSV export
 */
function formatAnswerForCSV(value: string | string[] | number | null | undefined): string {
	// Handle null/undefined
	if (value === null || value === undefined) {
		return "";
	}

	// Handle arrays (multiple-choice)
	if (Array.isArray(value)) {
		return value.join(", ");
	}

	// Handle numbers
	if (typeof value === "number") {
		return value.toString();
	}

	// Handle strings
	return String(value);
}

export function ExportMenu({ eventTitle, fullAnalytics }: ExportMenuProps) {
	const safeTitle = eventTitle.replace(/[^a-z0-9]/gi, "-").toLowerCase();
	const eventType = fullAnalytics?.event?.type;
	const isForm = eventType === "form";

	const exportResponsesCSV = () => {
		try {
			if (!fullAnalytics?.participants || fullAnalytics.participants.length === 0) {
				toast.error("No response data to export");
				return;
			}

			const isBanter = fullAnalytics?.event?.type === "banter";

			const data = fullAnalytics.participants.map((p: any) => {
				if (isBanter) {
					return {
						"Response ID": p.participantId || "",
						"Participant Alias": p.alias || "",
						"Joined At": p.joinedAt ? new Date(p.joinedAt).toISOString() : "",
						"Submitted At": p.submittedAt ? new Date(p.submittedAt).toISOString() : "",
						"Time Spent (seconds)": p.timeSpent ?? "",
						Completed: p.completed ? "Yes" : "No",
						"Answered Questions": p.answeredQuestions ?? 0,
						"Total Questions": p.totalQuestions ?? 0,
						"Progress %": Math.round((p.progressPercentage ?? 0) * 100),
						"Last Seen Question": p.lastSeenQuestionText || "",
					};
				} else {
					return {
						"Response ID": p.participantId || "",
						Respondent: p.alias === "Anonymous" ? "Anonymous" : (p.alias || "Anonymous"),
						"Submitted At": p.submittedAt ? new Date(p.submittedAt).toISOString() : "",
						"Answered Questions": p.answeredQuestions ?? 0,
						"Total Questions": p.totalQuestions ?? 0,
						"Progress %": Math.round((p.progressPercentage ?? 0) * 100),
					};
				}
			});

			const csv = toCSV(data);
			downloadFile(csv, `${safeTitle}-responses-${formatTimestamp()}.csv`, "text/csv;charset=utf-8;");
			toast.success("Responses exported to CSV");
		} catch (err) {
			console.error("Export responses CSV failed:", err);
			toast.error("Failed to export responses");
		}
	};

	const exportQuestionAnalyticsCSV = () => {
		try {
			if (!fullAnalytics?.questions || fullAnalytics.questions.length === 0) {
				toast.error("No question data to export");
				return;
			}

			const data = fullAnalytics.questions.map((q: any) => ({
				"Question Order": Math.round(q.order ?? 0),
				"Question Text": q.questionText || "",
				"Question Type": q.questionType || "",
				Required: q.required ? "Yes" : "No",
				"Total Answers": q.totalAnswers ?? 0,
				"Skip Rate %": Math.round((q.skipRate ?? 0) * 100),
				"Abandoned Here": q.abandonedHere ?? 0,
				"Abandonment Rate %": Math.round((q.abandonmentRate ?? 0) * 100),
			}));

			const csv = toCSV(data);
			downloadFile(csv, `${safeTitle}-question-analytics-${formatTimestamp()}.csv`, "text/csv;charset=utf-8;");
			toast.success("Question analytics exported to CSV");
		} catch (err) {
			console.error("Export question analytics CSV failed:", err);
			toast.error("Failed to export question analytics");
		}
	};

	const exportIndividualResponsesCSV = () => {
		try {
			if (!fullAnalytics?.individualResponses || !fullAnalytics?.individualResponses?.responses) {
				toast.error("No individual response data to export");
				return;
			}

			const { responses, questions } = fullAnalytics.individualResponses;

			if (responses.length === 0) {
				toast.error("No responses to export");
				return;
			}

			// Build CSV rows: one row per response with all question answers
			const data = responses.map((response: any) => {
				const row: Record<string, string> = {
					"Response ID": response.responseId || "",
					Respondent: response.respondent || "Anonymous",
					"Submitted At": response.submittedAt ? new Date(response.submittedAt).toISOString() : "",
				};

				// Add each question's answer as a column
				questions.forEach((question: any) => {
					const answerValue = response.answers[question.itemId];
					row[question.questionText] = formatAnswerForCSV(answerValue);
				});

				return row;
			});

			const csv = toCSV(data);
			downloadFile(csv, `${safeTitle}-individual-responses-${formatTimestamp()}.csv`, "text/csv;charset=utf-8;");
			toast.success("Individual responses exported to CSV");
		} catch (err) {
			console.error("Export individual responses CSV failed:", err);
			toast.error("Failed to export individual responses");
		}
	};

	const exportFullJSON = () => {
		try {
			if (!fullAnalytics) {
				toast.error("No data to export");
				return;
			}

			// JSON.stringify replacer to handle Date objects
			const json = JSON.stringify(fullAnalytics, (key, value) => {
				if (value instanceof Date) {
					return value.toISOString();
				}
				return value;
			}, 2);
			downloadFile(json, `${safeTitle}-full-analytics-${formatTimestamp()}.json`, "application/json");
			toast.success("Full analytics exported to JSON");
		} catch (err) {
			console.error("Export full JSON failed:", err);
			toast.error("Failed to export analytics JSON");
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="sm">
					<DownloadIcon className="h-4 w-4" />
					Export
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel>Export Data</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{isForm && (
					<DropdownMenuItem onClick={exportIndividualResponsesCSV}>
						<FileTextIcon className="h-4 w-4" />
						Individual Responses (CSV)
					</DropdownMenuItem>
				)}
				<DropdownMenuItem onClick={exportQuestionAnalyticsCSV}>
					<FileTextIcon className="h-4 w-4" />
					Question Analytics (CSV)
				</DropdownMenuItem>
				<DropdownMenuItem onClick={exportResponsesCSV}>
					<FileTextIcon className="h-4 w-4" />
					Response Summary (CSV)
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={exportFullJSON}>
					<FileJsonIcon className="h-4 w-4" />
					Full Analytics (JSON)
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
