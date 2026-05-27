import { TRPCError } from "@trpc/server";
import { db } from "@repo/database";
import { events, items, participants, responses, answers, user } from "@repo/database/schema";
import { eq, and, isNull, ne, sql, desc, count as drizzleCount } from "drizzle-orm";
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
			.where(sql`${answers.responseId} = ANY(${responseData.map((r) => r.id)})`)
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
			.where(sql`${items.id} = ANY(${itemIds})`);

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
		.where(sql`${answers.participantId} = ANY(${participantData.map((p) => p.id)})`)
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
	};
}
