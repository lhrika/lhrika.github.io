import { defineCollection, defineContentConfig } from '@nuxt/content'
import * as z from 'zod/v4'

export default defineContentConfig({
	collections: {
		blog: defineCollection({
			// Specify the type of content in this collection
			type: 'page',
			// Load every file inside the `content` directory
			source: {
				include: 'blog/**',
				exclude: ['blog/private/**'],
			},
			schema: z.object({
				date: z.date().optional(),
				tags: z.array(z.string()).optional(),
				draft: z.boolean().default(false),
				dictionary: z.boolean().default(false),
				image: z.string().optional(),
				excerpt: z.object({
					type: z.string(),
					children: z.any(),
				}),
			}),
		}),
		dictionary: defineCollection({
			type: 'data',
			source: {
				include: 'dictionary/**',
			},
			schema: z.object({
				title: z.string(),
			}),
		}),
		messages: defineCollection({
			type: 'data',
			source: 'messages.csv',
			schema: z.object({
				name: z.string(),
				content: z.string(),
				created_at: z.date(),
			}),
		}),
		adv: defineCollection({
			type: 'data',
			source: {
				include: 'adv/**',
			},
			schema: z.object({
				title: z.string(),
				content: z.array(z.string()),
			}),
		}),
		updates: defineCollection({
			type: 'data',
			source: 'updates.csv',
			schema: z.object({
				id: z.string(),
				content: z.string(),
				at: z.date(),
				user: z.string(),
			}),
		}),
		profiles: defineCollection({
			type: 'data',
			source: {
				include: 'profiles/**',
			},
			schema: z.object({
				uuid: z.string(),
				name: z.string(),
				avatar: z.string().optional(),
			}),
		}),
		library: defineCollection({
			type: 'data',
			source: 'library/**',
			schema: z.object({
				title: z.string(),
				image: z.string().or(z.array(z.string())),
				status: z.enum(['pending', 'ongoing', 'completed', 'interested']),
				startDate: z.date().optional(),
				completeDate: z.date().optional(),
				links: z.array(
					z.object({
						label: z.string(),
						to: z.string(),
					}),
				),
			}),
		}),
		routine: defineCollection({
			type: 'data',
			source: 'routine/**',
			schema: z.object({
				title: z.string(),
				startAt: z.string().optional(),
				repeat: z.boolean().or(z.iso.duration()).optional(),
				items: z.array(
					z.object({
						title: z.string(),
						description: z.string(),
					}),
				),
			}),
		}),
	},
})
