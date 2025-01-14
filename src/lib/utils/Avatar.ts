import { page } from '$app/state';

export function formatProfileImage(image: string | null): string | null {
	if (!image) return null;
	return `http://${page.url.hostname}/${image}`;
}
