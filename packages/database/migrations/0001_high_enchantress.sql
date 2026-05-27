CREATE TYPE "public"."event_status" AS ENUM('draft', 'published', 'archived', 'completed', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('form', 'poll', 'banter');--> statement-breakpoint
CREATE TYPE "public"."item_category" AS ENUM('question', 'chat');--> statement-breakpoint
CREATE TYPE "public"."question_type" AS ENUM('text', 'slider', 'options');--> statement-breakpoint
CREATE TYPE "public"."result_visibility" AS ENUM('all', 'creator_only');--> statement-breakpoint
CREATE TYPE "public"."visibility" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TABLE "answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"response_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"value" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" text NOT NULL,
	"type" "event_type" NOT NULL,
	"status" "event_status" DEFAULT 'draft' NOT NULL,
	"visibility" "visibility" DEFAULT 'public' NOT NULL,
	"result_visibility" "result_visibility" DEFAULT 'all' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"slug" text NOT NULL,
	"auth_required" boolean DEFAULT false NOT NULL,
	"multiple_responses" boolean DEFAULT false NOT NULL,
	"receive_emails" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"category" "item_category" NOT NULL,
	"value" text NOT NULL,
	"order" double precision DEFAULT 0 NOT NULL,
	"participant_id" uuid,
	"question_type" "question_type",
	"required" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"user_id" text,
	"alias" text NOT NULL,
	"last_seen_item_id" uuid,
	"submitted_at" timestamp with time zone,
	"joined_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"participant_id" uuid,
	"ip_hash" text,
	"user_agent" text,
	"submitted_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "answers_response_idx" ON "answers" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX "answers_item_idx" ON "answers" USING btree ("item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "answers_response_item_uidx" ON "answers" USING btree ("response_id","item_id");--> statement-breakpoint
CREATE INDEX "events_creator_idx" ON "events" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "events_slug_idx" ON "events" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "events_status_visibility_idx" ON "events" USING btree ("status","visibility");--> statement-breakpoint
CREATE INDEX "items_event_idx" ON "items" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "items_event_order_idx" ON "items" USING btree ("event_id","order");--> statement-breakpoint
CREATE UNIQUE INDEX "participants_event_user_uidx" ON "participants" USING btree ("event_id","user_id");--> statement-breakpoint
CREATE INDEX "participants_event_idx" ON "participants" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "responses_event_idx" ON "responses" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "responses_participant_idx" ON "responses" USING btree ("participant_id");