import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { comments, type NewComment } from '$lib/server/db/schema';

export const load = async (event) => {
	if (!event.locals.user) {
		throw redirect(302, '/login');
	}
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

	const userLikeData = await db
		.select()
		.from(table.videoVotes)
		.where(
			and(
				eq(table.videoVotes.videoId, event.params.videoId),
				eq(table.videoVotes.userId, event.locals.user.id)
			)
		);

	const likeData = {
		likes,
		dislikes,
		userLike: userLikeData.length > 0 ? userLikeData[0].value : 0
	};

	const videoData = await db
		.select()
		.from(table.video)
		.where(eq(table.video.id, event.params.videoId));
	if (videoData.length === 0) {
		throw redirect(302, '/videos');
	}

	if (videoData[0].visibility === 'private') {
		if (videoData[0].ownerId !== event.locals.user.id) {
			throw redirect(302, '/videos');
		}
	} else if (
		videoData[0].visibility === 'personalised' &&
		videoData[0].ownerId !== event.locals.user.id
	) {
		const allowedUsers = await db
			.select()
			.from(table.videosToUsers)
			.where(
				and(
					eq(table.videosToUsers.videoId, event.params.videoId),
					eq(table.videosToUsers.userId, event.locals.user.id)
				)
			);
		if (allowedUsers.length === 0) {
			throw redirect(302, '/videos');
		}
	}

	const ownerData = await db
		.select()
		.from(table.user)
		.where(eq(table.user.id, videoData[0].ownerId));

	if (ownerData.length === 0) {
		throw redirect(302, '/videos');
	}
	/*const comments = await db
		.select()
		.from(table.comments)
		.where(eq(table.comments.videoId, event.params.videoId))
		.leftJoin(table.commentVotes, eq(table.comments.id, table.commentVotes.commentId))
		.innerJoin(table.user, eq(table.user.id, table.comments.userId));*/

	const commentsWithVotes = await db
		.select({
			id: table.comments.id, // ID du commentaire
			content: table.comments.content, // Contenu
			createdAt: table.comments.createdAt,
			updatedAt: table.comments.updatedAt,
			parentCommentId: table.comments.parentCommentId,
			userId: table.user.id, // ID de l'utilisateur qui a posté le commentaire
			username: table.user.username, // Son pseudo
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

	return {
		user: event.locals.user,
		videoId: event.params.videoId,
		videoData: videoData[0],
		ownerData: ownerData[0],
		comments: commentsWithVotes,
		likeData
	};
};

export const actions = {
	comment: async (event) => {
		const user = event.locals.user;
		if (!user) {
			return redirect(302, '/login');
		}
		const formData = await event.request.formData();

		const comment = formData.get('comment');
		const videoId = event.params.videoId;
		const parent = formData.get('parent');

		if (!comment || !videoId) {
			return fail(400, { message: 'Paramètres manquants' });
		}

		try {
			const commentId: string = crypto.randomUUID();

			const newComment: NewComment = await db.insert(table.comments).values({
				id: commentId,
				userId: user.id,
				videoId: videoId,
				content: comment,
				parentCommentId: parent || null
			});

			return JSON.stringify({ newComment });
		} catch (error) {
			console.error(error);
			return fail(500, { message: 'Erreur interne' });
		}
	},
	deleteComment: async (event) => {
		const user = event.locals.user;
		if (!user) {
			return redirect(302, '/login');
		}
		const formData = await event.request.formData();

		const commentId = formData.get('commentId');

		if (!commentId) {
			return fail(400, { message: 'Paramètres manquants' });
		}

		const comment = await db
			.select()
			.from(table.comments)
			.where(eq(table.comments.id, commentId as string));

		if (comment.length === 0) {
			return fail(404, { message: 'Commentaire introuvable' });
		}

		if (comment[0].userId !== user.id) {
			return fail(403, { message: "Vous n'êtes pas autorisé à supprimer ce commentaire" });
		}

		await db.delete(table.comments).where(eq(table.comments.id, commentId as string));

		return JSON.stringify({ success: true });
	},
	editComment: async (event) => {
		const user = event.locals.user;
		if (!user) {
			return redirect(302, '/login');
		}
		const formData = await event.request.formData();
		const commentId = formData.get('commentId');
		const commentContent = formData.get('edit-comment-content');

		if (!commentId || !commentContent) {
			return fail(400, { message: 'Paramètres manquants' });
		}

		const comment = await db
			.select()
			.from(table.comments)
			.where(eq(table.comments.id, commentId as string));

		if (comment.length === 0) {
			return fail(404, { message: 'Commentaire introuvable' });
		}

		const updatedComment = await db.update(comments).set({
			content: commentContent as string,
			updatedAt: sql`(unixepoch())`
		}).where(eq(comments.id, commentId as string));

		return updatedComment ? JSON.stringify({success: true}) : fail(500, { message: 'Erreur de mise à jour' });;
	}
};
