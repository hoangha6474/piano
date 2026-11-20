CREATE TABLE "library_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"score" jsonb NOT NULL,
	"published_score" jsonb,
	"object_key" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"published_revision" integer,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "library_scores_object_key_unique" UNIQUE("object_key"),
	CONSTRAINT "library_scores_status_check" CHECK ("library_scores"."status" in ('draft', 'published', 'hidden')),
	CONSTRAINT "library_scores_revision_check" CHECK ("library_scores"."revision" > 0)
);
--> statement-breakpoint
ALTER TABLE "library_scores" ADD CONSTRAINT "library_scores_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_scores" ADD CONSTRAINT "library_scores_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "library_scores_status_idx" ON "library_scores" USING btree ("status");