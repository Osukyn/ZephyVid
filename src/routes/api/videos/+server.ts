import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { type Video, video as videoTable } from '$lib/server/db/schema';
import { eq, inArray } from 'drizzle-orm';
import fs from 'fs/promises';

// delete a video
export const DELETE: RequestHandler = async (event) => {
	// 1) Vérifier si l'utilisateur est logué
	if (!event.locals.user) {
		return new Response('Unauthorized', { status: 401 });
	}

	// 2) Vérifier si l'utilisateur a le droit de supprimer la vidéo
	// 2.1) Récupérer l'ID de la vidéo
	const videoId = event.url.searchParams.get('id');
	const videoIds = event.url.searchParams.get('ids');
	if (!videoId && !videoIds) {
		return new Response('Bad request', { status: 400 });
	}

	if (videoId) {
		// 2.2) Récupérer la vidéo
		const result = await db.select().from(videoTable).where(eq(videoTable.id, videoId));
		// 2.3) Vérifier si la vidéo existe
		if (!result || result.length === 0) {
			return new Response('Video not found', { status: 404 });
		}
		const video = result.at(0) as Video;
		// 2.4) Vérifier si l'utilisateur est le propriétaire de la vidéo
		if (video.ownerId !== event.locals.user.id) {
			return new Response('Forbidden', { status: 403 });
		}

		// 3) Supprimer la vidéo
		// 3.1) Supprimer le fichier vidéo
		const videoPath = (video.sourceFilePath || '').split('/').slice(0, -1).join('/');
		await fs.rm(videoPath, { recursive: true });
		// 3.2) Supprimer la vidéo de la base de données
		await db.delete(videoTable).where(eq(videoTable.id, videoId));

		// 4) Rediriger l'utilisateur
		return new Response('Deleted', { status: 200 });
	} else if (videoIds) {
		// 2.2) Récupérer les vidéos
		const result = await db.select().from(videoTable).where(inArray(videoTable.id, videoIds.split(',')));

		// 3) Supprimer les vidéos
		for (const video of result) {
			// 3.1) Supprimer le fichier vidéo
			const videoPath = (video.sourceFilePath || '').split('/').slice(0, -1).join('/');
			await fs.rm(videoPath, { recursive: true });
		}
		// 3.2) Supprimer les vidéos de la base de données
		await db.delete(videoTable).where(inArray(videoTable.id, videoIds.split(',')));

		// 4) Rediriger l'utilisateur
		return new Response('Deleted', { status: 200 });
	} else {
		return new Response('Bad request', { status: 400 });
	}
};
