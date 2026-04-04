import {
  check,
  index,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  relations,
  sql,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "../core";
import type {
  AdminPermission,
  CompanyBranch,
  NotificationPreferences,
} from "../types";
import { billingRecords } from "./billing-records";
import { favorites } from "./favorites";
import { listings } from "./listings";
import { moderationCases } from "./moderation-cases";
import { notifications } from "./notifications";
import { otpRequests } from "./otp-requests";
import { platformSettings } from "../../platform-settings";
import { categories } from "./categories";
import { subscriptions } from "./subscriptions";
import { userSettings } from "./user-settings";
import { conversations } from "./conversation";
import { messages } from "./conversation";
export const accountTypeEnum = pgEnum("account_type", [
  "user",
  "individual_vendor",
  "corporate_vendor",
  "admin",
  "super_admin",
]);

export const authMethodEnum = pgEnum("auth_method", ["password", "social"]);

export const socialProviderEnum = pgEnum("social_provider", [
  "google",
  "facebook",
  "apple",
]);

export const userStatusEnum = pgEnum("user_status", [
  "pending",
  "active",
  "blocked",
  "rejected",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountType: accountTypeEnum("account_type").notNull(),
    status: userStatusEnum("status").notNull(),
    authMethod: authMethodEnum("auth_method").notNull(),

    fullName: varchar("full_name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 17 }).notNull(),
    passwordHash: text("password_hash"),

    socialProvider: socialProviderEnum("social_provider"),
    socialProviderAccountId: varchar("social_provider_account_id", {
      length: 255,
    }),

    avatarUrl: text("avatar_url"),
    bio: text("bio"),

    companyName: varchar("company_name", { length: 255 }),
    companyLogoUrl: text("company_logo_url"),
    companySummary: text("company_summary"),
    yearsInBusiness: varchar("years_in_business", { length: 100 }),
    companyBranches: jsonb("company_branches").$type<CompanyBranch[]>(),
    contactEmail: varchar("contact_email", { length: 255 }),
    contactPhone: varchar("contact_phone", { length: 50 }),
    address: text("address"),
    instagramUrl: text("instagram_url"),
    linkedInUrl: text("linkedin_url"),

    walletBalance: numeric("wallet_balance", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),

    notificationPreferences: jsonb(
      "notification_preferences",
    ).$type<NotificationPreferences>(),
    adminPermissions: jsonb("admin_permissions").$type<AdminPermission[]>(),

    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),

    approvedBy: uuid("approved_by").references(() => users.id, {
      onDelete: "set null",
    }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),

    rejectedBy: uuid("rejected_by").references(() => users.id, {
      onDelete: "set null",
    }),
    rejectedAt: timestamp("rejected_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_uidx").on(table.email),
    socialIdentityIdx: uniqueIndex("users_social_identity_uidx").on(
      table.socialProvider,
      table.socialProviderAccountId,
    ),
    accountTypeIdx: index("users_account_type_idx").on(table.accountType),
    statusIdx: index("users_status_idx").on(table.status),
    authMethodIdx: index("users_auth_method_idx").on(table.authMethod),

    authPayloadCheck: check(
      "users_auth_payload_chk",
      sql`(
        (${table.authMethod} = 'social'
          and ${table.socialProvider} is not null
          and ${table.socialProviderAccountId} is not null)
        or
        (${table.authMethod} = 'password'
          and ${table.passwordHash} is not null)
      )`,
    ),

    userFlowCheck: check(
      "users_user_flow_chk",
      sql`(
        ${table.accountType} <> 'user'
        or
        (${table.authMethod} = 'social'
          and ${table.status} in ('active', 'blocked'))
      )`,
    ),

    vendorFlowCheck: check(
      "users_vendor_flow_chk",
      sql`(
        ${table.accountType} not in ('individual_vendor', 'corporate_vendor')
        or
        ${table.status} in ('pending', 'active', 'blocked', 'rejected')
      )`,
    ),

    corporateProfileCheck: check(
      "users_corporate_profile_chk",
      sql`(
        ${table.accountType} <> 'corporate_vendor'
        or
        ${table.companyName} is not null
      )`,
    ),

    adminPermissionsCheck: check(
      "users_admin_permissions_chk",
      sql`(
        ${table.accountType} in ('admin', 'super_admin')
        or
        ${table.adminPermissions} is null
      )`,
    ),
  }),
);

export const usersRelations = relations(users, ({ one, many }) => ({
  approvedByUser: one(users, {
    fields: [users.approvedBy],
    references: [users.id],
    relationName: "userApprover",
  }),
  rejectedByUser: one(users, {
    fields: [users.rejectedBy],
    references: [users.id],
    relationName: "userRejector",
  }),

  settings: one(userSettings, {
    relationName: "userSettings",
  }),

  approvedUsers: many(users, { relationName: "userApprover" }),
  rejectedUsers: many(users, { relationName: "userRejector" }),
  otpRequests: many(otpRequests),
  listings: many(listings, { relationName: "listingSeller" }),
  reviewedListings: many(listings, { relationName: "listingReviewer" }),
  favorites: many(favorites),
  subscriptions: many(subscriptions),
  billingRecords: many(billingRecords),
  createdModerationCases: many(moderationCases, {
    relationName: "moderationCreator",
  }),
  assignedModerationCases: many(moderationCases, {
    relationName: "moderationAssignee",
  }),
  resolvedModerationCases: many(moderationCases, {
    relationName: "moderationResolver",
  }),
  targetedModerationCases: many(moderationCases, {
    relationName: "moderationTargetUser",
  }),
  notifications: many(notifications),
  updatedPlatformSettings: many(platformSettings),
  buyerConversations: many(conversations, {
    relationName: "conversationBuyer",
  }),
  sellerConversations: many(conversations, {
    relationName: "conversationSeller",
  }),
  sentMessages: many(messages, {
    relationName: "messageSender",
  }),

  createdCategories: many(categories, {
    relationName: "categoryCreator",
  }),
  updatedCategories: many(categories, {
    relationName: "categoryUpdater",
  }),
}));
