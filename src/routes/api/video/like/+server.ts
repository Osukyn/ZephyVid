import * as table from '$lib/server/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';

export const POST = async (event) => {
	// 1) Vérifier l’auth
	if (!event.locals.user) {
		// Si pas logué, on peut faire un fail(401) ou un redirect
		return new Response(JSON.stringify({ message: 'Vous devez être connecté pour liker.' }), { status: 401 });
	}

	// 2) Récup json body
	const { videoId, like } = await event.request.json();
	if (!videoId || like === undefined) {
		return new Response(JSON.stringify({ message: 'Paramètres manquants' }), { status: 400 });
	}

	// 3) Vérifier si la vidéo existe
	const video = await db
		.select()
		.from(table.video)
		.where(eq(table.video.id, videoId as string));
	if (video.length === 0) {
		return new Response(JSON.stringify({ message: 'Vidéo inexistante' }), { status: 404 });
	}

	// 4) Vérifier si l'utilisateur a déjà liké
	const likeExists = await db
		.select()
		.from(table.videoVotes)
		.where(and(eq(table.videoVotes.videoId, videoId as string), eq(table.videoVotes.userId, event.locals.user.id)));

	if (likeExists.length > 0) {
		// 5) Update en DB
		await db.update(table.videoVotes)
			.set({ value: like })
			.where(and(eq(table.videoVotes.videoId, videoId as string), eq(table.videoVotes.userId, event.locals.user.id)));
	} else {
		// 5) Insertion en DB
		await db.insert(table.videoVotes).values({
			videoId: videoId as string,
			userId: event.locals.user.id,
			value: like
		});
	}

	// 6) Récupérer le nombre de likes et dislikes
	const videoVotesData = await db
		.select({
			value: table.videoVotes.value,
			count: sql<number>`CAST(count(*) as INT)`
		})
		.from(table.videoVotes)
		.where(eq(table.videoVotes.videoId, videoId as string))
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

	// 7) Retourner le nombre de likes et dislikes
	return new Response(JSON.stringify({ likes, dislikes }), { status: 200 });
}
