import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { comments, user, video } from '$lib/server/db/schema';
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

	// 2) Sinon, on peut retourner des infos si besoin
	return { videos };
};
