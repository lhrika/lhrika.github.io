// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	modules: [
		'@nuxt/content',
		'@nuxt/eslint',
		'@nuxt/image',
		'@nuxt/ui',
		'@nuxtjs/i18n',
		'@nuxtjs/supabase',
	],
	devtools: { enabled: true },
	css: ['~/assets/css/main.css'],
	compatibilityDate: '2025-07-15',
	nitro: {
		prerender: {
			failOnError: false,
			routes: [
				'/_ipx/s_32x32/avatars/lyhuong.png',
				'/_ipx/s_64x64/avatars/lyhuong.png',
			],
		},
	},
	i18n: {
		defaultLocale: 'zh-CN',
		locales: [
			{ code: 'en', name: 'English', file: 'en.json' },
			{ code: 'vi', name: 'Tiếng Việt', file: 'vi.json' },
			{ code: 'zh-CN', name: '简体中文', file: 'zh.json' },
			{ code: 'ja', name: '日本語', file: 'ja.json' },
		],
	},
	icon: {
		clientBundle: {
			icons: [
				'lucide:x',
				'lucide:check',
				'lucide:plus',
				'lucide:minus',
				'lucide:moon',
				'lucide:sun',
				'lucide:menu',
				'lucide:arrow-left',
				'lucide:arrow-right',
			],
			scan: true,
		},
	},
	image: {
		providers: {
			google: {
				provider: '~/providers/google',
				options: {
					baseURL: 'https://lh3.googleusercontent.com',
				},
			},
		},
	},
	supabase: {
		redirect: false,
		url: process.env.SUPABASE_URL,
		key: process.env.SUPABASE_KEY,
	},
})
