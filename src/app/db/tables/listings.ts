import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  relations,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "../core";
import type {
  ListingDetails,
  ListingLocation,
  ListingMediaItem,
} from "../types";
import { categories } from "./categories";
import { conversations } from "./conversation";
import { users } from "./users";

export const listingTypeEnum = pgEnum("listing_type", ["product", "service"]);

export const listingStatusEnum = pgEnum("listing_status", [
  "pending_review",
  "published",
  "rejected",
  "archived",
  "sold",
  "expired",
]);

export const listings = pgTable(
  "listings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sellerId: uuid("seller_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),

    type: listingTypeEnum("type").notNull().default("product"),
    ///servixe like transform, repair
    status: listingStatusEnum("status").notNull().default("pending_review"),

    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 280 }).notNull(),
    shortDescription: varchar("short_description", { length: 500 }),
    description: text("description").notNull(),

    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 10 }).notNull(),

    locationLabel: varchar("location_label", { length: 255 }),
    locationData: jsonb("location_data").$type<ListingLocation>(),

    coverImageUrl: text("cover_image_url"),
    media: jsonb("media").$type<ListingMediaItem[]>(),
    details: jsonb("details").$type<ListingDetails>(),

    isFeatured: boolean("is_featured").notNull().default(false),
    featuredUntil: timestamp("featured_until", { withTimezone: true }),
    isHighlighted: boolean("is_highlighted").notNull().default(false),
    highlightedUntil: timestamp("highlighted_until", { withTimezone: true }),
    watermarkApplied: boolean("watermark_applied").notNull().default(false),
    //Appealing for that regarding the logo of the corperate

    viewsCount: integer("views_count").notNull().default(0),
    savesCount: integer("saves_count").notNull().default(0),
    messagesCount: integer("messages_count").notNull().default(0),

    reviewedBy: uuid("reviewed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewNotes: text("review_notes"),

    publishedAt: timestamp("published_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("listings_slug_uidx").on(table.slug),
    sellerIdx: index("listings_seller_idx").on(table.sellerId),
    categoryIdx: index("listings_category_idx").on(table.categoryId),
    statusIdx: index("listings_status_idx").on(table.status),
    featuredIdx: index("listings_featured_idx").on(table.isFeatured),
    publishedIdx: index("listings_published_idx").on(table.publishedAt),
  }),
);

export const listingsRelations = relations(listings, ({ one ,many}) => ({
  category: one(categories, {
    fields: [listings.categoryId],
    references: [categories.id],
    relationName: "listingCategory",
  }),
  conversations: many(conversations),
}));
