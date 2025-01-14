export function formatNumber(value: number) {
	return new Intl.NumberFormat(navigator.language, {
		notation: "compact",
		compactDisplay: "short",
	}).format(value);
}
