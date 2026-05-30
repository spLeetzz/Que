import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { anonymous, openAPI } from "better-auth/plugins";
import { db } from "@repo/database";
import { events, participants } from "@repo/database/schema";
import { sendEmail } from "@repo/services";
import { logger } from "@repo/logger";
import { eq } from "drizzle-orm";
import * as authSchema from "./schema";
import { env } from "./env";
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { ...authSchema },
  }),

  baseURL: env.BETTER_AUTH_URL,

  advanced: {
    useSecureCookies: env.NODE_ENV === "production", // secure cookies in production but allow normal in dev
  },

  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      const parsedUrl = new URL(url);
      const token = parsedUrl.searchParams.get("token");
      const clientUrl = `${env.WEB_URL}/verify-email?token=${token}`;

      void sendEmail({ //resend suggests not awaiting it
        apiKey: env.RESEND_API_KEY,
        to: user.email,
        subject: "Verify your email address",
        html: `<p><a href="${clientUrl}">Click here</a> to verify your email.</p>`,
      });
    },
    afterEmailVerification: async (user) => {
      await migrateAnonymousUserData(user.id);
    },
  },

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignInAfterVerification: true,
    requireEmailVerification: true,
  },

  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID!,
      clientSecret: env.GOOGLE_CLIENT_SECRET!,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 15,
    },
  },

  rateLimit: {
    enabled: true,
    window: 60,
    max: 10,
  },

  trustedOrigins: [env.WEB_URL, "http://localhost:3000"],

  plugins: [
    openAPI(),
    anonymous({
      disableDeleteAnonymousUser: true,
      onLinkAccount: async ({ anonymousUser, newUser }) => {
        try {
          await db
            .update(authSchema.user)
            .set({ linkedAnonymousId: anonymousUser.user.id })
            .where(eq(authSchema.user.id, newUser.user.id));
        } catch (error) {
          logger.error(
            "Failed to store anonymous user link during account linking",
            {
              anonymousUserId: anonymousUser.user.id,
              newUserId: newUser.user.id,
              error,
            },
          );
        }
      },
    }),
  ],
});

/**
 * Migrates event ownership from a linked anonymous user to the verified user,
 * then cleans up the anonymous user record.
 *
 * Called after successful email verification. Uses a transaction to ensure
 * atomicity, either all events are migrated and the anonymous user is deleted,
 * or nothing changes.
 */
async function migrateAnonymousUserData(
  verifiedUserId: string,
): Promise<void> {
  const [record] = await db
    .select({ linkedAnonymousId: authSchema.user.linkedAnonymousId })
    .from(authSchema.user)
    .where(eq(authSchema.user.id, verifiedUserId))
    .limit(1);

  if (!record?.linkedAnonymousId) return;

  const anonymousUserId = record.linkedAnonymousId;

  // Verify that the linked target is indeed an anonymous user record
  const [anonUserRecord] = await db
    .select({ isAnonymous: authSchema.user.isAnonymous })
    .from(authSchema.user)
    .where(eq(authSchema.user.id, anonymousUserId))
    .limit(1);

  if (!anonUserRecord || !anonUserRecord.isAnonymous) {
    logger.warn(
      `Skipping data migration: Linked user ${anonymousUserId} is not anonymous or does not exist.`,
    );
    // Clear the link reference to keep data clean
    await db
      .update(authSchema.user)
      .set({ linkedAnonymousId: null })
      .where(eq(authSchema.user.id, verifiedUserId));
    return;
  }
  try {
    await db.transaction(async (tx) => {
      // 1. Transfer event ownership
      await tx
        .update(events)
        .set({ creatorId: verifiedUserId })
        .where(eq(events.creatorId, anonymousUserId));

      // 2. Transfer event participation history (so responses/answers are not orphaned)
      await tx
        .update(participants)
        .set({ userId: verifiedUserId })
        .where(eq(participants.userId, anonymousUserId));

      // 3. Clear the link reference
      await tx
        .update(authSchema.user)
        .set({ linkedAnonymousId: null })
        .where(eq(authSchema.user.id, verifiedUserId));

      // 4. Delete the anonymous user (cascades sessions + accounts via FK)
      await tx
        .delete(authSchema.user)
        .where(eq(authSchema.user.id, anonymousUserId));
    });
  } catch (error) {
    logger.error(
      "Failed to migrate anonymous user data after email verification",
      {
        anonymousUserId,
        verifiedUserId,
        error,
      },
    );
  }
}

export type Auth = typeof auth;
