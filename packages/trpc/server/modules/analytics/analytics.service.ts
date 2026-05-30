import { TRPCError } from "@trpc/server";
import { db } from "@repo/database";
import { events, items, participants, responses, answers, user } from "@repo/database/schema";
import { eq, and, isNull, ne, sql, desc, count as drizzleCount, inArray } from "drizzle-orm";
import type { User } from "../../shared/types";

// ============================================================================
// Helper Functions
// ============================================================================

async function getEventOrThrow(eventId: string) {
	const [event] = await db
		.select()
		.from(events)
		.where(and(eq(events.id, eventId), isNull(events.deletedAt), ne(events.status, "deleted")))
		.limit(1);

	if (!event) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
	}

	return event;
}

function validateEventCreator(eventCreatorId: string, userId: string): void {
	if (eventCreatorId !== userId) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You are not authorized to view analytics for this event",
		});
	}
}

/**
 * Formats answer values based on question type for display in tables and exports.
 * 
 * @param rawValue - The raw answer value from the database (string array)
 * @param questionType - The type of question (text, slider, options)
 * @param metadata - Optional metadata containing question-specific configuration
 * @returns Formatted string representation suitable for display
 */
export function formatAnswerValue(
	rawValue: string[] | undefined | null,
	questionType: "text" | "slider" | "options" | null,
	metadata?: any
): string {
	// Handle null/undefined/empty values
	if (!rawValue || rawValue.length === 0 || !questionType) {
		return "";
	}

	try {
		switch (questionType) {
			case "text": {
				// Text questions store answer as first element of array
				const textValue = rawValue[0];
				if (!textValue || textValue.trim() === "") {
					return "";
				}

				// Check for text subtype in metadata for special formatting
				const subtype = metadata?.subtype;
				
				if (subtype === "date") {
					// Format date values (ISO string to readable format)
					try {
						const date = new Date(textValue);
						if (!isNaN(date.getTime())) {
							return date.toLocaleDateString("en-US", {
								year: "numeric",
								month: "short",
								day: "numeric"
							});
						}
					} catch {
						// If date parsing fails, return as-is
					}
				} else if (subtype === "time") {
					// Format time values
					try {
						const date = new Date(textValue);
						if (!isNaN(date.getTime())) {
							return date.toLocaleTimeString("en-US", {
								hour: "2-digit",
								minute: "2-digit"
							});
						}
					} catch {
						// If time parsing fails, return as-is
					}
				} else if (subtype === "number") {
					// Format number values with up to 2 decimal places
					const num = parseFloat(textValue);
					if (!isNaN(num)) {
						return num % 1 === 0 ? num.toString() : num.toFixed(2);
					}
				}

				// For all other text types (short, long, email, url), return as-is
				return textValue;
			}

			case "slider": {
				// Slider questions store numeric value as string in first element
				const sliderValue = rawValue[0];
				if (!sliderValue) {
					return "";
				}

				const num = parseFloat(sliderValue);
				if (isNaN(num)) {
					return "";
				}

				// Format with up to 2 decimal places, remove trailing zeros
				return num % 1 === 0 ? num.toString() : num.toFixed(2).replace(/\.?0+$/, "");
			}

			case "options": {
				// Options questions can have single or multiple selections
				// Multiple selections are stored as multiple elements in the array
				const selections = rawValue.filter(v => v && v.trim() !== "");
				
				if (selections.length === 0) {
					return "";
				}

				// Check if multiple choice from metadata
				const isMultiple = metadata?.multiple === true;

				if (isMultiple) {
					// Multiple choice: join with comma and space
					return selections.join(", ");
				} else {
					// Single choice: return first selection
					return selections[0] || "";
				}
			}

			default:
				// Unknown question type, return empty string
				return "";
		}
	} catch (error) {
		// Log error but don't throw - return empty string for malformed data
		console.warn(`Error formatting answer value for question type ${questionType}:`, error);
		return "";
	}
}

// ============================================================================
// Overview Metrics
// ============================================================================

export interface OverviewMetrics {
	totalResponses: number;
	totalParticipants: number;
	completionRate: number;
	averageTimeToComplete: number | null;
	abandonmentRate: number;
	responseRate: number;
}

export async function getOverviewMetrics(eventId: string, userId: string): Promise<OverviewMetrics> {
	const event = await getEventOrThrow(eventId);
	validateEventCreator(event.creatorId, userId);

	if (event.type !== "banter") {
		const [res] = await db
			.select({
				totalResponses: sql<number>`cast(count(${responses.id}) as int)`,
			})
			.from(responses)
			.where(eq(responses.eventId, eventId));

		const totalResponses = res?.totalResponses || 0;
		return {
			totalResponses,
			totalParticipants: totalResponses,
			completionRate: 1,
			averageTimeToComplete: null,
			abandonmentRate: 0,
			responseRate: 1,
		};
	}

	const result = await db
		.select({
			totalResponses: sql<number>`cast(count(distinct ${responses.id}) as int)`,
			totalParticipants: sql<number>`cast(count(distinct ${participants.id}) as int)`,
			completedParticipants: sql<number>`cast(count(distinct case when ${participants.submittedAt} is not null then ${participants.id} end) as int)`,
			avgTimeSeconds: sql<number>`avg(extract(epoch from (${participants.submittedAt} - ${participants.joinedAt})))`,
		})
		.from(participants)
		.leftJoin(responses, eq(responses.participantId, participants.id))
		.where(eq(participants.eventId, eventId));

	const data = result[0];
	if (!data) {
		return {
			totalResponses: 0,
			totalParticipants: 0,
			completionRate: 0,
			averageTimeToComplete: null,
			abandonmentRate: 0,
			responseRate: 0,
		};
	}

	const totalParticipants = data.totalParticipants || 0;
	const totalResponses = data.totalResponses || 0;
	const completedParticipants = data.completedParticipants || 0;

	return {
		totalResponses,
		totalParticipants,
		completionRate: totalParticipants > 0 ? completedParticipants / totalParticipants : 0,
		averageTimeToComplete: data.avgTimeSeconds ? Math.round(data.avgTimeSeconds) : null,
		abandonmentRate: totalParticipants > 0 ? (totalParticipants - completedParticipants) / totalParticipants : 0,
		responseRate: totalParticipants > 0 ? totalResponses / totalParticipants : 0,
	};
}

// ============================================================================
// Response Timeline
// ============================================================================

export interface ResponseTimelinePoint {
	date: string;
	responseCount: number;
	participantCount: number;
}

export async function getResponseTimeline(eventId: string, userId: string): Promise<ResponseTimelinePoint[]> {
	const event = await getEventOrThrow(eventId);
	validateEventCreator(event.creatorId, userId);

	const timeline = await db
		.select({
			date: sql<string>`date(${responses.submittedAt})`,
			responseCount: sql<number>`cast(count(distinct ${responses.id}) as int)`,
		})
		.from(responses)
		.where(eq(responses.eventId, eventId))
		.groupBy(sql`date(${responses.submittedAt})`)
		.orderBy(sql`date(${responses.submittedAt})`);

	if (event.type !== "banter") {
		return timeline.map((point) => ({
			date: point.date,
			responseCount: point.responseCount,
			participantCount: point.responseCount,
		}));
	}

	const participantTimeline = await db
		.select({
			date: sql<string>`date(${participants.joinedAt})`,
			participantCount: sql<number>`cast(count(distinct ${participants.id}) as int)`,
		})
		.from(participants)
		.where(eq(participants.eventId, eventId))
		.groupBy(sql`date(${participants.joinedAt})`)
		.orderBy(sql`date(${participants.joinedAt})`);

	// Merge timelines
	const dateMap = new Map<string, ResponseTimelinePoint>();

	timeline.forEach((point) => {
		dateMap.set(point.date, {
			date: point.date,
			responseCount: point.responseCount,
			participantCount: 0,
		});
	});

	participantTimeline.forEach((point) => {
		const existing = dateMap.get(point.date);
		if (existing) {
			existing.participantCount = point.participantCount;
		} else {
			dateMap.set(point.date, {
				date: point.date,
				responseCount: 0,
				participantCount: point.participantCount,
			});
		}
	});

	return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

// ============================================================================
// Abandonment Funnel
// ============================================================================

export interface AbandonmentFunnelStep {
	step: number;
	questionText: string;
	itemId: string;
	participantsReached: number;
	participantsAbandoned: number;
	abandonmentRate: number;
	cumulativeCompletion: number;
}

export async function getAbandonmentFunnel(
	eventId: string,
	userId: string,
): Promise<AbandonmentFunnelStep[]> {
	const event = await getEventOrThrow(eventId);
	validateEventCreator(event.creatorId, userId);

	// Get all questions in order
	const questions = await db
		.select({
			id: items.id,
			value: items.value,
			order: items.order,
		})
		.from(items)
		.where(and(eq(items.eventId, eventId), eq(items.category, "question")))
		.orderBy(items.order);

	if (event.type !== "banter") {
		const [res] = await db
			.select({
				totalResponses: sql<number>`cast(count(${responses.id}) as int)`,
			})
			.from(responses)
			.where(eq(responses.eventId, eventId));

		const totalResponses = res?.totalResponses || 0;
		return questions.map((question, index) => ({
			step: index + 1,
			questionText: question.value,
			itemId: question.id,
			participantsReached: totalResponses,
			participantsAbandoned: 0,
			abandonmentRate: 0,
			cumulativeCompletion: 1,
		}));
	}

	// Get total participants
	const [totalResult] = await db
		.select({
			total: sql<number>`cast(count(distinct ${participants.id}) as int)`,
		})
		.from(participants)
		.where(eq(participants.eventId, eventId));

	const totalParticipants = totalResult?.total || 0;

	// Get abandonment data for each question
	const abandonmentData = await db
		.select({
			itemId: participants.lastSeenItemId,
			count: sql<number>`cast(count(distinct ${participants.id}) as int)`,
		})
		.from(participants)
		.where(and(eq(participants.eventId, eventId), isNull(participants.submittedAt)))
		.groupBy(participants.lastSeenItemId);

	const abandonmentMap = new Map<string, number>();
	abandonmentData.forEach((row) => {
		if (row.itemId) {
			abandonmentMap.set(row.itemId, row.count);
		}
	});

	// Build funnel
	const funnel: AbandonmentFunnelStep[] = [];
	let cumulativeReached = totalParticipants;

	questions.forEach((question, index) => {
		const abandoned = abandonmentMap.get(question.id) || 0;
		const abandonmentRate = cumulativeReached > 0 ? abandoned / cumulativeReached : 0;
		const cumulativeCompletion = totalParticipants > 0 ? cumulativeReached / totalParticipants : 0;

		funnel.push({
			step: index + 1,
			questionText: question.value,
			itemId: question.id,
			participantsReached: cumulativeReached,
			participantsAbandoned: abandoned,
			abandonmentRate,
			cumulativeCompletion,
		});

		cumulativeReached -= abandoned;
	});

	return funnel;
}

// ============================================================================
// Question Analytics
// ============================================================================

export interface QuestionAnalytics {
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

export async function getQuestionAnalytics(eventId: string, userId: string): Promise<QuestionAnalytics[]> {
	const event = await getEventOrThrow(eventId);
	validateEventCreator(event.creatorId, userId);

	// Get all questions
	const questions = await db
		.select()
		.from(items)
		.where(and(eq(items.eventId, eventId), eq(items.category, "question")))
		.orderBy(items.order);

	// Get total responses
	const [totalResult] = await db
		.select({
			total: sql<number>`cast(count(distinct ${responses.id}) as int)`,
		})
		.from(responses)
		.where(eq(responses.eventId, eventId));

	const totalResponses = totalResult?.total || 0;

	let totalParticipants = totalResponses;
	const abandonmentMap = new Map<string, number>();

	if (event.type === "banter") {
		// Get total participants
		const [participantResult] = await db
			.select({
				total: sql<number>`cast(count(distinct ${participants.id}) as int)`,
			})
			.from(participants)
			.where(eq(participants.eventId, eventId));

		totalParticipants = participantResult?.total || 0;

		// Get abandonment data
		const abandonmentData = await db
			.select({
				itemId: participants.lastSeenItemId,
				count: sql<number>`cast(count(distinct ${participants.id}) as int)`,
			})
			.from(participants)
			.where(and(eq(participants.eventId, eventId), isNull(participants.submittedAt)))
			.groupBy(participants.lastSeenItemId);

		abandonmentData.forEach((row) => {
			if (row.itemId) {
				abandonmentMap.set(row.itemId, row.count);
			}
		});
	}

	// Build analytics for each question
	const analytics: QuestionAnalytics[] = [];

	for (const question of questions) {
		// Get answers for this question
		const answerData = await db
			.select({
				value: answers.value,
			})
			.from(answers)
			.where(eq(answers.itemId, question.id));

		const totalAnswers = answerData.length;
		const skipRate = totalResponses > 0 ? (totalResponses - totalAnswers) / totalResponses : 0;
		const abandonedHere = abandonmentMap.get(question.id) || 0;
		const abandonmentRate = totalParticipants > 0 ? abandonedHere / totalParticipants : 0;

		const baseAnalytics: QuestionAnalytics = {
			itemId: question.id,
			questionText: question.value,
			questionType: question.questionType as "text" | "slider" | "options",
			order: question.order,
			required: question.required,
			totalAnswers,
			skipRate,
			abandonedHere,
			abandonmentRate,
		};

		// Type-specific analytics
		if (question.questionType === "text") {
			baseAnalytics.textAnswers = answerData.map((a) => a.value.join(", ")).filter((v) => v.length > 0);
		} else if (question.questionType === "slider") {
			const values = answerData
				.map((a) => Number.parseFloat(a.value[0] || ""))
				.filter((v) => !Number.isNaN(v))
				.sort((a, b) => a - b);

			if (values.length > 0) {
				const sum = values.reduce((acc, v) => acc + v, 0);
				const average = sum / values.length;
				const median = values[Math.floor(values.length / 2)] || 0;

				// Distribution
				const distributionMap = new Map<number, number>();
				values.forEach((v) => {
					distributionMap.set(v, (distributionMap.get(v) || 0) + 1);
				});

				baseAnalytics.sliderStats = {
					min: values[0] || 0,
					max: values[values.length - 1] || 0,
					average: Math.round(average * 100) / 100,
					median,
					distribution: Array.from(distributionMap.entries())
						.map(([value, count]) => ({ value, count }))
						.sort((a, b) => a.value - b.value),
				};
			}
		} else if (question.questionType === "options") {
			const choiceMap = new Map<string, number>();
			answerData.forEach((a) => {
				a.value.forEach((choice) => {
					choiceMap.set(choice, (choiceMap.get(choice) || 0) + 1);
				});
			});

			const totalChoices = Array.from(choiceMap.values()).reduce((acc, v) => acc + v, 0);

			baseAnalytics.optionStats = Array.from(choiceMap.entries())
				.map(([choice, count]) => ({
					choice,
					count,
					percentage: totalChoices > 0 ? count / totalChoices : 0,
				}))
				.sort((a, b) => b.count - a.count);
		}

		analytics.push(baseAnalytics);
	}

	return analytics;
}

// ============================================================================
// Participant Journeys
// ============================================================================

export interface ParticipantJourney {
	participantId: string;
	alias: string;
	joinedAt: Date;
	submittedAt: Date | null;
	timeSpent: number | null;
	lastSeenItemId: string | null;
	lastSeenQuestionText: string | null;
	completed: boolean;
	answeredQuestions: number;
	totalQuestions: number;
	progressPercentage: number;
}

export async function getParticipantJourneys(
	eventId: string,
	userId: string,
): Promise<ParticipantJourney[]> {
	const event = await getEventOrThrow(eventId);
	validateEventCreator(event.creatorId, userId);

	// Get total questions
	const [questionResult] = await db
		.select({
			total: sql<number>`cast(count(*) as int)`,
		})
		.from(items)
		.where(and(eq(items.eventId, eventId), eq(items.category, "question")));

	const totalQuestions = questionResult?.total || 0;

	if (event.type !== "banter") {
		// Forms and polls: load submissions as journeys
		// email is shown if authenticated user submitted, otherwise Anonymous. real names and IDs are kept hidden.
		const responseData = await db
			.select({
				id: responses.id,
				submittedAt: responses.submittedAt,
				email: user.email,
			})
			.from(responses)
			.leftJoin(user, eq(responses.userId, user.id))
			.where(eq(responses.eventId, eventId))
			.orderBy(desc(responses.submittedAt));

		if (responseData.length === 0) {
			return [];
		}

		// Get answer counts per response
		const answerCounts = await db
			.select({
				responseId: answers.responseId,
				count: sql<number>`cast(count(distinct ${answers.itemId}) as int)`,
			})
			.from(answers)
			.where(inArray(answers.responseId, responseData.map((r) => r.id)))
			.groupBy(answers.responseId);

		const answerCountMap = new Map<string, number>();
		answerCounts.forEach((row) => {
			if (row.responseId) {
				answerCountMap.set(row.responseId, row.count);
			}
		});

		return responseData.map((r) => {
			const answeredQuestions = answerCountMap.get(r.id) || 0;
			return {
				participantId: r.id,
				alias: r.email || "Anonymous",
				joinedAt: r.submittedAt,
				submittedAt: r.submittedAt,
				timeSpent: null,
				lastSeenItemId: null,
				lastSeenQuestionText: null,
				completed: true,
				answeredQuestions,
				totalQuestions,
				progressPercentage: totalQuestions > 0 ? answeredQuestions / totalQuestions : 0,
			};
		});
	}

	// Banter events: Get all participants
	const participantData = await db
		.select({
			id: participants.id,
			alias: participants.alias,
			joinedAt: participants.joinedAt,
			submittedAt: participants.submittedAt,
			lastSeenItemId: participants.lastSeenItemId,
		})
		.from(participants)
		.where(eq(participants.eventId, eventId))
		.orderBy(desc(participants.joinedAt));

	if (participantData.length === 0) {
		return [];
	}

	// Get question texts for lastSeenItemId
	const itemIds = participantData.map((p) => p.lastSeenItemId).filter((id): id is string => id !== null);
	const itemTexts = new Map<string, string>();

	if (itemIds.length > 0) {
		const itemData = await db
			.select({
				id: items.id,
				value: items.value,
			})
			.from(items)
			.where(inArray(items.id, itemIds));

		itemData.forEach((item) => {
			itemTexts.set(item.id, item.value);
		});
	}

	// Get answer counts per participant
	const answerCounts = await db
		.select({
			participantId: answers.participantId,
			count: sql<number>`cast(count(distinct ${answers.itemId}) as int)`,
		})
		.from(answers)
		.where(inArray(answers.participantId, participantData.map((p) => p.id)))
		.groupBy(answers.participantId);

	const answerCountMap = new Map<string, number>();
	answerCounts.forEach((row) => {
		if (row.participantId) {
			answerCountMap.set(row.participantId, row.count);
		}
	});

	// Build journeys
	const journeys: ParticipantJourney[] = participantData.map((p) => {
		const timeSpent =
			p.submittedAt && p.joinedAt
				? Math.round((p.submittedAt.getTime() - p.joinedAt.getTime()) / 1000)
				: null;

		const answeredQuestions = answerCountMap.get(p.id) || 0;
		const progressPercentage = totalQuestions > 0 ? answeredQuestions / totalQuestions : 0;

		return {
			participantId: p.id,
			alias: p.alias,
			joinedAt: p.joinedAt,
			submittedAt: p.submittedAt,
			timeSpent,
			lastSeenItemId: p.lastSeenItemId,
			lastSeenQuestionText: p.lastSeenItemId ? itemTexts.get(p.lastSeenItemId) || null : null,
			completed: p.submittedAt !== null,
			answeredQuestions,
			totalQuestions,
			progressPercentage,
		};
	});

	return journeys;
}

// ============================================================================
// Individual Responses
// ============================================================================

export interface QuestionMetadata {
	itemId: string;
	questionText: string;
	questionType: "text" | "slider" | "options";
	order: number;
	metadata?: any;
}

export interface IndividualResponse {
	responseId: string;
	respondent: string;
	submittedAt: Date;
	answers: Record<string, string>; // itemId -> formatted answer value
}

export interface IndividualResponsesResult {
	responses: IndividualResponse[];
	questions: QuestionMetadata[];
	pagination: {
		page: number;
		pageSize: number;
		totalResponses: number;
		totalPages: number;
	};
}

export async function getIndividualResponses(
	eventId: string,
	userId: string,
	page: number = 1,
	pageSize: number = 50
): Promise<IndividualResponsesResult> {
	// Validate event and authorization
	const event = await getEventOrThrow(eventId);
	validateEventCreator(event.creatorId, userId);

	// Get all questions for the event ordered by order field
	const questions = await db
		.select({
			itemId: items.id,
			questionText: items.value,
			questionType: items.questionType,
			order: items.order,
			metadata: items.metadata,
		})
		.from(items)
		.where(and(eq(items.eventId, eventId), eq(items.category, "question")))
		.orderBy(items.order);

	// Get total count of responses for pagination
	const [countResult] = await db
		.select({
			total: sql<number>`cast(count(*) as int)`,
		})
		.from(responses)
		.where(eq(responses.eventId, eventId));

	const totalResponses = countResult?.total || 0;
	const totalPages = Math.ceil(totalResponses / pageSize);
	const offset = (page - 1) * pageSize;

	// Get paginated responses with user email
	const responseData = await db
		.select({
			id: responses.id,
			submittedAt: responses.submittedAt,
			email: user.email,
		})
		.from(responses)
		.leftJoin(user, eq(responses.userId, user.id))
		.where(eq(responses.eventId, eventId))
		.orderBy(desc(responses.submittedAt))
		.limit(pageSize)
		.offset(offset);

	if (responseData.length === 0) {
		return {
			responses: [],
			questions: questions.map((q) => ({
				itemId: q.itemId,
				questionText: q.questionText,
				questionType: q.questionType as "text" | "slider" | "options",
				order: q.order,
				metadata: q.metadata,
			})),
			pagination: {
				page,
				pageSize,
				totalResponses,
				totalPages,
			},
		};
	}

	// Batch fetch all answers for the paginated responses
	const responseIds = responseData.map((r) => r.id);
	const answerData = await db
		.select({
			responseId: answers.responseId,
			itemId: answers.itemId,
			value: answers.value,
		})
		.from(answers)
		.where(inArray(answers.responseId, responseIds));

	// Build answer map: responseId -> (itemId -> value)
	const answerMap = new Map<string, Map<string, string[]>>();
	answerData.forEach((answer) => {
		if (!answerMap.has(answer.responseId)) {
			answerMap.set(answer.responseId, new Map());
		}
		answerMap.get(answer.responseId)!.set(answer.itemId, answer.value);
	});

	// Build question metadata map for formatting
	const questionMetadataMap = new Map<string, { type: "text" | "slider" | "options"; metadata?: any }>();
	questions.forEach((q) => {
		questionMetadataMap.set(q.itemId, {
			type: q.questionType as "text" | "slider" | "options",
			metadata: q.metadata,
		});
	});

	// Transform into IndividualResponse objects
	const individualResponses: IndividualResponse[] = responseData.map((r) => {
		const responseAnswers = answerMap.get(r.id) || new Map();
		const formattedAnswers: Record<string, string> = {};

		// Format each answer using formatAnswerValue
		questions.forEach((q) => {
			const rawValue = responseAnswers.get(q.itemId);
			const questionMeta = questionMetadataMap.get(q.itemId);
			formattedAnswers[q.itemId] = formatAnswerValue(
				rawValue,
				questionMeta?.type || null,
				questionMeta?.metadata
			);
		});

		return {
			responseId: r.id,
			respondent: r.email || "Anonymous",
			submittedAt: r.submittedAt,
			answers: formattedAnswers,
		};
	});

	return {
		responses: individualResponses,
		questions: questions.map((q) => ({
			itemId: q.itemId,
			questionText: q.questionText,
			questionType: q.questionType as "text" | "slider" | "options",
			order: q.order,
			metadata: q.metadata,
		})),
		pagination: {
			page,
			pageSize,
			totalResponses,
			totalPages,
		},
	};
}

// ============================================================================
// Full Analytics (Combined)
// ============================================================================

export interface FullAnalytics {
	event: {
		id: string;
		title: string;
		type: string;
		createdAt: Date;
	};
	overview: OverviewMetrics;
	timeline: ResponseTimelinePoint[];
	abandonmentFunnel: AbandonmentFunnelStep[];
	questions: QuestionAnalytics[];
	participants: ParticipantJourney[];
	individualResponses?: IndividualResponsesResult;
}

export async function getFullAnalytics(eventId: string, userId: string): Promise<FullAnalytics> {
	const event = await getEventOrThrow(eventId);
	validateEventCreator(event.creatorId, userId);

	const [overview, timeline, abandonmentFunnel, questions, participants] = await Promise.all([
		getOverviewMetrics(eventId, userId),
		getResponseTimeline(eventId, userId),
		getAbandonmentFunnel(eventId, userId),
		getQuestionAnalytics(eventId, userId),
		getParticipantJourneys(eventId, userId),
	]);

	// Include individual responses for forms and polls
	let individualResponses: IndividualResponsesResult | undefined;
	if (event.type === "form" || event.type === "poll") {
		// Fetch all responses (up to 10000) for export functionality
		individualResponses = await getIndividualResponses(eventId, userId, 1, 10000);
	}

	return {
		event: {
			id: event.id,
			title: event.title,
			type: event.type,
			createdAt: event.createdAt,
		},
		overview,
		timeline,
		abandonmentFunnel,
		questions,
		participants,
		individualResponses,
	};
}
