import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import path from 'path';
import fs from 'fs/promises';
import { hash, verify } from '@node-rs/argon2';

export const load = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}
	const userInfos = await db.select().from(user).where(eq(user.id, locals.user.id));

	if (!userInfos.length) {
		throw fail(404);
	}

	return {
		userInfos: {
			id: userInfos[0].id,
			email: userInfos[0].email,
			profileImage: userInfos[0].profileImage,
			username: userInfos[0].username
		}
	};
};

export const actions: Actions = {
	updateAvatar: async ({ request, locals }) => {
		// Vérifier que l'utilisateur est authentifié
		if (!locals.user) {
			return fail(401, { error: 'Utilisateur non authentifié' });
		}

		const formData = await request.formData();
		const avatar = formData.get('avatar');

		if (!avatar || !(avatar instanceof File)) {
			return fail(400, { error: 'Avatar manquant' });
		}

		// Définir le dossier de stockage (par exemple, dans "data/videos/{videoId}")
		const uploadDir = path.join(process.cwd(), 'data', 'images', locals.user.id);
		await fs.mkdir(uploadDir, { recursive: true });

		// Déterminer l'extension du fichier (par défaut .jpg)
		const extension = path.extname(avatar.name) || '.jpg';
		// Chemin final pour la miniature
		const finalFilePath = path.join(uploadDir, `avatar${extension}`);

		// Récupérer le contenu du fichier et l'écrire sur disque
		const arrayBuffer = await avatar.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		await fs.writeFile(finalFilePath, buffer);

		// Enregistrer dans la base le chemin relatif, par exemple sous forme "/videos/{videoId}/custom_thumbnail.jpg"
		const avatarPath = `data/images/${locals.user.id}/avatar${extension}`;

		// Mise à jour du profil de l'utilisateur
		const updatedUsers = await db
			.update(user)
			.set({ profileImage: avatarPath })
			.where(eq(user.id, locals.user.id))
			.returning();

		locals.user.profileImage = avatarPath;

		return {
			success: true,
			data: {
				username: updatedUsers[0].username,
				email: updatedUsers[0].email,
				profileImage: updatedUsers[0].profileImage, // si nécessaire
				id: updatedUsers[0].id
			}
		};
	},
	updateProfile: async ({ request, locals }) => {
		// Vérifier que l'utilisateur est authentifié
		if (!locals.user) {
			return fail(401, { error: 'Utilisateur non authentifié' });
		}

		const formData = await request.formData();
		const username = formData.get('username');
		const email = formData.get('email');

		const errors: Record<string, string> = {};

		// Validation basique des champs
		if (!username || typeof username !== 'string' || username.trim() === '') {
			errors.username = 'Le pseudo est requis.';
		}
		if (!email || typeof email !== 'string' || email.trim() === '') {
			errors.email = 'L’adresse email est requise.';
		}

		if (Object.keys(errors).length > 0) {
			// Retourner les erreurs ainsi que les données saisies pour réaffichage dans le formulaire
			return fail(400, {
				data: Object.fromEntries(formData),
				errors
			});
		}

		try {
			if (username && email && typeof username === 'string' && typeof email === 'string') {
				// Mise à jour des données de l'utilisateur via Drizzle ORM
				const updatedUsers = await db
					.update(user)
					.set({
						username: username.trim(),
						email: email.trim()
					})
					.where(eq(user.id, locals.user.id))
					.returning();

				return {
					success: true,
					data: {
						username: updatedUsers[0].username,
						email: updatedUsers[0].email,
						profileImage: updatedUsers[0].profileImage, // si nécessaire
						id: updatedUsers[0].id
					}
				};
			} else {
				return fail(400, { error: 'Données invalides' });
			}
		} catch (error) {
			return fail(500, { error: 'Erreur serveur, merci de réessayer plus tard.' });
		}
	},
	updatePassword: async ({ request, locals }) => {
		// Vérifier que l'utilisateur est authentifié
		if (!locals.user) {
			return fail(401, { error: 'Utilisateur non authentifié' });
		}

		const formData = await request.formData();
		const currentPassword = formData.get('currentPassword');
		const newPassword = formData.get('newPassword');

		const errors: Record<string, string> = {};

		// Validation basique des champs
		if (!currentPassword || typeof currentPassword !== 'string' || currentPassword.trim() === '') {
			errors.currentPassword = 'Le mot de passe actuel est requis.';
		}
		if (!newPassword || typeof newPassword !== 'string' || newPassword.trim() === '') {
			errors.newPassword = 'Le nouveau mot de passe est requis.';
		}
		const currentUser = await db.select().from(user).where(eq(user.id, locals.user.id));
		if (!currentUser.length) {
			throw fail(404);
		}

		const isCurrentPasswordValid = await verify(currentUser[0].passwordHash, currentPassword, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		if (!isCurrentPasswordValid) {
			errors.currentPassword = 'Le mot de passe actuel est incorrect.';
		}

		// Vérifier que le nouveau mot de passe est valide
		if (!validatePassword(newPassword)) {
			errors.newPassword =
				'Le mot de passe doit contenir 8 caractères minimum, incluant au moins 1 majuscule, 1 minuscule et 1 chiffre.';
		}

		if (Object.keys(errors).length > 0) {
			// Retourner les erreurs ainsi que les données saisies pour réaffichage dans le formulaire
			return fail(400, {
				data: Object.fromEntries(formData),
				errors
			});
		}

		try {

			const passwordHash = await hash(newPassword, {
				// recommended minimum parameters
				memoryCost: 19456,
				timeCost: 2,
				outputLen: 32,
				parallelism: 1
			});
			// Mise à jour du mot de passe de l'utilisateur via Drizzle ORM
			const updatedUsers = await db
				.update(user)
				.set({
					passwordHash
				})
				.where(eq(user.id, locals.user.id))
				.returning();

			return {
				success: true,
				data: {
					username: updatedUsers[0].username,
					email: updatedUsers[0].email,
					profileImage: updatedUsers[0].profileImage, // si nécessaire
					id: updatedUsers[0].id
				}
			};
		} catch (error) {
			return fail(500, { error: 'Erreur serveur, merci de réessayer plus tard.' });
		}
	}
};

function validateUsername(username: unknown): username is string {
	return (
		typeof username === 'string' &&
		username.length >= 3 &&
		username.length <= 31 &&
		/^[a-zA-Z0-9_-]+$/.test(username)
	);
}

function validatePassword(password: unknown): password is string {
	return (
		typeof password === 'string' &&
		password.length >= 8 &&
		password.length <= 72 &&
		/[A-Z]/.test(password) &&
		/[a-z]/.test(password) &&
		/\d/.test(password)
	);
}
