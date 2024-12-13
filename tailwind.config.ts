import type { Config } from 'tailwindcss';

export default {
	content: [
		'./pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./components/**/*.{js,ts,jsx,tsx,mdx}',
		'./app/**/*.{js,ts,jsx,tsx,mdx}',
	],
	theme: {
		extend: {
			colors: {
				gunmetal: '#20272F',
				yellow: '#F7CB15',
				moonstone: '#429EA6',
			},
		},
	},
	plugins: [],
} satisfies Config;
