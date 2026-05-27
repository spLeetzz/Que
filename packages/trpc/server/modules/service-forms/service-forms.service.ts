import { TRPCError } from "@trpc/server";
import { db } from "@repo/database";
import { events, items } from "@repo/database/schema";
import { eq, and, isNull, ne, desc, count as drizzleCount } from "drizzle-orm";
import type {
	CreateServiceFormInput,
	UpdateServiceFormInput,
	GetServiceFormInput,
	DeleteServiceFormInput,
	ListServiceFormsInput,
	HiddenField,
} from "./service-forms.schema";

// ============================================================================
// Helper Functions
// ============================================================================

async function getServiceFormOrThrow(formId: string, userId: string) {
	const [form] = await db
		.select()
		.from(events)
		.where(
			and(
				eq(events.id, formId),
				eq(events.mode, "service"),
				eq(events.creatorId, userId),
				isNull(events.deletedAt),
				ne(events.status, "deleted")
			)
		)
		.limit(1);

	if (!form) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Service form not found",
		});
	}

	return form;
}

function validateHiddenFields(hiddenFields: any[]) {
	// Ensure at least one hidden field exists
	if (!hiddenFields || hiddenFields.length === 0) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "At least one hidden field is required for service mode forms",
		});
	}

	// Validate external_user_id exists
	const hasExternalUserId = hiddenFields.some((field) => field.key === "external_user_id");
	if (!hasExternalUserId) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Hidden field 'external_user_id' is required",
		});
	}
}

// ============================================================================
// CRUD Operations
// ============================================================================

export async function createServiceForm(data: CreateServiceFormInput, userId: string) {
	// Validate hidden fields
	validateHiddenFields(data.hiddenFields);



	return db.transaction(async (tx) => {
		// Create event in service mode
		const [form] = await tx
			.insert(events)
			.values({
				creatorId: userId,
				type: data.type,
				mode: "service",
				status: "draft",
				title: data.title,
				description: data.description || null,
				redirectUrl: data.redirectUrl,
				hiddenFields: data.hiddenFields,
				visibility: "public", // Service forms are always public (but require state)
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		if (!form) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to create service form",
			});
		}

		// Create questions if provided
		if (data.questions && data.questions.length > 0) {
			const questionsToInsert = data.questions.map((q, index) => ({
				eventId: form.id,
				category: "question" as const,
				value: q.value,
				questionType: q.questionType,
				required: q.required,
				metadata: q.metadata || null,
				order: q.order !== undefined ? q.order : index + 1,
			}));

			await tx.insert(items).values(questionsToInsert);
		}

		return {
			id: form.id,
			title: form.title,
			description: form.description,
			type: form.type as "form" | "poll",
			mode: form.mode as "service",
			redirectUrl: form.redirectUrl!,
			hiddenFields: (form.hiddenFields as HiddenField[]) || [],
			createdAt: form.createdAt,
			updatedAt: form.updatedAt,
		};
	});
}

export async function getServiceForm(data: GetServiceFormInput, userId: string) {
	const form = await getServiceFormOrThrow(data.id, userId);

	return {
		id: form.id,
		title: form.title,
		description: form.description,
		type: form.type as "form" | "poll",
		mode: form.mode as "service",
		redirectUrl: form.redirectUrl!,
		hiddenFields: (form.hiddenFields as HiddenField[]) || [],
		createdAt: form.createdAt,
		updatedAt: form.updatedAt,
	};
}

export async function listServiceForms(data: ListServiceFormsInput, userId: string) {
	const offset = (data.page - 1) * data.pageSize;

	const [forms, [totalResult]] = await Promise.all([
		db
			.select()
			.from(events)
			.where(
				and(
					eq(events.creatorId, userId),
					eq(events.mode, "service"),
					isNull(events.deletedAt),
					ne(events.status, "deleted")
				)
			)
			.orderBy(desc(events.createdAt))
			.limit(data.pageSize)
			.offset(offset),
		db
			.select({ total: drizzleCount() })
			.from(events)
			.where(
				and(
					eq(events.creatorId, userId),
					eq(events.mode, "service"),
					isNull(events.deletedAt),
					ne(events.status, "deleted")
				)
			),
	]);

	const total = totalResult?.total || 0;

	return {
		forms: forms.map((form) => ({
			id: form.id,
			title: form.title,
			description: form.description,
			type: form.type as "form" | "poll",
			mode: form.mode as "service",
			redirectUrl: form.redirectUrl!,
			hiddenFields: (form.hiddenFields as HiddenField[]) || [],
			createdAt: form.createdAt,
			updatedAt: form.updatedAt,
		})),
		pagination: {
			page: data.page,
			pageSize: data.pageSize,
			total,
			totalPages: Math.ceil(total / data.pageSize),
		},
	};
}

export async function updateServiceForm(data: UpdateServiceFormInput, userId: string) {
	const form = await getServiceFormOrThrow(data.id, userId);

	// Validate hidden fields if provided
	if (data.hiddenFields) {
		validateHiddenFields(data.hiddenFields);
	}

	const updateData: any = {
		updatedAt: new Date(),
	};

	if (data.title) updateData.title = data.title;
	if (data.description !== undefined) updateData.description = data.description;
	if (data.redirectUrl) updateData.redirectUrl = data.redirectUrl;
	if (data.hiddenFields) updateData.hiddenFields = data.hiddenFields;

	const [updated] = await db.update(events).set(updateData).where(eq(events.id, data.id)).returning();

	if (!updated) {
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Failed to update service form",
		});
	}

	return {
		id: updated.id,
		title: updated.title,
		description: updated.description,
		type: updated.type as "form" | "poll",
		mode: updated.mode as "service",
		redirectUrl: updated.redirectUrl!,
		hiddenFields: (updated.hiddenFields as HiddenField[]) || [],
		createdAt: updated.createdAt,
		updatedAt: updated.updatedAt,
	};
}

export async function deleteServiceForm(data: DeleteServiceFormInput, userId: string) {
	await getServiceFormOrThrow(data.id, userId);

	await db
		.update(events)
		.set({
			status: "deleted",
			deletedAt: new Date(),
			updatedAt: new Date(),
		})
		.where(eq(events.id, data.id));

	return {
		success: true,
		message: "Service form deleted successfully",
	};
}
