ALTER TABLE "responses" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "responses_user_idx" ON "responses" USING btree ("user_id");