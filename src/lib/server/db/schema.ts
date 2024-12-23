import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	age: integer('age'),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull()
});

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

export const video = sqliteTable('video', {
	id: text('id').primaryKey(),
	ownerId: text('owner_id')
		.notNull()
		.references(() => user.id),
	title: text('title').notNull(),
	description: text('description'),
	thumbnail: text('thumbnail'),
	sourceFilePath: text('source_file_path'),

	// Statut de la vidéo (ex: "pending", "transcoding", "ready", "error", etc.)
	status: text('status').notNull().default('pending'),

	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`)
});

export const videoFormat = sqliteTable('video_format', {
	id: text('id').primaryKey(),  // identifiant unique
	videoId: text('video_id')
		.notNull()
		.references(() => video.id),

	resolution: text('resolution').notNull(),
	filePath: text('file_path').notNull(),
	bitrate: real('bitrate'),

	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(CURRENT_TIMESTAMP)`)
});

export type Video = typeof video.$inferSelect;
export type NewVideo = typeof video.$inferInsert;

export type VideoFormat = typeof videoFormat.$inferSelect;
export type NewVideoFormat = typeof videoFormat.$inferInsert;

export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;
