import IORedis from 'ioredis';
import { db } from '$lib/server/db';
import { video } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';

export const POST = async (event) => {
	if (
		!event.request.headers.get('Authorization') ||
		event.request.headers.get('Authorization') !== `${import.meta.env.VITE_API_KEY}`
	) {
		return new Response(null, { status: 401 });
	}
	const body = await event.request.json();
	const { videoId, status } = body;

	try {
		const redis = new IORedis();
		await redis.del(`progress:${videoId}`);
		await redis.quit();

		await db
			.update(video)
			.set({
				status,
				updatedAt: sql`(unixepoch()
                             )`
			})
			.where(eq(video.id, videoId));

		return new Response(null, { status: 200 });
	} catch (error) {
		console.error(error);
		return new Response(null, { status: 500 });
	}
};
