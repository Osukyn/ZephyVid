import type { Config } from 'tailwindcss';
import daisyui from 'daisyui';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {}
	},

	plugins: [daisyui],
	daisyui: {
		themes: [
			{
				'forest': {
					...require("daisyui/src/theming/themes")["forest"],
					'--rounded-box': require("daisyui/src/theming/themes")["night"]["--rounded-box"],
					'--rounded-btn': require("daisyui/src/theming/themes")["night"]["--rounded-btn"],
					'--rounded-badge': require("daisyui/src/theming/themes")["night"]["--rounded-badge"]
				}
			}
		]
	},
} satisfies Config;
