import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { and, eq, not, or, sql } from 'drizzle-orm';

export const GET = async (event) => {
	const query = event.url.searchParams.get('query');
	if (!query) {
		return new Response(JSON.stringify({ message: 'You need to provide an id' }), {
			status: 400
		});
	}

	if (!event.locals.user) {
		return new Response(JSON.stringify({ message: 'You need to be logged in' }), { status: 401 });
	}

	try {
		const userFound =  await db
			.select()
			.from(user)
			.where(
				and(
					or(
						sql`${user.username}
          LIKE
          ${sql.raw(`'${query}%'`)}`,
						sql`${user.email}
          LIKE
          ${sql.raw(`'${query}%'`)}`
					),
					not(eq(user.id, event.locals.user.id))
				)
			);

		if (userFound.length === 0) {
			return new Response(JSON.stringify({ message: 'User not found' }), { status: 404 });
		}

		return new Response(JSON.stringify(userFound[0]), { status: 200 });
	} catch (error) {
		console.error(error);
		return new Response(JSON.stringify({ message: 'An error occurred' }), { status: 500 });
	}
}
