import IORedis from 'ioredis';
import { db } from '$lib/server/db';
import { and, eq } from 'drizzle-orm';
import { video } from '$lib/server/db/schema';

export const POST = async (event) => {
	if (!event.request.headers.get('Authorization') || event.request.headers.get('Authorization') !== `${import.meta.env.VITE_API_KEY}`) {
		return new Response(null, { status: 401 });
	}
	const body = await event.request.json();
	const { videoId, progress } = body;

	const redis = new IORedis();
	await redis.set(`progress:${videoId}`, progress);
	await redis.quit();

	return new Response(null, { status: 200 });
}

export const GET = async (event) => {
	const user = event.locals.user;;
	const videoId = event.url.searchParams.get('videoId');
	if(!user || !videoId) {
		return new Response(null, { status: 401 });
	}

	const videoSelect = await db.select().from(video).where(and(eq(video.ownerId, user.id), eq(video.id, videoId)));
	const videoData = videoSelect.at(0);
	if(!videoData) {
		return new Response(null, { status: 404 });
	}

	if(videoData.status === 'ready') {
		return new Response(JSON.stringify({
			progress: 100
		}), { status: 200 });
	}

	const redis = new IORedis();
	const progress = await redis.get(`progress:${videoId}`);
	await redis.quit();

	return new Response(JSON.stringify({ progress }), { status: 200 });
}
