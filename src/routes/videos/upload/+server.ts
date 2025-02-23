import { fail } from '@sveltejs/kit';

import fs from 'fs/promises';
import path from 'path';
import { db } from '$lib/server/db';
import { video, videosToUsers } from '$lib/server/db/schema';
import { randomUUID } from 'crypto';
import IORedis from 'ioredis';
import { Queue } from 'bullmq';

const redis = new IORedis();
const transcodeQueue = new Queue('transcode', { connection: redis });

export const POST = async (event) => {
	// 1) Vérifier l’auth

	// Si pas logué, on peut faire un fail(401) ou un redirect
	if (!event.locals.user) throw fail(401, { message: 'Vous devez être connecté pour uploader.' });

	try {
		// 2) Récup FormData
		const formData = await event.request.formData();

		const title = formData.get('title')?.toString();
		const description = formData.get('description')?.toString();
		const file = formData.get('videoFile') as File | null;
		const visibility = formData.get('visibility') as 'private' | 'unlisted' | 'personalised';
		let allowedUsers: string[] = [];
		if (visibility === 'personalised') {
			allowedUsers = JSON.parse(formData.get('allowedUsers') as string);
		}

		// 3) Vérifier champs
		if (!title || !file) {
			throw fail(400, { message: 'Titre ou fichier manquant' });
		}

		// 4) Vérifier type MIME
		/*const allowedTypes = ['video/*'];
		if (!allowedTypes.includes(file.type)) {
			throw fail(400, { message: 'Format de fichier non supporté' });
		}*/

		const videoId = randomUUID();

		// 5) Déterminer un chemin de stockage
		const uploadDir = path.join('data', 'videos', videoId);
		await fs.mkdir(uploadDir, { recursive: true });

		const originalFileName = file.name; // ex: "myvideo.mp4"
		const extension = path.extname(originalFileName) || '';
		const finalFilePath = path.join(uploadDir, `original${extension}`);

		// 8) Convertir le File en Buffer et l'écrire sur disque
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		await fs.writeFile(finalFilePath, buffer);

		// 7) (Optionnel) Insert en DB
		await db.insert(video).values({
			id: videoId,
			ownerId: event.locals.user.id,
			title,
			description: typeof description === 'string' ? description : null,
			sourceFilePath: finalFilePath, // le chemin stocké en BDD
			visibility,
			allowDownloads: false,
			status: 'pending' // ou "uploaded"
			// createdAt / updatedAt sont gérés par défautSql('CURRENT_TIMESTAMP') si tu l'as configuré
		});

		// optionnel: insert en DB les utilisateurs autorisés
		if (allowedUsers.length > 0) {
			await db.insert(videosToUsers).values(allowedUsers.map((userId) => ({ videoId, userId })));
		}

		// 6) Ajouter une tâche à la queue de transcodage

		try {
			// 9) Déterminer le dossier de sortie
			const outputDir = path.join('../', 'data', 'videos', videoId, 'transcoded');
			// Ajouter la tâche à la queue
			await transcodeQueue.add('transcode-video', {
				videoId,
				filePath: `../${finalFilePath}`,
				outputDir
			});

			return new Response(
				JSON.stringify({
					success: true,
					message: 'Fichier uploadé',
					finalFilePath
				}),
				{
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				}
			);
		} catch (err) {
			console.error('Erreur lors de l’ajout à la queue', err);
			return new Response(JSON.stringify({ error: 'Erreur lors de l’ajout à la queue' }), {
				status: 500
			});
		}
	} catch (err) {
		console.error(err);
		throw fail(500, { message: 'Erreur serveur' });
	}
};
