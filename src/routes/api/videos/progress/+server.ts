import { db } from '$lib/server/db';
import { video } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import IORedis from 'ioredis';

export const GET = async (event) => {
	const user = event.locals.user;;
	if(!user) {
		return new Response(null, { status: 401 });
	}

	const videos = await db.select().from(video).where(and(eq(video.ownerId, user.id)));
	if(videos.length === 0) {
		return new Response(null, { status: 404 });
	}

	const videoProgress: { id: string, progress: number, status: string }[] = [];

	for (let i = 0; i < videos.length; i++) {
		const videoData = videos.at(i);
		if (videoData) {
			if (videoData.status === 'ready') {
				videoProgress.push({
					id: videoData.id,
					progress: 100,
					status: videoData.status
				});
			} else {
				const redis = new IORedis();
				const progress = await redis.get(`progress:${videoData.id}`);
				await redis.quit();
				videoProgress.push({
					id: videoData.id,
					progress: parseInt(progress || '0'),
					status: videoData.status
				});
			}
		}
	}

	return new Response(JSON.stringify(videoProgress), { status: 200 });
}
