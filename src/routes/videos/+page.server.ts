import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { video } from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	// 1) Vérifier si l'utilisateur est logué
	if (!event.locals.user) {
		throw redirect(302, '/login');
		// ou '/demo/lucia/login' selon ton routing
	}

	//get all videos from the user
	const videos = await db.select().from(video).where(eq(video.ownerId, event.locals.user.id));
	// 2) Sinon, on peut retourner des infos si besoin
	return { videos };
}
