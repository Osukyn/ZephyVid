import { type Actions, fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import {
	type Invitation,
	invitations,
	type InvitationsToUsers,
	invitationsToUsers,
	user
} from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import type { User } from 'lucide-svelte';

export const load = async ({ locals }) => {
	if (!locals.user || !locals.user.isAdmin) {
		throw redirect(302, '/videos');
	}

	const invites = await db
		.select()
		.from(invitations)
		.leftJoin(invitationsToUsers, eq(invitations.id, invitationsToUsers.invitationId))
		.leftJoin(user, eq(invitationsToUsers.usedByUserId, user.id))
		.orderBy(desc(invitations.createdAt));

	const inviteMap = new Map<
		string,
		Invitation & {
			usedBy: Array<InvitationsToUsers & { user: Pick<User, 'id' | 'username' | 'profileImage'> }>;
		}
	>();

	for (const row of invites) {
		const invite = row.invitations;
		const invUsage = row.invitations_to_users;
		const usr = row.user;

		if (!inviteMap.has(invite.id)) {
			inviteMap.set(invite.id, { ...invite, usedBy: [] });
		}

		if (invUsage && usr) {
			inviteMap.get(invite.id)?.usedBy.push({
				...invUsage,
				user: {
					id: usr.id,
					username: usr.username,
					profileImage: usr.profileImage
				}
			});
		}
	}

	const result = Array.from(inviteMap.values());

	return {
		invites: result
	};
};

export const actions: Actions = {
	inviteCreate: async ({ request, locals }) => {
		if (!locals.user || !locals.user.isAdmin) {
			return fail(401, {
				error: 'Unauthorized'
			});
		}

		const body = Object.fromEntries(await request.formData());
		if (
			!body ||
			!body.expiresIn ||
			!body.maxUses ||
			(body.expiresIn === 'custom' && !body.expiresInCustom) ||
			isNaN(body.maxUses as unknown as number) ||
			!body.code
		) {
			return fail(400, {
				error: 'Invalid request'
			});
		}
		let expiresAt: Date | null = null;

		switch (body.expiresIn) {
			case '24h':
				expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
				break;
			case '7d':
				expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
				break;
			case '30d':
				expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
				break;
			case 'custom':
				expiresAt = new Date(body.expiresInCustom as string);
				break;
			case 'never':
			default:
				expiresAt = null;
				break;
		}

		const createdInvite = await db
			.insert(invitations)
			.values({
				id: crypto.randomUUID(),
				code: body.code as unknown as string,
				createdByUserId: locals.user.id,
				expiresAt,
				maxUses: body.maxUses as unknown as number
			})
			.returning();

		return {
			success: true,
			data: {
				...createdInvite[0],
				usedBy: []
			}
		};
	},
	inviteDelete: async ({ locals, request }) => {
		if (!locals.user || !locals.user.isAdmin) {
			return fail(401, {
				error: 'Unauthorized'
			});
		}

		const inviteId = Object.fromEntries(await request.formData()).inviteId as string;
		if (!inviteId) {
			return fail(400, {
				error: 'Invalid request'
			});
		}

		const deletedInvite = await db
			.delete(invitations)
			.where(eq(invitations.id, inviteId))
			.returning();

		return {
			success: true,
			data: {
				inviteId: deletedInvite[0].id
			}
		};
	}
};
