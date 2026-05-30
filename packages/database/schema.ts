import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  timestamp,
  jsonb,
  doublePrecision,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  isAnonymous: boolean("is_anonymous").default(false),
  linkedAnonymousId: text("linked_anonymous_id"),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));



export const eventTypeEnum = pgEnum("event_type", ["form", "poll", "banter"]);

export const eventStatusEnum = pgEnum("event_status", [
  "draft",
  "published",
  "archived",
  "completed",
  "deleted",
]);

export const eventModeEnum = pgEnum("event_mode", ["standard", "service"]);

export const visibilityEnum = pgEnum("visibility", ["public", "private"]);

export const resultVisibilityEnum = pgEnum("result_visibility", ["all", "creator_only"]);

export const itemCategoryEnum = pgEnum("item_category", ["question", "chat"]);

export const questionTypeEnum = pgEnum("question_type", ["text", "slider", "options"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`NOW()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`NOW()`),
};

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    creatorId: text("creator_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    type: eventTypeEnum("type").notNull(),
    status: eventStatusEnum("status").notNull().default("draft"),
    mode: eventModeEnum("mode").notNull().default("standard"),
    visibility: visibilityEnum("visibility").notNull().default("public"),
    resultVisibility: resultVisibilityEnum("result_visibility").notNull().default("all"),
    title: text("title").notNull(),
    description: text("description"),
    slug: text("slug").unique(),
    authRequired: boolean("auth_required").notNull().default(false),
    multipleResponses: boolean("multiple_responses").notNull().default(false),
    receiveEmails: boolean("receive_emails").notNull().default(false),
    redirectUrl: text("redirect_url"),
    hiddenFields: jsonb("hidden_fields"),
    theme: text("theme"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("events_creator_idx").on(t.creatorId),
    index("events_slug_idx").on(t.slug),
    index("events_status_visibility_idx").on(t.status, t.visibility),
    index("events_mode_idx").on(t.mode),
  ],
);

export const items = pgTable(
  "items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    category: itemCategoryEnum("category").notNull(),
    value: text("value").notNull(),
    order: doublePrecision("order").notNull().default(0),
    participantId: uuid("participant_id"), // chat only, null for questions
    questionType: questionTypeEnum("question_type"), // questions only, null for chat
    required: boolean("required").notNull().default(false),
    metadata: jsonb("metadata"),
    ...timestamps,
  },
  (t) => [
    index("items_event_idx").on(t.eventId),
    index("items_event_order_idx").on(t.eventId, t.order),
  ],
);

export const participants = pgTable(
  "participants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    alias: text("alias").notNull(),
    lastSeenItemId: uuid("last_seen_item_id"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .default(sql`NOW()`),
  },
  (t) => [
    uniqueIndex("participants_event_user_uidx").on(t.eventId, t.userId),
    index("participants_event_idx").on(t.eventId),
  ],
);

export const responses = pgTable(
  "responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    participantId: uuid("participant_id").references(() => participants.id, {
      onDelete: "set null",
    }),
    userId: text("user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    stateId: uuid("state_id"),
    externalUserId: text("external_user_id"),
    externalMetadata: jsonb("external_metadata"),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .default(sql`NOW()`),
  },
  (t) => [
    index("responses_event_idx").on(t.eventId),
    index("responses_participant_idx").on(t.participantId),
    index("responses_user_idx").on(t.userId),
    index("responses_state_idx").on(t.stateId),
    index("responses_external_user_idx").on(t.externalUserId),
  ],
);

export const answers = pgTable(
  "answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    responseId: uuid("response_id")
      .notNull()
      .references(() => responses.id, { onDelete: "cascade" }),
    participantId: uuid("participant_id")
      .references(() => participants.id, { onDelete: "cascade" }),
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    value: text("value").array().notNull().default([]),
    ...timestamps,
  },
  (t) => [
    index("answers_response_idx").on(t.responseId),
    index("answers_item_idx").on(t.itemId),
    uniqueIndex("answers_response_item_uidx").on(t.responseId, t.itemId),
  ],
);




export const personalAccessTokens = pgTable(
  "personal_access_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    name: text("name").notNull().default("Default PAT"),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`NOW()`),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [
    index("pat_user_idx").on(t.userId),
    index("pat_token_hash_idx").on(t.tokenHash),
    // Unique constraint: only one active PAT per user
    uniqueIndex("pat_one_active_per_user_uidx").on(t.userId).where(sql`${t.revokedAt} IS NULL`),
  ],
);



export const formStates = pgTable(
  "form_states",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    stateToken: text("state_token").notNull().unique(),
    externalUserId: text("external_user_id").notNull(),
    metadata: jsonb("metadata"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    responseId: uuid("response_id").references(() => responses.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`NOW()`),
  },
  (t) => [
    index("form_states_event_idx").on(t.eventId),
    index("form_states_token_idx").on(t.stateToken),
    index("form_states_expires_idx").on(t.expiresAt),
    index("form_states_external_user_idx").on(t.externalUserId),
  ],
);

import { type InferSelectModel } from "drizzle-orm";
export type Event = InferSelectModel<typeof events>;
export type Item = InferSelectModel<typeof items>;
export type Participant = InferSelectModel<typeof participants>;
export type Response = InferSelectModel<typeof responses>;
export type Answer = InferSelectModel<typeof answers>;
export type FormState = InferSelectModel<typeof formStates>;
