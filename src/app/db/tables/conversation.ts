import {
  boolean,
  check,
  index,
  jsonb,
  pgEnum,
  pgTable,
  relations,
  sql,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "../core";
import { listings } from "./listings";
import { users } from "./users";

export const messageTypeEnum = pgEnum("message_type", [
  "text",
  "image",
  "offer",
]);

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),

    buyerId: uuid("buyer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    sellerId: uuid("seller_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    listingBuyerUidx: uniqueIndex("conversations_listing_buyer_uidx").on(
      table.listingId,
      table.buyerId,
    ),

    buyerIdx: index("conversations_buyer_idx").on(table.buyerId),
    sellerIdx: index("conversations_seller_idx").on(table.sellerId),
    listingIdx: index("conversations_listing_idx").on(table.listingId),
    lastMessageIdx: index("conversations_last_message_idx").on(
      table.lastMessageAt,
    ),

    buyerSellerDifferentCheck: check(
      "conversations_buyer_seller_diff_chk",
      sql`${table.buyerId} <> ${table.sellerId}`,
    ),
  }),
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),

    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    type: messageTypeEnum("type").notNull().default("text"),

    content: text("content").notNull(),

    metadata: jsonb("metadata").$type<Record<string, unknown>>(),

    isRead: boolean("is_read").notNull().default(false),

    readAt: timestamp("read_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    conversationIdx: index("messages_conversation_idx").on(
      table.conversationId,
    ),
    senderIdx: index("messages_sender_idx").on(table.senderId),
    unreadIdx: index("messages_unread_idx").on(table.isRead),
    conversationCreatedIdx: index("messages_conversation_created_idx").on(
      table.conversationId,
      table.createdAt,
    ),

    readStateCheck: check(
      "messages_read_state_chk",
      sql`(
        (${table.isRead} = false and ${table.readAt} is null)
        or
        (${table.isRead} = true and ${table.readAt} is not null)
      )`,
    ),
  }),
);

export const conversationsRelations = relations(
  conversations,
  ({ one, many }) => ({
    listing: one(listings, {
      fields: [conversations.listingId],
      references: [listings.id],
    }),

    buyer: one(users, {
      fields: [conversations.buyerId],
      references: [users.id],
      relationName: "conversationBuyer",
    }),

    seller: one(users, {
      fields: [conversations.sellerId],
      references: [users.id],
      relationName: "conversationSeller",
    }),

    messages: many(messages),
  }),
);

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),

  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "messageSender",
  }),
}));
