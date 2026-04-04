import {
  boolean,
  check,
  index,
  pgEnum,
  pgTable,
  relations,
  sql,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "../core";
import { billingRecords } from "./billing-records";
import { plans } from "./plans";
import { users } from "./users";

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "pending",
  "active",
  "expired",
  "cancelled",
  "paused",
]);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "restrict" }),
    status: subscriptionStatusEnum("status").notNull().default("pending"),
    autoRenew: boolean("auto_renew").notNull().default(false),
    externalSubscriptionId: varchar("external_subscription_id", {
      length: 255,
    }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdx: index("subscriptions_user_idx").on(table.userId),
    planIdx: index("subscriptions_plan_idx").on(table.planId),
    statusIdx: index("subscriptions_status_idx").on(table.status),
    externalSubscriptionIdx: uniqueIndex(
      "subscriptions_external_subscription_uidx",
    ).on(table.externalSubscriptionId),

    periodCheck: check(
      "subscriptions_period_chk",
      sql`(${table.endsAt} is null or ${table.endsAt} > ${table.startsAt})`,
    ),
  }),
);

export const subscriptionsRelations = relations(
  subscriptions,
  ({ one, many }) => ({
    user: one(users, {
      fields: [subscriptions.userId],
      references: [users.id],
    }),
    plan: one(plans, {
      fields: [subscriptions.planId],
      references: [plans.id],
    }),
    billingRecords: many(billingRecords),
  }),
);
