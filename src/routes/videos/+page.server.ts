import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { comments, user, video, videosToUsers } from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { count, desc, eq } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	// 1) Vérifier si l'utilisateur est logué
	if (!event.locals.user) {
		throw redirect(302, '/login');
		// ou '/demo/lucia/login' selon ton routing
	}

	//get all videos and comment number from the user
	const videos = await db
		.select({
			id: video.id,
			title: video.title,
			description: video.description,
			createdAt: video.createdAt,
			updatedAt: video.updatedAt,
			thumbnail: video.thumbnail,
			viewCount: video.viewCount,
			visibility: video.visibility,
			allowDownloads: video.allowDownloads,
			sourceFilePath: video.sourceFilePath,
			ownerId: video.ownerId,
			owner: {
				id: user.id,
				username: user.username,
				profileImage: user.profileImage
			},
			commentCount: count(comments.id)
		})
		.from(video)
		.where(eq(video.ownerId, event.locals.user.id))
		.leftJoin(user, eq(video.ownerId, user.id))
		.leftJoin(comments, eq(video.id, comments.videoId))
		.groupBy(video.id)
		.orderBy(desc(video.createdAt));

	const usersVideosResult = await db
		.select({
			id: video.id,
			title: video.title,
			description: video.description,
			status: video.status,
			userId: videosToUsers.userId,
			createdAt: video.createdAt,
			updatedAt: video.updatedAt,
			thumbnail: video.thumbnail,
			viewCount: video.viewCount,
			visibility: video.visibility,
			allowDownloads: video.allowDownloads,
			sourceFilePath: video.sourceFilePath,
			ownerId: video.ownerId,
			owner: {
				id: user.id,
				username: user.username,
				profileImage: user.profileImage
			},
			commentCount: count(comments.id)
		})
		.from(videosToUsers)
		.where(eq(videosToUsers.userId, event.locals.user.id))
		.leftJoin(video, eq(videosToUsers.videoId, video.id))
		.leftJoin(user, eq(video.ownerId, user.id))
		.leftJoin(comments, eq(video.id, comments.videoId))
		.groupBy(video.id)
		.orderBy(desc(video.createdAt));

	// group viedos by user
	const usersVideos = usersVideosResult.reduce((acc, video) => {
		if (!acc[video.ownerId]) {
			acc[video.ownerId] = [];
		}
		acc[video.ownerId].push(video);
		return acc;
	}, {});

	// 2) Sinon, on peut retourner des infos si besoin
	return { videos, usersVideos };
};
