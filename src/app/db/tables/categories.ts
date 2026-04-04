import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  relations,
  sql,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "../core";
import { users } from "./users";
import { listings } from "./listings";

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: varchar("name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 140 }).notNull(),
    description: text("description"),
    iconUrl: text("icon_url"),
    imageUrl: text("image_url"),

    parentId: uuid("parent_id").references(() => categories.id, {
      onDelete: "set null",
    }),

    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    isFeatured: boolean("is_featured").notNull().default(false),

    metadata: jsonb("metadata").$type<Record<string, unknown>>(),

    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
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
    slugIdx: uniqueIndex("categories_slug_uidx").on(table.slug),

    parentIdx: index("categories_parent_idx").on(table.parentId),
    activeIdx: index("categories_is_active_idx").on(table.isActive),
    sortIdx: index("categories_sort_order_idx").on(table.sortOrder),
    parentSortIdx: index("categories_parent_sort_idx").on(
      table.parentId,
      table.sortOrder,
    ),

    sortOrderCheck: check(
      "categories_sort_order_chk",
      sql`${table.sortOrder} >= 0`,
    ),

    selfParentCheck: check(
      "categories_self_parent_chk",
      sql`(${table.parentId} is null or ${table.parentId} <> ${table.id})`,
    ),
  }),
);

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "categoryParent",
  }),
  children: many(categories, {
    relationName: "categoryParent",
  }),
  listings: many(listings, {
    relationName: "listingCategory",
  }),

  createdByUser: one(users, {
    fields: [categories.createdBy],
    references: [users.id],
    relationName: "categoryCreator",
  }),
  updatedByUser: one(users, {
    fields: [categories.updatedBy],
    references: [users.id],
    relationName: "categoryUpdater",
  }),
}));
