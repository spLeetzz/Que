CREATE TYPE "public"."event_mode" AS ENUM('standard', 'service');--> statement-breakpoint
CREATE TABLE "form_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"state_token" text NOT NULL,
	"external_user_id" text NOT NULL,
	"metadata" jsonb,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"response_id" uuid,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	CONSTRAINT "form_states_state_token_unique" UNIQUE("state_token")
);
--> statement-breakpoint
CREATE TABLE "personal_access_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"name" text DEFAULT 'Default PAT' NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "personal_access_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "mode" "event_mode" DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "redirect_url" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "hidden_fields" jsonb;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "theme" text;--> statement-breakpoint
ALTER TABLE "responses" ADD COLUMN "state_id" uuid;--> statement-breakpoint
ALTER TABLE "responses" ADD COLUMN "external_user_id" text;--> statement-breakpoint
ALTER TABLE "responses" ADD COLUMN "external_metadata" jsonb;--> statement-breakpoint
ALTER TABLE "form_states" ADD CONSTRAINT "form_states_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_states" ADD CONSTRAINT "form_states_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_access_tokens" ADD CONSTRAINT "personal_access_tokens_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "form_states_event_idx" ON "form_states" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "form_states_token_idx" ON "form_states" USING btree ("state_token");--> statement-breakpoint
CREATE INDEX "form_states_expires_idx" ON "form_states" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "form_states_external_user_idx" ON "form_states" USING btree ("external_user_id");--> statement-breakpoint
CREATE INDEX "pat_user_idx" ON "personal_access_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "pat_token_hash_idx" ON "personal_access_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "pat_one_active_per_user_uidx" ON "personal_access_tokens" USING btree ("user_id") WHERE "personal_access_tokens"."revoked_at" IS NULL;--> statement-breakpoint
CREATE INDEX "events_mode_idx" ON "events" USING btree ("mode");--> statement-breakpoint
CREATE INDEX "responses_state_idx" ON "responses" USING btree ("state_id");--> statement-breakpoint
CREATE INDEX "responses_external_user_idx" ON "responses" USING btree ("external_user_id");