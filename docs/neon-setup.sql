-- Initial schema for a new, empty Piano database.
BEGIN;
SET LOCAL search_path TO public;
CREATE TABLE "auth_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);


CREATE TABLE "ai_usage" (
	"user_id" text NOT NULL,
	"day" text NOT NULL,
	"count" integer NOT NULL,
	CONSTRAINT "ai_usage_user_id_day_pk" PRIMARY KEY("user_id","day")
);


CREATE TABLE "annotations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"score_version_id" uuid NOT NULL,
	"position" jsonb NOT NULL,
	"text" text,
	"color" text,
	"hand" text,
	"segment_id" uuid
);


CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"object_key" text NOT NULL,
	"mime" text NOT NULL,
	"bytes" integer NOT NULL,
	"sha256" text NOT NULL,
	"status" text DEFAULT 'ready' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assets_object_key_unique" UNIQUE("object_key"),
	CONSTRAINT "asset_size_positive" CHECK ("assets"."bytes">0)
);


CREATE TABLE "practice_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"exercise_id" uuid,
	"score_version_id" uuid,
	"segment_id" uuid,
	"number" integer NOT NULL,
	"mode" text NOT NULL,
	"tempo" jsonb NOT NULL,
	"idempotency_key" text NOT NULL,
	CONSTRAINT "practice_attempts_idempotency_key_unique" UNIQUE("idempotency_key")
);


CREATE TABLE "chapters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"level_id" uuid NOT NULL,
	"title" text NOT NULL,
	"position" integer NOT NULL
);


CREATE TABLE "attempt_errors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"type" text NOT NULL,
	"detail" jsonb NOT NULL
);


CREATE TABLE "exercise_scores" (
	"exercise_id" uuid NOT NULL,
	"score_version_id" uuid NOT NULL,
	CONSTRAINT "exercise_scores_exercise_id_score_version_id_pk" PRIMARY KEY("exercise_id","score_version_id")
);


CREATE TABLE "exercise_skills" (
	"exercise_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	CONSTRAINT "exercise_skills_exercise_id_skill_id_pk" PRIMARY KEY("exercise_id","skill_id")
);


CREATE TABLE "exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_version_id" uuid,
	"kind" text NOT NULL,
	"config" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);


CREATE TABLE "fingering_overrides" (
	"user_id" text NOT NULL,
	"score_version_id" uuid NOT NULL,
	"note_ref" text NOT NULL,
	"hand" text NOT NULL,
	"finger" integer NOT NULL,
	CONSTRAINT "fingering_overrides_user_id_score_version_id_note_ref_hand_pk" PRIMARY KEY("user_id","score_version_id","note_ref","hand"),
	CONSTRAINT "finger_range" CHECK ("fingering_overrides"."finger" between 1 and 5)
);


CREATE TABLE "personal_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"target" integer NOT NULL,
	"due_at" timestamp with time zone,
	"skill_id" uuid,
	"lesson_id" uuid,
	"score_id" uuid
);


CREATE TABLE "lesson_assets" (
	"lesson_version_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	CONSTRAINT "lesson_assets_lesson_version_id_asset_id_pk" PRIMARY KEY("lesson_version_id","asset_id")
);


CREATE TABLE "lesson_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"content" jsonb NOT NULL,
	"completion" jsonb NOT NULL
);


CREATE TABLE "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chapter_id" uuid NOT NULL,
	"title" text NOT NULL,
	"position" integer NOT NULL
);


CREATE TABLE "curriculum_levels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "curriculum_levels_code_unique" UNIQUE("code")
);


CREATE TABLE "score_part_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"score_version_id" uuid NOT NULL,
	"part" text NOT NULL,
	"hand" text NOT NULL
);


CREATE TABLE "plan_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"lesson_id" uuid,
	"exercise_id" uuid,
	"score_id" uuid
);


CREATE TABLE "practice_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"timezone" text NOT NULL,
	"local_time" text NOT NULL,
	"recurrence" jsonb NOT NULL,
	"status" text NOT NULL
);


CREATE TABLE "evaluation_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version" text NOT NULL,
	"config" jsonb NOT NULL,
	"approved" boolean DEFAULT false NOT NULL,
	CONSTRAINT "evaluation_policies_version_unique" UNIQUE("version")
);


CREATE TABLE "practice_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"active_seconds" integer NOT NULL,
	"status" text NOT NULL
);


CREATE TABLE "practice_preferences" (
	"user_id" text NOT NULL,
	"score_version_id" uuid NOT NULL,
	"bpm" integer NOT NULL,
	"hand" text NOT NULL,
	CONSTRAINT "practice_preferences_user_id_score_version_id_pk" PRIMARY KEY("user_id","score_version_id")
);


CREATE TABLE "user_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"timezone" text DEFAULT 'Asia/Ho_Chi_Minh' NOT NULL,
	"level" text DEFAULT 'Beginner' NOT NULL
);


CREATE TABLE "lesson_progress" (
	"user_id" text NOT NULL,
	"lesson_version_id" uuid NOT NULL,
	"status" text NOT NULL,
	"position" jsonb,
	"completed_at" timestamp with time zone,
	CONSTRAINT "lesson_progress_user_id_lesson_version_id_pk" PRIMARY KEY("user_id","lesson_version_id")
);


CREATE TABLE "auth_rate_limits" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL,
	CONSTRAINT "auth_rate_limits_key_unique" UNIQUE("key")
);


CREATE TABLE "exercise_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"question" jsonb NOT NULL,
	"answer" jsonb NOT NULL,
	"correct" boolean NOT NULL
);


CREATE TABLE "attempt_results" (
	"attempt_id" uuid PRIMARY KEY NOT NULL,
	"policy_id" uuid NOT NULL,
	"metrics" jsonb NOT NULL,
	"score" integer,
	"incomplete" boolean NOT NULL
);


CREATE TABLE "scheduled_session_practice" (
	"scheduled_session_id" uuid NOT NULL,
	"practice_session_id" uuid NOT NULL,
	CONSTRAINT "scheduled_session_practice_scheduled_session_id_practice_session_id_pk" PRIMARY KEY("scheduled_session_id","practice_session_id")
);


CREATE TABLE "scheduled_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"plan_id" uuid NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"status" text NOT NULL
);


CREATE TABLE "score_assets" (
	"score_version_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"role" text NOT NULL,
	CONSTRAINT "score_assets_score_version_id_asset_id_role_pk" PRIMARY KEY("score_version_id","asset_id","role")
);


CREATE TABLE "score_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"score_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"status" text NOT NULL,
	"converter" text
);


CREATE TABLE "scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text,
	"title" text NOT NULL,
	"source" text NOT NULL,
	"license" text NOT NULL
);


CREATE TABLE "practice_segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"score_version_id" uuid NOT NULL,
	"start" jsonb NOT NULL,
	"end" jsonb NOT NULL
);


CREATE TABLE "auth_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	CONSTRAINT "auth_sessions_token_unique" UNIQUE("token")
);


CREATE TABLE "attempt_skill_metrics" (
	"attempt_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"hand" text NOT NULL,
	"metrics" jsonb NOT NULL,
	CONSTRAINT "attempt_skill_metrics_attempt_id_skill_id_hand_pk" PRIMARY KEY("attempt_id","skill_id","hand")
);


CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	CONSTRAINT "skills_code_unique" UNIQUE("code")
);


CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);


CREATE TABLE "user_score_library" (
	"user_id" text NOT NULL,
	"score_id" uuid NOT NULL,
	"mastered_at" timestamp with time zone,
	CONSTRAINT "user_score_library_user_id_score_id_pk" PRIMARY KEY("user_id","score_id")
);


CREATE TABLE "auth_verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);


CREATE TABLE "learning_workspaces" (
	"user_id" text PRIMARY KEY NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "annotations" ADD CONSTRAINT "annotations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "annotations" ADD CONSTRAINT "annotations_score_version_id_score_versions_id_fk" FOREIGN KEY ("score_version_id") REFERENCES "public"."score_versions"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "annotations" ADD CONSTRAINT "annotations_segment_id_practice_segments_id_fk" FOREIGN KEY ("segment_id") REFERENCES "public"."practice_segments"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "assets" ADD CONSTRAINT "assets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "practice_attempts" ADD CONSTRAINT "practice_attempts_session_id_practice_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."practice_sessions"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "practice_attempts" ADD CONSTRAINT "practice_attempts_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "practice_attempts" ADD CONSTRAINT "practice_attempts_score_version_id_score_versions_id_fk" FOREIGN KEY ("score_version_id") REFERENCES "public"."score_versions"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "practice_attempts" ADD CONSTRAINT "practice_attempts_segment_id_practice_segments_id_fk" FOREIGN KEY ("segment_id") REFERENCES "public"."practice_segments"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "chapters" ADD CONSTRAINT "chapters_level_id_curriculum_levels_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."curriculum_levels"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "attempt_errors" ADD CONSTRAINT "attempt_errors_attempt_id_practice_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."practice_attempts"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "exercise_scores" ADD CONSTRAINT "exercise_scores_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "exercise_scores" ADD CONSTRAINT "exercise_scores_score_version_id_score_versions_id_fk" FOREIGN KEY ("score_version_id") REFERENCES "public"."score_versions"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "exercise_skills" ADD CONSTRAINT "exercise_skills_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "exercise_skills" ADD CONSTRAINT "exercise_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "exercises" ADD CONSTRAINT "exercises_lesson_version_id_lesson_versions_id_fk" FOREIGN KEY ("lesson_version_id") REFERENCES "public"."lesson_versions"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "fingering_overrides" ADD CONSTRAINT "fingering_overrides_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "fingering_overrides" ADD CONSTRAINT "fingering_overrides_score_version_id_score_versions_id_fk" FOREIGN KEY ("score_version_id") REFERENCES "public"."score_versions"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "personal_goals" ADD CONSTRAINT "personal_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "personal_goals" ADD CONSTRAINT "personal_goals_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "personal_goals" ADD CONSTRAINT "personal_goals_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "personal_goals" ADD CONSTRAINT "personal_goals_score_id_scores_id_fk" FOREIGN KEY ("score_id") REFERENCES "public"."scores"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "lesson_assets" ADD CONSTRAINT "lesson_assets_lesson_version_id_lesson_versions_id_fk" FOREIGN KEY ("lesson_version_id") REFERENCES "public"."lesson_versions"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "lesson_assets" ADD CONSTRAINT "lesson_assets_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "lesson_versions" ADD CONSTRAINT "lesson_versions_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "lessons" ADD CONSTRAINT "lessons_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "score_part_assignments" ADD CONSTRAINT "score_part_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "score_part_assignments" ADD CONSTRAINT "score_part_assignments_score_version_id_score_versions_id_fk" FOREIGN KEY ("score_version_id") REFERENCES "public"."score_versions"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "plan_items" ADD CONSTRAINT "plan_items_plan_id_practice_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."practice_plans"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "plan_items" ADD CONSTRAINT "plan_items_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "plan_items" ADD CONSTRAINT "plan_items_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "plan_items" ADD CONSTRAINT "plan_items_score_id_scores_id_fk" FOREIGN KEY ("score_id") REFERENCES "public"."scores"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "practice_plans" ADD CONSTRAINT "practice_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "practice_preferences" ADD CONSTRAINT "practice_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "practice_preferences" ADD CONSTRAINT "practice_preferences_score_version_id_score_versions_id_fk" FOREIGN KEY ("score_version_id") REFERENCES "public"."score_versions"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_version_id_lesson_versions_id_fk" FOREIGN KEY ("lesson_version_id") REFERENCES "public"."lesson_versions"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "exercise_responses" ADD CONSTRAINT "exercise_responses_attempt_id_practice_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."practice_attempts"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "attempt_results" ADD CONSTRAINT "attempt_results_attempt_id_practice_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."practice_attempts"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "attempt_results" ADD CONSTRAINT "attempt_results_policy_id_evaluation_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."evaluation_policies"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "scheduled_session_practice" ADD CONSTRAINT "scheduled_session_practice_scheduled_session_id_scheduled_sessions_id_fk" FOREIGN KEY ("scheduled_session_id") REFERENCES "public"."scheduled_sessions"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "scheduled_session_practice" ADD CONSTRAINT "scheduled_session_practice_practice_session_id_practice_sessions_id_fk" FOREIGN KEY ("practice_session_id") REFERENCES "public"."practice_sessions"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "scheduled_sessions" ADD CONSTRAINT "scheduled_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "scheduled_sessions" ADD CONSTRAINT "scheduled_sessions_plan_id_practice_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."practice_plans"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "score_assets" ADD CONSTRAINT "score_assets_score_version_id_score_versions_id_fk" FOREIGN KEY ("score_version_id") REFERENCES "public"."score_versions"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "score_assets" ADD CONSTRAINT "score_assets_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "score_versions" ADD CONSTRAINT "score_versions_score_id_scores_id_fk" FOREIGN KEY ("score_id") REFERENCES "public"."scores"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "scores" ADD CONSTRAINT "scores_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "practice_segments" ADD CONSTRAINT "practice_segments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "practice_segments" ADD CONSTRAINT "practice_segments_score_version_id_score_versions_id_fk" FOREIGN KEY ("score_version_id") REFERENCES "public"."score_versions"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "attempt_skill_metrics" ADD CONSTRAINT "attempt_skill_metrics_attempt_id_practice_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."practice_attempts"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "attempt_skill_metrics" ADD CONSTRAINT "attempt_skill_metrics_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "user_score_library" ADD CONSTRAINT "user_score_library_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "user_score_library" ADD CONSTRAINT "user_score_library_score_id_scores_id_fk" FOREIGN KEY ("score_id") REFERENCES "public"."scores"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "learning_workspaces" ADD CONSTRAINT "learning_workspaces_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "account_owner_idx" ON "auth_accounts" USING btree ("user_id");

CREATE UNIQUE INDEX "account_provider_unique" ON "auth_accounts" USING btree ("provider_id","account_id");

CREATE INDEX "annotation_owner_score_idx" ON "annotations" USING btree ("user_id","score_version_id");

CREATE INDEX "assets_owner_idx" ON "assets" USING btree ("user_id");

CREATE INDEX "attempt_error_type_idx" ON "attempt_errors" USING btree ("attempt_id","type");

CREATE UNIQUE INDEX "lesson_version_unique" ON "lesson_versions" USING btree ("lesson_id","version");

CREATE UNIQUE INDEX "assignment_unique" ON "score_part_assignments" USING btree ("user_id","score_version_id","part");

CREATE INDEX "practice_owner_time_idx" ON "practice_sessions" USING btree ("user_id","created_at");

CREATE INDEX "schedule_owner_time_idx" ON "scheduled_sessions" USING btree ("user_id","scheduled_at");

CREATE UNIQUE INDEX "score_version_unique" ON "score_versions" USING btree ("score_id","version");

CREATE INDEX "session_owner_idx" ON "auth_sessions" USING btree ("user_id");

CREATE INDEX "verification_identifier_idx" ON "auth_verifications" USING btree ("identifier");
ALTER TABLE "auth_accounts" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL;

ALTER TABLE "auth_sessions" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL;

ALTER TABLE "auth_verifications" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL;

ALTER TABLE "learning_workspaces" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL;


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


ALTER TABLE "library_scores" ADD CONSTRAINT "library_scores_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "library_scores" ADD CONSTRAINT "library_scores_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

CREATE INDEX "library_scores_status_idx" ON "library_scores" USING btree ("status");
COMMIT;

SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
