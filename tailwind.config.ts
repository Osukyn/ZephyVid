import type { Config } from 'tailwindcss';
import daisyui from 'daisyui';

import vidstack from 'vidstack/tailwind.cjs';

import daisyui0 from 'daisyui/src/theming/themes';

import tailwindcss_animate from 'tailwindcss-animate';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {}
	},

	plugins: [
		daisyui,
		vidstack({
			prefix: 'media',
			webComponents: true
		}),
		tailwindcss_animate,
		customVariants,
	],
	daisyui: {
		themes: [
			{
				forest: {
					...daisyui0['forest'],
					'--rounded-box': daisyui0['night']['--rounded-box'],
					'--rounded-btn': daisyui0['night']['--rounded-btn'],
					'--rounded-badge': daisyui0['night']['--rounded-badge']
				}
			}
		]
	}
} satisfies Config;

function customVariants({ matchVariant }) {
	// Strict version of `.group` to help with nested menus (i.e., submenus).
	matchVariant('parent-data', (value) => `.parent[data-${value}] > &`);
}
