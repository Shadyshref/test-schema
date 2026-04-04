import {
  check,
  index,
  pgEnum,
  pgTable,
  relations,
  sql,
  timestamp,
  uuid,
  varchar,
} from "../core";
import { users } from "./users";

export const otpPurposeEnum = pgEnum("otp_purpose", ["password_reset"]);

export const otpChannelEnum = pgEnum("otp_channel", ["whatsapp", "sms"]);

export const otpRequestStatusEnum = pgEnum("otp_request_status", [
  "pending",
  "verified",
  "expired",
  "consumed",
  "failed",
]);

export const otpRequests = pgTable(
  "otp_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    purpose: otpPurposeEnum("purpose").notNull(),
    channel: otpChannelEnum("channel").notNull(),
    status: otpRequestStatusEnum("status").notNull().default("pending"),
    destination: varchar("destination", { length: 255 }).notNull(),
    otpHash: varchar("otp_hash", { length: 255 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("otp_requests_user_idx").on(table.userId),
    purposeStatusIdx: index("otp_requests_purpose_status_idx").on(table.purpose, table.status),
    destinationIdx: index("otp_requests_destination_idx").on(table.destination),
    expiresIdx: index("otp_requests_expires_idx").on(table.expiresAt),

    otpStateCheck: check(
      "otp_requests_state_chk",
      sql`(
        (${table.status} = 'pending' and ${table.verifiedAt} is null and ${table.consumedAt} is null)
        or
        (${table.status} = 'verified' and ${table.verifiedAt} is not null and ${table.consumedAt} is null)
        or
        (${table.status} = 'consumed' and ${table.verifiedAt} is not null and ${table.consumedAt} is not null)
        or
        (${table.status} in ('expired', 'failed') and ${table.verifiedAt} is null and ${table.consumedAt} is null)
      )`
    ),
  })
);

export const otpRequestsRelations = relations(otpRequests, ({ one }) => ({
  user: one(users, {
    fields: [otpRequests.userId],
    references: [users.id],
  }),
}));