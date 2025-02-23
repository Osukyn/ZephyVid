import { sqliteTable, text, integer, primaryKey, foreignKey } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';

// Table user
export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	username: text('username').notNull().unique(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	isAdmin: integer('is_admin').notNull().default(0),
	profileImage: text('profile_image')
});

export const usersRelations = relations(user, ({ many }) => ({
	// Relation 1-n : un user peut posséder plusieurs vidéos
	ownedVideos: many(video),
	// Relation n-n : un user peut avoir accès à plusieurs vidéos partagées
	videosToUsers: many(videosToUsers),
	// Relation n-n : un user peut être l'auteur de plusieurs invitations
	invitations: many(invitations),
	// Relation n-n : un user peut avoir utilisé plusieurs invitations
	invitationsToUsers: many(invitationsToUsers),
	// Relation 1-n : un user peut avoir fait plusieurs commentaires
	comments: many(comments),
	commentVotes: many(commentVotes),
	videoVotes: many(videoVotes),
}));

// Table session
export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

// Table video
export const video = sqliteTable('video', {
	id: text('id').primaryKey(),
	// L’owner d’une vidéo (relation 1-n vers users)
	ownerId: text('owner_id').notNull().references(() => user.id, { onDelete: 'cascade' }),

	title: text('title').notNull(),
	description: text('description'),
	thumbnail: text('thumbnail'),
	sourceFilePath: text('source_file_path'),
	status: text('status').notNull().default('pending'),
	viewCount: integer('view_count').notNull().default(0),

	// Visibilité, ex: private, unlisted, friends, etc.
	visibility: text('visibility').notNull().default('private'),
	// Nouveau champ pour autoriser le téléchargement de la vidéo
	allowDownloads: integer('allow_downloads', { mode: 'boolean' }).notNull().default(false),

	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`)
});

// Relations "videos"
export const videosRelations = relations(video, ({ one, many }) => ({
	// Relation 1-n : le owner de la vidéo
	owner: one(user, {
		fields: [video.ownerId],
		references: [user.id],
	}),
	// Relation n-n : liste des associations « vidéo partagée »
	videosToUsers: many(videosToUsers),
	// Relation 1-n : une vidéo peut avoir plusieurs commentaires
	comments: many(comments),
	videoVotes: many(videoVotes),
}));

// -------------------------
// 3) Table videosToUsers (table de jonction)
// -------------------------
export const videosToUsers = sqliteTable(
	'videos_to_users',
	{
		videoId: text('video_id')
			.notNull()
			.references(() => video.id, {
				onDelete: 'cascade', // si la vidéo est supprimée, on supprime l’association
			}),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, {
				onDelete: 'cascade', // si l’utilisateur est supprimé, on supprime l’association
			}),
		accessLevel: integer('access_level').notNull().default(0),
	},
	// Clé primaire composite
	(table) => {
		return {
			pk: primaryKey({
				columns: [
					table.videoId, table.userId
				]
			})
		}
	}
);

export const videosToUsersRelations = relations(videosToUsers, ({ one }) => ({
	// Relation vers la vidéo
	video: one(video, {
		fields: [videosToUsers.videoId],
		references: [video.id],
	}),
	// Relation vers l’utilisateur
	user: one(user, {
		fields: [videosToUsers.userId],
		references: [user.id],
	}),
}));

/* ------------------------------------------------------------------
   4) Table invitations
   -> on stocke le code, le nb max d'utilisations, etc.
 ------------------------------------------------------------------ */
export const invitations = sqliteTable('invitations', {
	id: text('id').primaryKey(),
	code: text('code').notNull().unique(),

	// L’utilisateur qui a créé l’invitation
	createdByUserId: text('created_by_user_id')
		.notNull()
		.references(() => user.id, {
			onDelete: 'cascade',
		}),

	maxUses: integer('max_uses').notNull().default(1),
	usageCount: integer('usage_count').notNull().default(0),

	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`),

	expiresAt: integer('expires_at', { mode: 'timestamp' }),
});

// Relations "invitations"
export const invitationsRelations = relations(invitations, ({ one, many }) => ({
	// L'user qui a créé l’invitation
	createdBy: one(user, {
		fields: [invitations.createdByUserId],
		references: [user.id],
	}),
	// Lien n-n avec "invitationsToUsers" pour enregistrer qui l'a utilisée
	invitationsToUsers: many(invitationsToUsers),
}));


/* ------------------------------------------------------------------
   5) Table de jonction Many-to-Many pour savoir
      QUI a utilisé CHAQUE invitation
 ------------------------------------------------------------------ */
export const invitationsToUsers = sqliteTable(
	'invitations_to_users',
	{
		invitationId: text('invitation_id')
			.notNull()
			.references(() => invitations.id, {
				onDelete: 'cascade',
			}),
		usedByUserId: text('used_by_user_id')
			.notNull()
			.references(() => user.id, {
				onDelete: 'cascade',
			}),
	},
	(table) => {
		return {
			pk: primaryKey({
				columns: [table.invitationId, table.usedByUserId]
			})
		}
	}
);

// Relations "invitationsToUsers"
export const invitationsToUsersRelations = relations(invitationsToUsers, ({ one }) => ({
	invitation: one(invitations, {
		fields: [invitationsToUsers.invitationId],
		references: [invitations.id],
	}),
	usedBy: one(user, {
		fields: [invitationsToUsers.usedByUserId],
		references: [user.id],
	}),
}));

/* ------------------------------------------------------------------
   6) Table comments
 ------------------------------------------------------------------ */
export const comments = sqliteTable('comments', {
	id: text('id').primaryKey(),

	// Lien vers la vidéo commentée
	videoId: text('video_id')
		.notNull()
		.references(() => video.id, { onDelete: 'cascade' }),

	// L’utilisateur qui poste le commentaire
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	// Commentaire parent => s'il est NULL => commentaire top-level
	// S'il est renseigné => c'est une réponse
	parentCommentId: text('parent_comment_id'),
	content: text('content').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`),

	// Timestamp de dernière modification
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`),
}, (table) => {
	return {
		parentReference: foreignKey({
			columns: [table.parentCommentId],
			foreignColumns: [table.id],
			name: 'fk_parent_comment_id',
		})
	}
});

export const commentsRelations = relations(comments, ({ one, many }) => ({
	video: one(video, {
		fields: [comments.videoId],
		references: [video.id],
	}),
	user: one(user, {
		fields: [comments.userId],
		references: [user.id],
	}),
	// Relation vers le commentaire parent
	parentComment: one(comments, {
		fields: [comments.parentCommentId],
		references: [comments.id],
	}),
	// Relation vers d’éventuelles réponses (1-n)
	replies: many(comments),
	commentVotes: many(commentVotes),
}));

/* ------------------------------------------------------------------
   7) Table commentVotes
   -> Gère les likes / dislikes sur commentaires
   -> value = 1 (like) ou -1 (dislike)
 ------------------------------------------------------------------ */
export const commentVotes = sqliteTable(
	'comment_votes',
	{
		commentId: text('comment_id')
			.notNull()
			.references(() => comments.id, { onDelete: 'cascade' }),

		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),

		value: integer('value')
			.notNull()
			.default(0), // 1 = like, -1 = dislike, etc.

	},
	(table) => {
		return {
			pk: primaryKey({
				columns: [table.commentId, table.userId]
			}),
		}
	}
);

export const commentVotesRelations = relations(commentVotes, ({ one }) => ({
	comment: one(comments, {
		fields: [commentVotes.commentId],
		references: [comments.id],
	}),
	user: one(user, {
		fields: [commentVotes.userId],
		references: [user.id],
	}),
}));

/* ------------------------------------------------------------------
   8) Table videoVotes
   -> Gère les likes / dislikes sur vidéos
   -> value = 1 (like) ou -1 (dislike)
 ------------------------------------------------------------------ */
export const videoVotes = sqliteTable(
	'video_votes',
	{
		videoId: text('video_id')
			.notNull()
			.references(() => video.id, { onDelete: 'cascade' }),

		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),

		value: integer('value')
			.notNull()
			.default(0), // 1 = like, -1 = dislike
	},
	(table) => {
		return {
			pk: primaryKey({
				columns: [table.videoId, table.userId]
			}),
		}
	}
);

export const videoVotesRelations = relations(videoVotes, ({ one }) => ({
	video: one(video, {
		fields: [videoVotes.videoId],
		references: [video.id],
	}),
	user: one(user, {
		fields: [videoVotes.userId],
		references: [user.id],
	}),
}));

/* ------------------------------------------------------------------
   9) Nouvelle table : video_watch_sessions
   -> Enregistre pour chaque session de visionnage :
      - la vidéo visionnée,
      - l'utilisateur (si applicable),
      - et la durée de visionnage (en secondes)
 ------------------------------------------------------------------ */
export const videoWatchSessions = sqliteTable('video_watch_sessions', {
	id: text('id').primaryKey(),
	videoId: text('video_id')
		.notNull()
		.references(() => video.id, { onDelete: 'cascade' }),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	watchDuration: integer('watch_duration').notNull().default(0),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`),
});

export const videoWatchSessionsRelations = relations(videoWatchSessions, ({ one }) => ({
	video: one(video, {
		fields: [videoWatchSessions.videoId],
		references: [video.id],
	}),
	user: one(user, {
		fields: [videoWatchSessions.userId],
		references: [user.id],
	}),
}));

/* ------------------------------------------------------------------
   10) Types TypeScript
 ------------------------------------------------------------------ */
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

export type Video = typeof video.$inferSelect;
export type NewVideo = typeof video.$inferInsert;

export type VideosToUsers = typeof videosToUsers.$inferSelect;
export type NewVideosToUsers = typeof videosToUsers.$inferInsert;

export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;

export type InvitationsToUsers = typeof invitationsToUsers.$inferSelect;
export type NewInvitationsToUsers = typeof invitationsToUsers.$inferInsert;

export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;

export type CommentVote = typeof commentVotes.$inferSelect;
export type NewCommentVote = typeof commentVotes.$inferInsert;

export type VideoVote = typeof videoVotes.$inferSelect;
export type NewVideoVote = typeof videoVotes.$inferInsert;

export type VideoWatchSession = typeof videoWatchSessions.$inferSelect;
export type NewVideoWatchSession = typeof videoWatchSessions.$inferInsert;
