# Copilot Instructions

## Stack

**Nuxt 4** (Vue 3) personal blog and portfolio platform with:
- **@nuxt/content v3** — Markdown blog posts + typed data collections (CSV, YAML, JSON)
- **@nuxtjs/i18n** — Multilingual UI (default: `zh-CN`; locales: `en`, `vi`, `zh`, `ja`)
- **Nuxt UI v4** + Tailwind CSS — Component library, themed via `app.config.ts`
- **Supabase** — PostgreSQL database + Auth + Deno Edge Functions
- **Pinia** — State management (auto-imported, persisted)

## Commands

```bash
npm run dev          # Dev server (http://localhost:3000)
npm run build        # Production build
npm run generate     # Static site generation
npm run lint         # ESLint
npm run lint:fix     # ESLint with auto-fix
npm run format       # Prettier
npm run format:check # Check formatting
```

No test framework is configured.

## Architecture

```
app/
  components/   # PascalCase Vue components (AppHeader.vue, PdfViewer.vue)
  pages/        # File-based routing, kebab-case filenames
  composables/  # usePrefix naming (useProfile.ts, usePDF.ts)
  stores/       # Pinia stores, camelCase (app.ts, pdf.ts)
  types/        # database.types.ts — auto-generated from Supabase
  utils/        # camelCase helpers (hexToRgb.ts)
content/        # Markdown posts + CSV/YAML/JSON data collections
server/api/     # Nitro API handlers
shared/         # SemanticColor type + semanticColors array (used in app.config.ts)
i18n/locales/   # en.json, vi.json, zh.json, ja.json
supabase/
  functions/    # Deno Edge Functions (submit-message, signup)
```

**Request flow:** Pages (`app/pages/`) → fetch content via `queryCollection()` or Supabase client → server API handlers proxy external services or handle form submission → Edge Functions validate (Turnstile CAPTCHA) and write to DB.

## Content Collections

Defined in `content.config.ts` with Zod schemas:

| Collection | Format | Key fields |
|---|---|---|
| `blog` | Markdown | `title`, `date`, `tags`, `draft`, `image`, `excerpt` |
| `library` | Markdown | `status` (pending/ongoing/completed/interested) |
| `messages` | CSV | Guestbook entries |
| `updates` | CSV | Timeline entries |
| `adv` | Markdown | Game progress |
| `profiles` | Markdown | UUID-based user profiles |

Query with `queryCollection('blog').where(...).all()` inside `useAsyncData`.

Blog post frontmatter example:
```yaml
---
title: Post Title
date: 2024-03-01
tags: [tag1, tag2]
image: pw/googlePhotosPath
---
```

Images use Google Photos provider: `![alt](path){provider="google" width="500" height="500"}`

## Key Conventions

**Auto-imports:** Components, composables, stores, and utils are all auto-imported by Nuxt — no explicit `import` statements needed for these.

**i18n:** Use `const { t, locale } = useI18n()` and `t('key')` in templates. Routes are auto-prefixed (`/blog`, `/en/blog`, `/zh/blog`). Translation keys live in `i18n/locales/*.json`.

**Supabase:**
- `useSupabaseUser()` — authenticated user
- `useSupabaseClient<Database>()` — typed DB queries (uses `Database` type from `app/types/database.types.ts`)
- Edge Functions live in `supabase/functions/` (Deno runtime)
- Never bypass RLS — access control is enforced at the DB level

**Theming:** Custom semantic colors defined in `shared/theme.ts`, referenced in `app.config.ts` compound variants for Nuxt UI components.

**ESLint rule:** Vue components must always use self-closing tags (enforced via `@nuxt/eslint`).

**Formatting:** Tabs (width 2), single quotes, no semicolons (Prettier). YAML files use spaces.

**Tool versions:** Node 24, Deno 2 (managed via `mise`).
