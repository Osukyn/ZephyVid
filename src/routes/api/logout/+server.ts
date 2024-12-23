import { deleteSessionTokenCookie, invalidateSession } from '$lib/server/auth';

export const POST = async (event) => {
	if (!event.locals.session) {
		return new Response(null, { status: 401 });
	}
	await invalidateSession(event.locals.session.id);
	deleteSessionTokenCookie(event);
	return new Response(null, { status: 302, headers: { location: '/login' } });
}
