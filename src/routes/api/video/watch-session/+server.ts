import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { videoWatchSessions } from '$lib/server/db/schema';
import { json, error } from '@sveltejs/kit';

export const POST: RequestHandler = async (event) => {
	// Vérifie que l'utilisateur est authentifié
	const user = event.locals.user;
	if (!user) {
		throw error(401, 'Utilisateur non authentifié');
	}

	try {
		const body = await event.request.json();
		console.log('body:', body);
		const { videoId, watchDuration } = body;

		// Validation des paramètres
		if (!videoId || typeof watchDuration !== 'number') {
			throw error(400, 'Paramètres manquants ou invalides');
		}

		// Insertion de la session de visionnage dans la base de données
		await db.insert(videoWatchSessions).values({
			id: crypto.randomUUID(),
			videoId,
			userId: user.id,
			watchDuration
			// createdAt est généré automatiquement par la DB via default(sql`(unixepoch())`)
		});

		return json({ success: true });
	} catch (err) {
		console.error('Erreur lors de l’enregistrement du watch session :', err);
		throw error(500, 'Erreur interne du serveur');
	}
};
