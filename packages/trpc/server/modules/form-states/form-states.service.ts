import { TRPCError } from "@trpc/server";
import { db } from "@repo/database";
import { formStates, events } from "@repo/database/schema";
import { eq, and, isNull, ne } from "drizzle-orm";
import { createHash, randomBytes } from "crypto";
import type { CreateStateInput, ValidateStateInput } from "./form-states.schema";

// Simple signed token approach using crypto (no external dependencies)
// Token format: base64(stateId:expiresAt:signature)
const SECRET = process.env.STATE_TOKEN_SECRET || process.env.JWT_SECRET || "change-in-production";

// ============================================================================
// Helper Functions
// ============================================================================

function generateStateToken(stateId: string, expiresAt: Date): string {
	// Create payload: stateId:timestamp
	const payload = `${stateId}:${expiresAt.getTime()}`;
	
	// Create signature using HMAC
	const signature = createHash("sha256")
		.update(payload + SECRET)
		.digest("hex");
	
	// Combine and encode: payload:signature
	const token = Buffer.from(`${payload}:${signature}`).toString("base64url");
	
	return token;
}

function verifyStateToken(token: string): { stateId: string; expiresAt: Date } | null {
	try {
		// Decode token
		const decoded = Buffer.from(token, "base64url").toString("utf-8");
		const [stateId, timestamp, signature] = decoded.split(":");
		
		if (!stateId || !timestamp || !signature) {
			return null;
		}
		
		// Verify signature
		const payload = `${stateId}:${timestamp}`;
		const expectedSignature = createHash("sha256")
			.update(payload + SECRET)
			.digest("hex");
		
		if (signature !== expectedSignature) {
			return null;
		}
		
		// Check expiry
		const expiresAt = new Date(parseInt(timestamp));
		if (expiresAt < new Date()) {
			return null;
		}
		
		return { stateId, expiresAt };
	} catch {
		return null;
	}
}

async function getServiceModeEventOrThrow(eventId: string) {
	const [event] = await db
		.select()
		.from(events)
		.where(and(eq(events.id, eventId), eq(events.mode, "service"), isNull(events.deletedAt), ne(events.status, "deleted")))
		.limit(1);

	if (!event) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Service mode event not found",
		});
	}

	return event;
}

// ============================================================================
// State Operations
// ============================================================================

export async function createFormState(data: CreateStateInput, userId: string) {
	// Verify event exists and is in service mode
	const event = await getServiceModeEventOrThrow(data.eventId);

	// Verify user owns the event
	if (event.creatorId !== userId) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You are not authorized to create states for this event",
		});
	}

	// Calculate expiry
	const expiresAt = new Date(Date.now() + data.expiresIn * 1000);

	// Create state record
	const [state] = await db
		.insert(formStates)
		.values({
			eventId: data.eventId,
			stateToken: "", // Will be updated after token generation
			externalUserId: data.externalUserId,
			metadata: data.metadata || null,
			expiresAt,
			createdAt: new Date(),
		})
		.returning();

	if (!state) {
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Failed to create form state",
		});
	}

	// Generate signed token
	const stateToken = generateStateToken(state.id, expiresAt);

	// Update state with token
	await db.update(formStates).set({ stateToken }).where(eq(formStates.id, state.id));

	// Generate form URL
	const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
	const formUrl = `${baseUrl}/forms/${data.eventId}?state=${stateToken}`;

	return {
		stateToken,
		formUrl,
		expiresAt,
	};
}

export async function validateFormState(data: ValidateStateInput) {
	// Verify and decode token
	const decoded = verifyStateToken(data.stateToken);
	
	if (!decoded) {
		return { valid: false };
	}

	// Lookup state in database
	const [state] = await db
		.select()
		.from(formStates)
		.where(and(eq(formStates.id, decoded.stateId), eq(formStates.eventId, data.eventId)))
		.limit(1);

	if (!state) {
		return { valid: false };
	}

	// Check if expired
	if (state.expiresAt < new Date()) {
		return { valid: false };
	}

	// Check if already used
	if (state.usedAt) {
		return {
			valid: false,
			used: true,
		};
	}

	return {
		valid: true,
		stateId: state.id,
		externalUserId: state.externalUserId,
		metadata: state.metadata as Record<string, any> | undefined,
		expiresAt: state.expiresAt,
		used: false,
	};
}

export async function markStateAsUsed(stateId: string, responseId: string) {
	await db
		.update(formStates)
		.set({
			usedAt: new Date(),
			responseId,
		})
		.where(eq(formStates.id, stateId));
}
