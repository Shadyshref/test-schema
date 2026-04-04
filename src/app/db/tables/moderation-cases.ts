import {
  check,
  index,
  jsonb,
  pgEnum,
  pgTable,
  relations,
  sql,
  text,
  timestamp,
  uuid,
  varchar,
} from "../core";
import { listings } from "./listings";
import { users } from "./users";

export const moderationCaseTypeEnum = pgEnum("moderation_case_type", [
  "listing_review",
  "abuse_report",
  "warning",
  "account_action",
]);

export const moderationTargetTypeEnum = pgEnum("moderation_target_type", [
  "user",
  "listing",
  "system",
]);

export const moderationCaseStatusEnum = pgEnum("moderation_case_status", [
  "open",
  "under_review",
  "resolved",
  "dismissed",
  "escalated",
]);

export const moderationPriorityEnum = pgEnum("moderation_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const moderationDecisionEnum = pgEnum("moderation_decision", [
  "pending",
  "approved",
  "rejected",
  "warned",
  "suspended",
  "blocked",
  "dismissed",
]);

export const moderationCases = pgTable(
  "moderation_cases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    caseType: moderationCaseTypeEnum("case_type").notNull(),
    targetType: moderationTargetTypeEnum("target_type").notNull(),
    status: moderationCaseStatusEnum("status").notNull().default("open"),
    priority: moderationPriorityEnum("priority").notNull().default("medium"),
    decision: moderationDecisionEnum("decision").notNull().default("pending"),

    createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
    assignedAdminId: uuid("assigned_admin_id").references(() => users.id, { onDelete: "set null" }),
    resolvedByUserId: uuid("resolved_by_user_id").references(() => users.id, { onDelete: "set null" }),
    targetUserId: uuid("target_user_id").references(() => users.id, { onDelete: "set null" }),
    targetListingId: uuid("target_listing_id").references(() => listings.id, { onDelete: "set null" }),

    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    evidence: jsonb("evidence").$type<Record<string, unknown>>(),
    ///evidance will be have loka a screenshots,links
    resolutionNote: text("resolution_note"),

    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    statusIdx: index("moderation_cases_status_idx").on(table.status),
    caseTypeIdx: index("moderation_cases_type_idx").on(table.caseType),
    assignedIdx: index("moderation_cases_assigned_idx").on(table.assignedAdminId),
    targetUserIdx: index("moderation_cases_target_user_idx").on(table.targetUserId),
    targetListingIdx: index("moderation_cases_target_listing_idx").on(table.targetListingId),

    targetConsistencyCheck: check(
      "moderation_cases_target_consistency_chk",
      sql`(
        (${table.targetType} = 'user'
          and ${table.targetUserId} is not null
          and ${table.targetListingId} is null)
        or
        (${table.targetType} = 'listing'
          and ${table.targetListingId} is not null
          and ${table.targetUserId} is null)
        or
        (${table.targetType} = 'system'
          and ${table.targetUserId} is null
          and ${table.targetListingId} is null)
      )`
    ),

    resolvedStateCheck: check(
      "moderation_cases_resolved_state_chk",
      sql`(
        ${table.status} not in ('resolved', 'dismissed')
        or
        ${table.resolvedAt} is not null
      )`
    ),
  })
);

export const moderationCasesRelations = relations(moderationCases, ({ one }) => ({
  createdByUser: one(users, {
    fields: [moderationCases.createdByUserId],
    references: [users.id],
    relationName: "moderationCreator",
  }),
  assignedAdmin: one(users, {
    fields: [moderationCases.assignedAdminId],
    references: [users.id],
    relationName: "moderationAssignee",
  }),
  resolvedByUser: one(users, {
    fields: [moderationCases.resolvedByUserId],
    references: [users.id],
    relationName: "moderationResolver",
  }),
  targetUser: one(users, {
    fields: [moderationCases.targetUserId],
    references: [users.id],
    relationName: "moderationTargetUser",
  }),
  targetListing: one(listings, {
    fields: [moderationCases.targetListingId],
    references: [listings.id],
    relationName: "moderationTargetListing",
  }),
}));