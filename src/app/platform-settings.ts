import {
  boolean,
  jsonb,
  pgEnum,
  pgTable,
  relations,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "./db/core";
import { users } from "./db/tables/users";

export const settingScopeEnum = pgEnum("setting_scope", [
  "branding",
  "domain",
  "categories",
  "plans",
  "payments",
  "notifications",
  "seo",
  "system",
]);

export const platformSettings = pgTable(
  "platform_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: varchar("key", { length: 100 }).notNull(),
    scope: settingScopeEnum("scope").notNull().default("system"),
    value: jsonb("value").$type<Record<string, unknown>>().notNull(),
    description: text("description"),
    isPublic: boolean("is_public").notNull().default(false),
    updatedBy: uuid("updated_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    scopeKeyIdx: uniqueIndex("platform_settings_scope_key_uidx").on(
      table.scope,
      table.key,
    ),
  }),
);

export const platformSettingsRelations = relations(
  platformSettings,
  ({ one }) => ({
    updatedByUser: one(users, {
      fields: [platformSettings.updatedBy],
      references: [users.id],
    }),
  }),
);
