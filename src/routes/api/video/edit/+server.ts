import { fail, error } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';
import { db } from '$lib/server/db';
import { video, videosToUsers } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// Pour simplifier, nous utilisons ici fs/promises et la méthode arrayBuffer() pour récupérer le contenu du fichier.
// Pour un fichier image (généralement de petite taille), cette méthode convient.
export const POST = async (event) => {
	// 1) Vérifier que l'utilisateur est authentifié
	if (!event.locals.user) throw fail(401, { message: 'Vous devez être connecté pour éditer la vidéo.' });

	try {
		// 2) Récupérer les données du FormData
		let videoId;
		let title;
		let description;
		let allowDownloads;
		let visibility;
		let allowedUsers;
		let thumbnailFile;
		let thumbnailPath;

		if (event.request.headers.get('Content-Type')?.includes('application/json')) {
			// Si le Content-Type est différent, on utilise event.request.json() pour récupérer les données
			const body = await event.request.json();
			videoId = body.videoId;
			title = body.title;
			description = body.description;
			allowDownloads = body.allowDownloads;
			visibility = body.visibility;
			allowedUsers = body.allowedUsers
			thumbnailPath = body.thumbnail;
		} else {
			const formData = await event.request.formData();

			videoId = formData.get('videoId')?.toString();
			title = formData.get('title')?.toString();
			description = formData.get('description')?.toString();
			allowDownloads = formData.get('allowDownloads')?.toString() === 'true';
			visibility = formData.get('visibility')?.toString();
			const allowedUsersStr = formData.get('allowedUsers')?.toString();
			allowedUsers = allowedUsersStr ? JSON.parse(allowedUsersStr) : [];
			// Récupérer le fichier miniature (champ "thumbnail")
			thumbnailFile = formData.get('thumbnail') as File | null;
		}

		// 3) Vérifier que les champs obligatoires sont présents
		if (!videoId || !title) {
			throw fail(400, { message: 'Des paramètres obligatoires sont manquants.' });
		}

		// 4) Vérifier que la vidéo existe et que l'utilisateur en est le propriétaire
		const videos = await db
			.select()
			.from(video)
			.where(eq(video.id, videoId));
		if (videos.length === 0) {
			throw error(404, 'Vidéo introuvable.');
		}
		const existingVideo = videos[0];
		if (existingVideo.ownerId !== event.locals.user.id) {
			throw error(403, 'Vous n’êtes pas autorisé à modifier cette vidéo.');
		}

		// 5) Définir le chemin de stockage de la miniature personnalisée, si un fichier est envoyé
		if (thumbnailFile) {
			// Définir le dossier de stockage (par exemple, dans "data/videos/{videoId}")
			const uploadDir = path.join(process.cwd(), 'data', 'videos', videoId);
			await fs.mkdir(uploadDir, { recursive: true });

			// Déterminer l'extension du fichier (par défaut .jpg)
			const extension = path.extname(thumbnailFile.name) || '.jpg';
			// Chemin final pour la miniature
			const finalFilePath = path.join(uploadDir, `custom_thumbnail${extension}`);

			// Récupérer le contenu du fichier et l'écrire sur disque
			const arrayBuffer = await thumbnailFile.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);
			await fs.writeFile(finalFilePath, buffer);

			// Enregistrer dans la base le chemin relatif, par exemple sous forme "/videos/{videoId}/custom_thumbnail.jpg"
			thumbnailPath = `data/videos/${videoId}/custom_thumbnail${extension}`;
		}

		// 6) Mettre à jour la vidéo dans la base de données
		await db
			.update(video)
			.set({
				title,
				description: description || null,
				allowDownloads,
				thumbnail: thumbnailPath,
				visibility,
				updatedAt: new Date() // ou sql`(unixepoch())` selon votre configuration
			})
			.where(eq(video.id, videoId));

		// 7) Gérer les utilisateurs autorisés pour une visibilité personnalisée
		if (visibility === 'personalised') {
			// Supprimer d'abord les enregistrements existants dans la table de jonction
			await db.delete(videosToUsers).where(eq(videosToUsers.videoId, videoId));
			// Insérer les nouveaux enregistrements pour chaque utilisateur autorisé
			for (const allowedUserId of allowedUsers) {
				await db.insert(videosToUsers).values({
					videoId,
					userId: allowedUserId,
					accessLevel: 0 // valeur par défaut, à adapter si nécessaire
				});
			}
		} else {
			// Si la visibilité n'est pas "personalised", supprimer les enregistrements existants
			await db.delete(videosToUsers).where(eq(videosToUsers.videoId, videoId));
		}

		return new Response(
			JSON.stringify({
				success: true,
				message: 'Vidéo mise à jour avec succès.',
				thumbnail: thumbnailPath
			}),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	} catch (err) {
		console.error(err);
		throw fail(500, { message: 'Erreur serveur lors de la mise à jour de la vidéo.' });
	}
};
