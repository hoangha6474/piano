import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  bigint,
  jsonb,
  uuid,
  primaryKey,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
const id = () => uuid("id").defaultRandom().primaryKey();
const created = () =>
  timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
export const user = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: created(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
const owner = () =>
  text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" });
export const session = pgTable(
  "auth_sessions",
  {
    id: text("id").primaryKey(),
    userId: owner(),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: created(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
  },
  (t) => [index("session_owner_idx").on(t.userId)],
);
export const account = pgTable(
  "auth_accounts",
  {
    id: text("id").primaryKey(),
    userId: owner(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: created(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("account_owner_idx").on(t.userId),
    uniqueIndex("account_provider_unique").on(t.providerId, t.accountId),
  ],
);
export const verification = pgTable(
  "auth_verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: created(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);
export const rateLimit = pgTable("auth_rate_limits", {
  id: text("id").primaryKey(),
  key: text("key").unique().notNull(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});
export const profiles = pgTable("user_profiles", {
  userId: owner().primaryKey(),
  timezone: text("timezone").notNull().default("Asia/Ho_Chi_Minh"),
  level: text("level").notNull().default("Beginner"),
});
export const levels = pgTable("curriculum_levels", {
  id: id(),
  code: text("code").notNull().unique(),
  position: integer("position").notNull(),
});
export const chapters = pgTable("chapters", {
  id: id(),
  levelId: uuid("level_id")
    .notNull()
    .references(() => levels.id),
  title: text("title").notNull(),
  position: integer("position").notNull(),
});
export const lessons = pgTable("lessons", {
  id: id(),
  chapterId: uuid("chapter_id")
    .notNull()
    .references(() => chapters.id),
  title: text("title").notNull(),
  position: integer("position").notNull(),
});
export const lessonVersions = pgTable(
  "lesson_versions",
  {
    id: id(),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id),
    version: integer("version").notNull(),
    content: jsonb("content").notNull(),
    completion: jsonb("completion").notNull(),
  },
  (t) => [uniqueIndex("lesson_version_unique").on(t.lessonId, t.version)],
);
export const skills = pgTable("skills", {
  id: id(),
  code: text("code").unique().notNull(),
  title: text("title").notNull(),
});
export const exercises = pgTable("exercises", {
  id: id(),
  lessonVersionId: uuid("lesson_version_id").references(
    () => lessonVersions.id,
  ),
  kind: text("kind").notNull(),
  config: jsonb("config").notNull(),
  version: integer("version").default(1).notNull(),
});
export const exerciseSkills = pgTable(
  "exercise_skills",
  {
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercises.id),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id),
  },
  (t) => [primaryKey({ columns: [t.exerciseId, t.skillId] })],
);
export const assets = pgTable(
  "assets",
  {
    id: id(),
    userId: owner(),
    objectKey: text("object_key").unique().notNull(),
    mime: text("mime").notNull(),
    bytes: integer("bytes").notNull(),
    sha256: text("sha256").notNull(),
    status: text("status").default("ready").notNull(),
    createdAt: created(),
  },
  (t) => [
    index("assets_owner_idx").on(t.userId),
    check("asset_size_positive", sql`${t.bytes}>0`),
  ],
);
export const scores = pgTable("scores", {
  id: id(),
  ownerId: text("owner_id").references(() => user.id),
  title: text("title").notNull(),
  source: text("source").notNull(),
  license: text("license").notNull(),
});
export const scoreVersions = pgTable(
  "score_versions",
  {
    id: id(),
    scoreId: uuid("score_id")
      .notNull()
      .references(() => scores.id),
    version: integer("version").notNull(),
    status: text("status").notNull(),
    converter: text("converter"),
  },
  (t) => [uniqueIndex("score_version_unique").on(t.scoreId, t.version)],
);
export const scoreAssets = pgTable(
  "score_assets",
  {
    scoreVersionId: uuid("score_version_id")
      .notNull()
      .references(() => scoreVersions.id),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id),
    role: text("role").notNull(),
  },
  (t) => [primaryKey({ columns: [t.scoreVersionId, t.assetId, t.role] })],
);
export const lessonAssets = pgTable(
  "lesson_assets",
  {
    lessonVersionId: uuid("lesson_version_id")
      .notNull()
      .references(() => lessonVersions.id),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id),
  },
  (t) => [primaryKey({ columns: [t.lessonVersionId, t.assetId] })],
);
export const exerciseScores = pgTable(
  "exercise_scores",
  {
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercises.id),
    scoreVersionId: uuid("score_version_id")
      .notNull()
      .references(() => scoreVersions.id),
  },
  (t) => [primaryKey({ columns: [t.exerciseId, t.scoreVersionId] })],
);
export const userLibrary = pgTable(
  "user_score_library",
  {
    userId: owner(),
    scoreId: uuid("score_id")
      .notNull()
      .references(() => scores.id),
    masteredAt: timestamp("mastered_at", { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.scoreId] })],
);
export const partAssignments = pgTable(
  "score_part_assignments",
  {
    id: id(),
    userId: owner(),
    scoreVersionId: uuid("score_version_id")
      .notNull()
      .references(() => scoreVersions.id),
    part: text("part").notNull(),
    hand: text("hand").notNull(),
  },
  (t) => [
    uniqueIndex("assignment_unique").on(t.userId, t.scoreVersionId, t.part),
  ],
);
export const preferences = pgTable(
  "practice_preferences",
  {
    userId: owner(),
    scoreVersionId: uuid("score_version_id")
      .notNull()
      .references(() => scoreVersions.id),
    bpm: integer("bpm").notNull(),
    hand: text("hand").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.scoreVersionId] })],
);
export const segments = pgTable("practice_segments", {
  id: id(),
  userId: owner(),
  scoreVersionId: uuid("score_version_id")
    .notNull()
    .references(() => scoreVersions.id),
  start: jsonb("start").notNull(),
  end: jsonb("end").notNull(),
});
export const annotations = pgTable(
  "annotations",
  {
    id: id(),
    userId: owner(),
    scoreVersionId: uuid("score_version_id")
      .notNull()
      .references(() => scoreVersions.id),
    position: jsonb("position").notNull(),
    text: text("text"),
    color: text("color"),
    hand: text("hand"),
    segmentId: uuid("segment_id").references(() => segments.id),
  },
  (t) => [index("annotation_owner_score_idx").on(t.userId, t.scoreVersionId)],
);
export const fingerings = pgTable(
  "fingering_overrides",
  {
    userId: owner(),
    scoreVersionId: uuid("score_version_id")
      .notNull()
      .references(() => scoreVersions.id),
    noteRef: text("note_ref").notNull(),
    hand: text("hand").notNull(),
    finger: integer("finger").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.scoreVersionId, t.noteRef, t.hand] }),
    check("finger_range", sql`${t.finger} between 1 and 5`),
  ],
);
export const practiceSessions = pgTable(
  "practice_sessions",
  {
    id: id(),
    userId: owner(),
    startedAt: created(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    activeSeconds: integer("active_seconds").notNull(),
    status: text("status").notNull(),
  },
  (t) => [index("practice_owner_time_idx").on(t.userId, t.startedAt)],
);
export const attempts = pgTable("practice_attempts", {
  id: id(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => practiceSessions.id),
  exerciseId: uuid("exercise_id").references(() => exercises.id),
  scoreVersionId: uuid("score_version_id").references(() => scoreVersions.id),
  segmentId: uuid("segment_id").references(() => segments.id),
  number: integer("number").notNull(),
  mode: text("mode").notNull(),
  tempo: jsonb("tempo").notNull(),
  idempotencyKey: text("idempotency_key").unique().notNull(),
});
export const policies = pgTable("evaluation_policies", {
  id: id(),
  version: text("version").unique().notNull(),
  config: jsonb("config").notNull(),
  approved: boolean("approved").default(false).notNull(),
});
export const results = pgTable("attempt_results", {
  attemptId: uuid("attempt_id")
    .primaryKey()
    .references(() => attempts.id),
  policyId: uuid("policy_id")
    .notNull()
    .references(() => policies.id),
  metrics: jsonb("metrics").notNull(),
  score: integer("score"),
  incomplete: boolean("incomplete").notNull(),
});
export const errors = pgTable(
  "attempt_errors",
  {
    id: id(),
    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => attempts.id),
    type: text("type").notNull(),
    detail: jsonb("detail").notNull(),
  },
  (t) => [index("attempt_error_type_idx").on(t.attemptId, t.type)],
);
export const skillMetrics = pgTable(
  "attempt_skill_metrics",
  {
    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => attempts.id),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id),
    hand: text("hand").notNull(),
    metrics: jsonb("metrics").notNull(),
  },
  (t) => [primaryKey({ columns: [t.attemptId, t.skillId, t.hand] })],
);
export const responses = pgTable("exercise_responses", {
  id: id(),
  attemptId: uuid("attempt_id")
    .notNull()
    .references(() => attempts.id),
  position: integer("position").notNull(),
  question: jsonb("question").notNull(),
  answer: jsonb("answer").notNull(),
  correct: boolean("correct").notNull(),
});
export const progress = pgTable(
  "lesson_progress",
  {
    userId: owner(),
    lessonVersionId: uuid("lesson_version_id")
      .notNull()
      .references(() => lessonVersions.id),
    status: text("status").notNull(),
    position: jsonb("position"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.lessonVersionId] })],
);
export const plans = pgTable("practice_plans", {
  id: id(),
  userId: owner(),
  timezone: text("timezone").notNull(),
  localTime: text("local_time").notNull(),
  recurrence: jsonb("recurrence").notNull(),
  status: text("status").notNull(),
});
export const planItems = pgTable("plan_items", {
  id: id(),
  planId: uuid("plan_id")
    .notNull()
    .references(() => plans.id),
  lessonId: uuid("lesson_id").references(() => lessons.id),
  exerciseId: uuid("exercise_id").references(() => exercises.id),
  scoreId: uuid("score_id").references(() => scores.id),
});
export const scheduledSessions = pgTable(
  "scheduled_sessions",
  {
    id: id(),
    userId: owner(),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    status: text("status").notNull(),
  },
  (t) => [index("schedule_owner_time_idx").on(t.userId, t.scheduledAt)],
);
export const scheduledPractice = pgTable(
  "scheduled_session_practice",
  {
    scheduledSessionId: uuid("scheduled_session_id")
      .notNull()
      .references(() => scheduledSessions.id),
    practiceSessionId: uuid("practice_session_id")
      .notNull()
      .references(() => practiceSessions.id),
  },
  (t) => [primaryKey({ columns: [t.scheduledSessionId, t.practiceSessionId] })],
);
export const goals = pgTable("personal_goals", {
  id: id(),
  userId: owner(),
  kind: text("kind").notNull(),
  target: integer("target").notNull(),
  dueAt: timestamp("due_at", { withTimezone: true }),
  skillId: uuid("skill_id").references(() => skills.id),
  lessonId: uuid("lesson_id").references(() => lessons.id),
  scoreId: uuid("score_id").references(() => scores.id),
});
// Versioned recovery/synchronization snapshot; normalized tables remain the domain schema.
export const workspaces = pgTable("learning_workspaces", {
  userId: owner().primaryKey(),
  revision: integer("revision").default(1).notNull(),
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
export const aiUsage = pgTable(
  "ai_usage",
  {
    userId: owner(),
    day: text("day").notNull(),
    count: integer("count").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.day] })],
);
