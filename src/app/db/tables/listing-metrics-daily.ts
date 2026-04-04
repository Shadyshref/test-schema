import {
  check,
  date,
  index,
  integer,
  pgTable,
  relations,
  sql,
  timestamp,
  uniqueIndex,
  uuid,
} from "../core";
import { listings } from "./listings";

export const listingMetricsDaily = pgTable(
  "listing_metrics_daily",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    metricDate: date("metric_date").notNull(),
    viewsCount: integer("views_count").notNull().default(0),
    savesCount: integer("saves_count").notNull().default(0),
    messagesCount: integer("messages_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    listingDateIdx: uniqueIndex("listing_metrics_daily_uidx").on(table.listingId, table.metricDate),
    metricDateIdx: index("listing_metrics_daily_metric_date_idx").on(table.metricDate),

    nonNegativeMetricsCheck: check(
      "listing_metrics_daily_non_negative_chk",
      sql`(
        ${table.viewsCount} >= 0
        and ${table.savesCount} >= 0
        and ${table.messagesCount} >= 0
      )`
    ),
  })
);

export const listingMetricsDailyRelations = relations(listingMetricsDaily, ({ one }) => ({
  listing: one(listings, {
    fields: [listingMetricsDaily.listingId],
    references: [listings.id],
  }),
}));