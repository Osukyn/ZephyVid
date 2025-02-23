import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { video } from '$lib/server/db/schema';

export const POST = async (event) => {
	const { id } = await event.request.json();

	if (!id) {
		return new Response(JSON.stringify({ message: 'Paramètres manquants' }), { status: 400 });
	}

	const videoData = await db.select().from(video).where(eq(video.id, id));

	if (videoData.length === 0) {
		return new Response(JSON.stringify({ message: 'Vidéo inexistante' }), { status: 404 });
	}

	const videoViewCount = await db
		.update(video)
		.set({ viewCount: videoData[0].viewCount + 1 })
		.where(eq(video.id, id));

	if (!videoViewCount) {
		return new Response(JSON.stringify({ message: 'Erreur lors de la mise à jour du compteur de vues' }), { status: 500 });
	} else {
		return new Response(JSON.stringify({ success: true }));
	}
};
