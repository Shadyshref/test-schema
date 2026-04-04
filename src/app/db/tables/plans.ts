import {
  boolean,
  check,
  index,
  integer,
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
import { billingRecords } from "./billing-records";
import { subscriptions } from "./subscriptions";

export const planAudienceEnum = pgEnum("plan_audience", [
  "user",
  "individual_vendor",
  "corporate_vendor",
]);

export const billingCycleEnum = pgEnum("billing_cycle", [
  "monthly",
  "quarterly",
  "yearly",
]);

export const planTierEnum = pgEnum("plan_tier", [
  "free",
  "standard",

  "premium",
]);

// export const analyticsLevelEnum = pgEnum("analytics_level", [
//   "none",
//   "basic",
//   "advanced",
// ]);

export const supportLevelEnum = pgEnum("support_level", [
  "basic",
  "priority",
  "dedicated",
]);

export const plans = pgTable(
  "plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    audience: planAudienceEnum("audience").notNull(),
    tier: planTierEnum("tier").notNull().default("free"),
    code: varchar("code", { length: 50 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 10 }).notNull(),
    billingCycle: billingCycleEnum("billing_cycle")
      .notNull()
      .default("monthly"),
    listingLimit: integer("listing_limit"),
    featuredListingLimit: integer("featured_listing_limit"),
    listingDurationDays: integer("listing_duration_days"),
    // analyticsLevel: analyticsLevelEnum("analytics_level")
    //   .notNull()
    //   .default("none"),
    supportLevel: supportLevelEnum("support_level").notNull().default("basic"),
    includesCompanyPage: boolean("includes_company_page")
      .notNull()
      .default(false),
      ///Under discussion
    isDefault: boolean("is_default").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    features: jsonb("features").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    codeIdx: uniqueIndex("plans_code_uidx").on(table.code),
    audienceIdx: index("plans_audience_idx").on(table.audience),
    activeIdx: index("plans_is_active_idx").on(table.isActive),

    priceCheck: check("plans_price_chk", sql`${table.price} >= 0`),

    limitsCheck: check(
      "plans_limits_chk",
      sql`(
        (${table.listingLimit} is null or ${table.listingLimit} >= 0)
        and (${table.featuredListingLimit} is null or ${table.featuredListingLimit} >= 0)
        and (${table.highlightLimit} is null or ${table.highlightLimit} >= 0)
        and (${table.listingDurationDays} is null or ${table.listingDurationDays} >= 0)
      )`,
    ),
  }),
);

export const plansRelations = relations(plans, ({ many }) => ({
  subscriptions: many(subscriptions),
  billingRecords: many(billingRecords),
}));
