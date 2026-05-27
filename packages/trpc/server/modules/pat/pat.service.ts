import { TRPCError } from "@trpc/server";
import { db } from "@repo/database";
import { personalAccessTokens } from "@repo/database/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { createHash, randomBytes } from "crypto";
import type { User } from "../../shared/types";
import type { GeneratePATInput } from "./pat.schema";

// ============================================================================
// Helper Functions
// ============================================================================

function generateToken(): string {
	// Generate format: que_pat_<32_random_chars>
	const randomPart = randomBytes(16).toString("hex"); // 32 chars
	return `que_pat_${randomPart}`;
}

function hashToken(token: string): string {
	return createHash("sha256").update(token).digest("hex");
}

export function validatePATFormat(token: string): boolean {
	if (!token.startsWith("que_pat_")) return false;
	if (token.length !== 40) return false; // que_pat_ (8) + 32 chars
	return true;
}

async function getActivePATOrNull(userId: string) {
	const [pat] = await db
		.select()
		.from(personalAccessTokens)
		.where(and(eq(personalAccessTokens.userId, userId), isNull(personalAccessTokens.revokedAt)))
		.limit(1);

	return pat || null;
}

// ============================================================================
// PAT Operations
// ============================================================================

export async function generatePAT(data: GeneratePATInput, user: User) {
	// Check if user already has an active PAT
	const existingPAT = await getActivePATOrNull(user.id);

	if (existingPAT) {
		throw new TRPCError({
			code: "CONFLICT",
			message: "You already have an active PAT. Please revoke it first before generating a new one.",
		});
	}

	// Generate new token
	const token = generateToken();
	const tokenHash = hashToken(token);

	// Store in database
	const [pat] = await db
		.insert(personalAccessTokens)
		.values({
			userId: user.id,
			tokenHash,
			name: data.name || "Default PAT",
			createdAt: new Date(),
		})
		.returning();

	if (!pat) {
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Failed to generate PAT",
		});
	}

	return {
		token, // Only time the plaintext token is returned
		id: pat.id,
		createdAt: pat.createdAt,
		message: "Store this token securely. It won't be shown again.",
	};
}

export async function revokePAT(userId: string) {
	const existingPAT = await getActivePATOrNull(userId);

	if (!existingPAT) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "No active PAT found",
		});
	}

	await db
		.update(personalAccessTokens)
		.set({ revokedAt: new Date() })
		.where(eq(personalAccessTokens.id, existingPAT.id));

	return {
		success: true,
		message: "PAT revoked successfully",
	};
}

export async function getPATStatus(userId: string) {
	const pat = await getActivePATOrNull(userId);

	if (!pat) {
		return {
			hasActivePAT: false,
			createdAt: null,
			lastUsedAt: null,
			name: null,
		};
	}

	return {
		hasActivePAT: true,
		createdAt: pat.createdAt,
		lastUsedAt: pat.lastUsedAt,
		name: pat.name,
	};
}

// ============================================================================
// PAT Authentication (for middleware)
// ============================================================================

export async function authenticatePAT(token: string): Promise<string | null> {
	// Validate format
	if (!validatePATFormat(token)) {
		return null;
	}

	// Hash and lookup
	const tokenHash = hashToken(token);

	const [pat] = await db
		.select()
		.from(personalAccessTokens)
		.where(and(eq(personalAccessTokens.tokenHash, tokenHash), isNull(personalAccessTokens.revokedAt)))
		.limit(1);

	if (!pat) {
		return null;
	}

	// Check expiry
	if (pat.expiresAt && pat.expiresAt < new Date()) {
		return null;
	}

	// Update last used timestamp (async, don't wait)
	db.update(personalAccessTokens)
		.set({ lastUsedAt: new Date() })
		.where(eq(personalAccessTokens.id, pat.id))
		.then(() => {})
		.catch(() => {});

	return pat.userId;
}
