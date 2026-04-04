import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  relations,
  text,
  timestamp,
  uuid,
  varchar,
} from "../core";
import { users } from "./users";

export const notificationTypeEnum = pgEnum("notification_type", [
  "verification",
  "message",
  "interaction",
  "listing",
  "payment",
  "admin",
  "system",
]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "in_app",
  "push",
  "email",
  "sms",
  "whatsapp",
]);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    channel: notificationChannelEnum("channel").notNull().default("in_app"),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body"),
    data: jsonb("data").$type<Record<string, unknown>>(),
    isRead: boolean("is_read").notNull().default(false),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdx: index("notifications_user_idx").on(table.userId),
    typeIdx: index("notifications_type_idx").on(table.type),
    readIdx: index("notifications_is_read_idx").on(table.isRead),
    userReadCreatedIdx: index("notifications_user_read_created_idx").on(
      table.userId,
      table.isRead,
      table.createdAt,
    ),
  }),
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));
