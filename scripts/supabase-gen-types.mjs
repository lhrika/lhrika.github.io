#!/usr/bin/env node
import { execSync } from 'child_process'
import dotenv from 'dotenv'
dotenv.config()

// Prefer explicit var, otherwise try to parse from SUPABASE_URL
const projectId =
	process.env.SUPABASE_PROJECT_ID ||
	(process.env.SUPABASE_URL
		? new URL(process.env.SUPABASE_URL).hostname.split('.')[0]
		: undefined)

if (!projectId) {
	console.error('Missing SUPABASE_PROJECT_ID or SUPABASE_URL in environment')
	process.exit(1)
}

execSync(
	`npx supabase gen types --lang=typescript --project-id ${projectId} > app/types/database.types.ts`,
	{ stdio: 'inherit' },
)
