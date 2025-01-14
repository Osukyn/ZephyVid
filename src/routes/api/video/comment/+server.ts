import { db } from '$lib/server/db';
import { comments } from '$lib/server/db/schema';

export const POST = async (event) => {
	const user = event.locals.user;
	if(!user) {
		return new Response(null, { status: 401 });
	}
	const body = await event.request.json();
	const { videoId, comment, parent } = body;

	try {
		const commentId = crypto.randomUUID();

		await db.insert(comments).values({
			id: commentId,
			videoId,
			userId: user.id,
			content: comment,
			parentCommentId: parent
		});

		return new Response(null, { status: 200 });
	} catch (error) {
		console.error(error);
		return new Response(null, { status: 500 });
	}
};
