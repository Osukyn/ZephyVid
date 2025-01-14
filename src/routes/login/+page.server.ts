 import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
 import { db } from '$lib/server/db';
 import * as table from '$lib/server/db/schema';
 import { eq } from 'drizzle-orm';
 import { hash, verify } from '@node-rs/argon2';
 import * as auth from '$lib/server/auth';
 import { encodeBase32LowerCase } from '@oslojs/encoding';

 export const load = async (event) => {
	 if (event.locals.user) {
		 return redirect(302, '/videos');
	 }
	 return {};
 };

 export const actions: Actions = {
	 login: async (event) => {
		 const formData = await event.request.formData();
		 const username = formData.get('username');
		 const password = formData.get('password');

		 if (!validateUsername(username)) {
			 return fail(400, { message: `Nom d'utilisateur invalide`});
		 }
		 if (!validatePassword(password)) {
			 return fail(400, { message: 'Mot de passe invalide' });
		 }

		 const results = await db.select().from(table.user).where(eq(table.user.username, username));

		 const existingUser = results.at(0);
		 if (!existingUser) {
			 return fail(400, { message: `Nom d'utilisateur ou mot de passe incorrect` });
		 }

		 const validPassword = await verify(existingUser.passwordHash, password, {
			 memoryCost: 19456,
			 timeCost: 2,
			 outputLen: 32,
			 parallelism: 1
		 });
		 if (!validPassword) {
			 return fail(400, { message: `Nom d'utilisateur ou mot de passe incorrect` });
		 }

		 const sessionToken = auth.generateSessionToken();
		 const session = await auth.createSession(sessionToken, existingUser.id);
		 auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);

		 return redirect(302, '/videos');
	 },
	 register: async (event) => {
		 const formData = await event.request.formData();
		 const username = formData.get('username');
		 const password = formData.get('password');

		 if (!validateUsername(username)) {
			 return fail(400, { message: 'Invalid username' });
		 }
		 if (!validatePassword(password)) {
			 return fail(400, { message: 'Invalid password' });
		 }

		 const userId = generateUserId();
		 const passwordHash = await hash(password, {
			 // recommended minimum parameters
			 memoryCost: 19456,
			 timeCost: 2,
			 outputLen: 32,
			 parallelism: 1
		 });

		 try {
			 await db.insert(table.user).values({ id: userId, username, passwordHash });

			 const sessionToken = auth.generateSessionToken();
			 const session = await auth.createSession(sessionToken, userId);
			 auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
		 } catch (e) {
			 console.error(e);
			 return fail(500, { message: 'An error has occurred' });
		 }
		 return redirect(302, '/videos');
	 }
 };

 function generateUserId() {
	 // ID with 120 bits of entropy, or about the same as UUID v4.
	 const bytes = crypto.getRandomValues(new Uint8Array(15));
	 const id = encodeBase32LowerCase(bytes);
	 return id;
 }

 function validateUsername(username: unknown): username is string {
	 return (
		 typeof username === 'string' &&
		 username.length >= 3 &&
		 username.length <= 31 &&
		 /^[a-zA-Z0-9_-]+$/.test(username)
	 );
 }

 function validatePassword(password: unknown): password is string {
	 return typeof password === 'string' && password.length >= 6 && password.length <= 255;
 }
