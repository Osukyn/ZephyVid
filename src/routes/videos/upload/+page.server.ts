import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async (event) => {
	// 1) Vérifier si l'utilisateur est logué
	if (!event.locals.user) {
		throw redirect(302, '/demo/lucia/login');
		// ou '/demo/lucia/login' selon ton routing
	}
	// 2) Sinon, on peut retourner des infos si besoin
	return {};
};
