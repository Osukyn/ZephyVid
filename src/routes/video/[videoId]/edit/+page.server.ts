import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';

export const load = async (event) => {
	// L'utilisateur doit être connecté
	if (!event.locals.user) {
		throw redirect(302, '/login');
	}
	// La vidéo doit être précisée dans l'URL
	if (!event.params.videoId) {
		throw redirect(302, '/videos');
	}

	const videoVotesData = await db
		.select({
			value: table.videoVotes.value,
			count: sql<number>`CAST(count(*) as INT)`
		})
		.from(table.videoVotes)
		.where(eq(table.videoVotes.videoId, event.params.videoId))
		.groupBy(table.videoVotes.value);

	let likes = 0;
	let dislikes = 0;
	for (const row of videoVotesData) {
		if (row.value === 1) {
			likes = row.count;
		} else if (row.value === -1) {
			dislikes = row.count;
		}
	}

	const likeData = {
		likes,
		dislikes
	};

	// Récupérer les données de la vidéo
	const videoData = await db
		.select()
		.from(table.video)
		.where(eq(table.video.id, event.params.videoId));

	if (videoData.length === 0) {
		throw redirect(302, '/videos');
	}

	// Seul le propriétaire de la vidéo peut accéder à la page d'édition
	if (videoData[0].ownerId !== event.locals.user.id) {
		throw redirect(302, '/videos');
	}

	// Récupérer les informations sur le propriétaire
	const ownerData = await db
		.select()
		.from(table.user)
		.where(eq(table.user.id, videoData[0].ownerId));

	// Si la visibilité est "personnalisé", récupérer les utilisateurs autorisés
	let allowedUsers = [];
	if (videoData[0].visibility === 'personalised') {
		allowedUsers = await db
			.select({
				id: table.user.id,
				username: table.user.username,
				profileImage: table.user.profileImage
			})
			.from(table.videosToUsers)
			.where(eq(table.videosToUsers.videoId, event.params.videoId))
			.leftJoin(table.user, eq(table.user.id, table.videosToUsers.userId));
	}

	const allComments = await db
		.select({
			id: table.comments.id, // ID du commentaire
			content: table.comments.content, // Contenu
			createdAt: table.comments.createdAt,
			updatedAt: table.comments.updatedAt,
			userId: table.user.id, // ID de l'utilisateur qui a posté le commentaire
			username: table.user.username, // Son pseudo
			parentCommentId: table.comments.parentCommentId, // ID du commentaire parent
			profileImage: table.user.profileImage,
			likes: sql<number>`SUM(
		    CASE WHEN
      ${table.commentVotes.value}
      =
      1
      THEN
      1
      ELSE
      0
      END
      )`.as('likes'),
			dislikes: sql<number>`SUM(
		    CASE WHEN
      ${table.commentVotes.value}
      =
      -
      1
      THEN
      1
      ELSE
      0
      END
      )`.as('dislikes'),
			userVote: sql<number>`MAX(
			CASE WHEN
      ${table.commentVotes.userId}
      =
      ${event.locals.user.id}
      THEN
      ${table.commentVotes.value}
      ELSE
      0
      END
      )`.as('userVote')
		})
		.from(table.comments)
		// Joindre l'utilisateur qui a posté le commentaire
		.innerJoin(table.user, eq(table.user.id, table.comments.userId))
		// Joindre (en left) les votes sur ce commentaire
		.leftJoin(table.commentVotes, eq(table.commentVotes.commentId, table.comments.id))
		.where(eq(table.comments.videoId, event.params.videoId))
		// On agrège par l'ID du commentaire (et l'ID de l'user qui a posté)
		.groupBy(table.comments.id, table.user.id)
		.orderBy(table.comments.createdAt);

	const mapChildren = new Map<string, Array<(typeof allComments)[number]>>();

	for (const c of allComments) {
		if (c.parentCommentId) {
			// On est un commentaire 'enfant'
			const arr = mapChildren.get(c.parentCommentId) || [];
			arr.push(c);
			mapChildren.set(c.parentCommentId, arr);
		}
	}

	const parents = allComments
		.filter((c) => c.parentCommentId === null)
		.map((parent) => {
			return {
				...parent,
				responses: mapChildren.get(parent.id) ?? []
			};
		});

	const videoWatchSessions = await db
		.select()
		.from(table.videoWatchSessions)
		.where(eq(table.videoWatchSessions.videoId, event.params.videoId));

	const watchDuration = videoWatchSessions.reduce((acc, session) => acc + session.watchDuration, 0);
	const averageWatchDuration = watchDuration / videoWatchSessions.length;

	return {
		user: event.locals.user,
		videoId: event.params.videoId,
		// Toutes les informations de la vidéo (titre, description, miniature, visibilité, allowDownloads, etc.)
		videoData: videoData[0],
		ownerData: ownerData[0],
		allowedUsers,
		comments: parents,
		likeData,
		watchDuration,
		averageWatchDuration,
	};
};
