export function formatDateToLocal(date: Date) {
	const formatter = new Intl.DateTimeFormat(navigator.language, {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	});
	return formatter.format(date) + ' à ' + date.toLocaleTimeString();
}

export function formatTimeAgoIntl(date: Date) {
	const now = new Date();
	const diff = (now - date) / 1000; // Différence en secondes

	const rtf = new Intl.RelativeTimeFormat(navigator.language, { numeric: 'auto' });

	if (diff < 60) {
		return rtf.format(-Math.floor(diff), 'second');
	} else if (diff < 3600) {
		return rtf.format(-Math.floor(diff / 60), 'minute');
	} else if (diff < 86400) {
		return rtf.format(-Math.floor(diff / 3600), 'hour');
	} else if (diff < 2592000) {
		return rtf.format(-Math.floor(diff / 86400), 'day');
	} else if (diff < 31536000) {
		return rtf.format(-Math.floor(diff / 2592000), 'month');
	} else {
		return rtf.format(-Math.floor(diff / 31536000), 'year');
	}
}
