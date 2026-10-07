import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const rooms=sqliteTable('rooms',{
 code:text('code').primaryKey(), hostHash:text('host_hash').notNull(), guestHash:text('guest_hash'),
 created:integer('created').notNull(), expires:integer('expires').notNull(), hostSeen:integer('host_seen').notNull(), guestSeen:integer('guest_seen').notNull().default(0),
 hostSeq:integer('host_seq').notNull().default(0), guestSeq:integer('guest_seq').notNull().default(0),
 snapshot:text('snapshot').notNull(), input:text('input').notNull().default('{}'), guestForm:text('guest_form'), closed:integer('closed').notNull().default(0)
});
export const progress=sqliteTable('progress',{
 id:text('id').primaryKey(),tokenHash:text('token_hash').notNull(),revision:integer('revision').notNull(),snapshot:text('snapshot').notNull(),updated:integer('updated').notNull()
});
