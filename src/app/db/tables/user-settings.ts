import { boolean, pgTable, relations, timestamp, uuid, varchar } from "../core";
import { users } from "./users";

export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),

  language: varchar("language", { length: 10 }).notNull().default("ar"),

  inAppNotificationsEnabled: boolean("in_app_notifications_enabled")
    .notNull()
    .default(true),
  pushNotificationsEnabled: boolean("push_notifications_enabled")
    .notNull()
    .default(true),
  emailNotificationsEnabled: boolean("email_notifications_enabled")
    .notNull()
    .default(true),
  smsNotificationsEnabled: boolean("sms_notifications_enabled")
    .notNull()
    .default(false),
  whatsappNotificationsEnabled: boolean("whatsapp_notifications_enabled")
    .notNull()
    .default(false),

  messageNotificationsEnabled: boolean("message_notifications_enabled")
    .notNull()
    .default(true),
  paymentNotificationsEnabled: boolean("payment_notifications_enabled")
    .notNull()
    .default(true),
  systemNotificationsEnabled: boolean("system_notifications_enabled")
    .notNull()
    .default(true),
  listingNotificationsEnabled: boolean("listing_notifications_enabled")
    .notNull()
    .default(true),
  adminNotificationsEnabled: boolean("admin_notifications_enabled")
    .notNull()
    .default(true),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
    relationName: "userSettings",
  }),
}));
