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
import { listings } from "./listings";
import { plans } from "./plans";
import { subscriptions } from "./subscriptions";
import { users } from "./users";

export const billingRecordTypeEnum = pgEnum("billing_record_type", [
  "subscription",
  "listing_feature",
  "listing_highlight",
  "wallet_topup",
  "wallet_adjustment",
  "paid_service",
  "refund",
]);

export const billingStatusEnum = pgEnum("billing_status", [
  "pending",
  "paid",
  "failed",
  "cancelled",
  "refunded",
]);

export const invoiceTypeEnum = pgEnum("invoice_type", ["tax", "proforma", "service"]);

export const billingRecords = pgTable(
  "billing_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planId: uuid("plan_id").references(() => plans.id, { onDelete: "set null" }),
    subscriptionId: uuid("subscription_id").references(() => subscriptions.id, {
      onDelete: "set null",
    }),
    listingId: uuid("listing_id").references(() => listings.id, { onDelete: "set null" }),

    recordType: billingRecordTypeEnum("record_type").notNull(),
    status: billingStatusEnum("status").notNull().default("pending"),
    invoiceType: invoiceTypeEnum("invoice_type"),

    invoiceNumber: varchar("invoice_number", { length: 50 }),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    // قبل الضريبة
    taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    // قيمة الضريبة
    totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
    // مبلغ نهائى بعد الضريبة 
    walletDelta: numeric("wallet_delta", { precision: 12, scale: 2 }).notNull().default("0"),
    currency: varchar("currency", { length: 10 }).notNull(),

    paymentGateway: varchar("payment_gateway", { length: 100 }),
    gatewayReference: varchar("gateway_reference", { length: 255 }),
    externalInvoiceId: varchar("external_invoice_id", { length: 255 }),
    externalSystem: varchar("external_system", { length: 100 }),
    invoicePdfUrl: text("invoice_pdf_url"),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),

    issuedAt: timestamp("issued_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    syncedAt: timestamp("synced_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    invoiceNumberIdx: uniqueIndex("billing_records_invoice_number_uidx").on(table.invoiceNumber),
    gatewayReferenceIdx: uniqueIndex("billing_records_gateway_reference_uidx").on(
      table.gatewayReference
    ),
    userIdx: index("billing_records_user_idx").on(table.userId),
    statusIdx: index("billing_records_status_idx").on(table.status),
    typeIdx: index("billing_records_type_idx").on(table.recordType),

    amountMathCheck: check(
      "billing_records_amount_math_chk",
      sql`${table.totalAmount} = ${table.amount} + ${table.taxAmount}`
    ),

    paidStatusCheck: check(
      "billing_records_paid_status_chk",
      sql`(${table.status} <> 'paid' or ${table.paidAt} is not null)`
    ),

    subscriptionRefCheck: check(
      "billing_records_subscription_ref_chk",
      sql`(
        ${table.recordType} <> 'subscription'
        or
        ${table.subscriptionId} is not null
      )`
    ),

    listingRefCheck: check(
      "billing_records_listing_ref_chk",
      sql`(
        ${table.recordType} not in ('listing_feature', 'listing_highlight')
        or
        ${table.listingId} is not null
      )`
    ),
  })
);

export const billingRecordsRelations = relations(billingRecords, ({ one }) => ({
  user: one(users, {
    fields: [billingRecords.userId],
    references: [users.id],
  }),
  plan: one(plans, {
    fields: [billingRecords.planId],
    references: [plans.id],
  }),
  subscription: one(subscriptions, {
    fields: [billingRecords.subscriptionId],
    references: [subscriptions.id],
  }),
  listing: one(listings, {
    fields: [billingRecords.listingId],
    references: [listings.id],
  }),
}));