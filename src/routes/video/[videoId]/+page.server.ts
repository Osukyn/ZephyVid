import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { video } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load = async (event) => {
	if (!event.locals.user) {
		throw redirect(302, '/login');
	}
	if (!event.params.videoId) {
		throw redirect(302, '/videos');
	}

	const videoData =  await db.select().from(video).where(eq(video.id, event.params.videoId));
	return {
		videoId: event.params.videoId,
		videoData: videoData[0],
	};
}
