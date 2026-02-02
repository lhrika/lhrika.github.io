<template>
	<div>
		<!-- Search input -->
		<UFieldGroup class="flex mb-8">
			<UInput
				v-model="searchQuery"
				type="text"
				:placeholder="t('searchDictionary') || 'Search dictionary...'"
				icon="i-lucide-search"
				size="lg"
				class="max-w-lg flex grow"
				@update:model-value="performSearch"
			/>
			<UPopover
				:ui="{
					content: 'p-4',
				}"
			>
				<UButton icon="i-lucide-filter" variant="subtle" color="neutral" />
				<template #content>
					<UCheckboxGroup
						v-model="selectedDictionaries"
						:items="availableDictionaries"
						:ui="{
							fieldset: 'flex-wrap',
						}"
						@change="() => refresh()"
					/>
				</template>
			</UPopover>
		</UFieldGroup>
		<!-- Results -->
		<div v-if="loading" class="text-center py-8">
			<USkeleton class="h-20 w-full mb-4" />
			<USkeleton class="h-20 w-full mb-4" />
			<USkeleton class="h-20 w-full" />
		</div>

		<div v-else-if="results.length > 0" class="space-y-4">
			<UScrollArea
				v-slot="{ item }"
				ref="scrollViewport"
				:style="{ maxHeight: availableHeight + 'px', overflowY: 'auto' }"
				:items="results"
				:ui="{
					root: 'overscroll-contain',
					viewport: 'gap-4 p-2 ',
				}"
			>
				<UCard>
					<!-- Headword -->
					<template #header>
						<div class="flex items-center justify-between gap-2">
							<h3 class="text-lg font-semibold text-primary">
								{{ item.word }}
							</h3>
							<UBadge size="sm" color="neutral" variant="subtle">
								{{ item.dictionary }}
							</UBadge>
						</div>
					</template>

					<!-- Definition -->
					<div class="space-y-2">
						<p
							v-if="typeof item.definition === 'string'"
							class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap"
						>
							{{ item.definition }}
						</p>
						<ul
							v-else
							class="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300"
						>
							<li v-for="(def, didx) in item.definition" :key="didx">
								{{ def }}
							</li>
						</ul>
					</div>
				</UCard>
			</UScrollArea>

			<!-- Show total count -->
			<div class="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
				{{ results.length }}
				{{ results.length === 1 ? 'result' : 'results' }} found
			</div>
		</div>

		<div v-else-if="hasSearched" class="text-center py-12">
			<p class="text-gray-500 dark:text-gray-400">
				{{
					searchQuery ? `No results for "${searchQuery}"` : 'No entries found'
				}}
			</p>
		</div>

		<div v-else class="text-center py-12 text-gray-500 dark:text-gray-400">
			<p>
				{{ t('startSearching') || 'Start typing to search the dictionary...' }}
			</p>
		</div>
	</div>
</template>

<script setup lang="ts">
const { t } = useI18n({
	useScope: 'local',
})

const searchQuery = defineModel<string>({
	default: '',
})

interface DictionaryResult {
	word: string
	definition: string | string[]
	dictionary: string
}

const loading = ref(false)
const hasSearched = ref(false)

const { data: dictionaryList } = await useAsyncData(
	'dictionary-list',
	async () => {
		return queryCollection('dictionary').select('title').all()
	},
)

const availableDictionaries = computed(() => {
	return (dictionaryList.value || []).map(dict => dict.title)
})

const selectedDictionaries = ref<string[]>([])

// Load dictionary data on component mount
const { data: dictionaryData, refresh } = await useAsyncData(
	'dictionary',
	async () => {
		const allDictionaries = await queryCollection('dictionary').all()
		return allDictionaries.filter(dict => {
			if (selectedDictionaries.value.length === 0) {
				return true
			}
			return selectedDictionaries.value.includes(dict.title)
		})
	},
)

// Computed results based on search query
const results = computed<DictionaryResult[]>(() => {
	if (!searchQuery.value.trim()) {
		return []
	}

	const query = searchQuery.value.toLowerCase().trim()
	const matches: DictionaryResult[] = []

	for (const dictEntry of dictionaryData.value || []) {
		for (const [word, definition] of Object.entries(dictEntry.meta!)) {
			// Skip metadata keys (starting with _)
			if (word.startsWith('_') || word === 'title') continue

			// Check if word matches (exact or partial)
			if (word.toLowerCase().includes(query)) {
				matches.push({
					word: word,
					definition: definition as string,
					dictionary: dictEntry.title,
				})
			}
		}
	}

	return matches
})

// Perform search (debounced via component updates)
const performSearch = () => {
	loading.value = false
	hasSearched.value = searchQuery.value.trim().length > 0
}

// Dynamic scroll viewport sizing so bottom remains above browser bottom
const scrollViewport = useTemplateRef('scrollViewport')
const availableHeight = ref<number>(400)
const BOTTOM_GAP = 24 // px gap from bottom of viewport

function updateAvailableHeight() {
	if (!scrollViewport.value) return
	const rect = scrollViewport.value.$el.getBoundingClientRect()
	const avail = Math.max(120, window.innerHeight - rect.top - BOTTOM_GAP)
	availableHeight.value = avail
}

onMounted(() => {
	// initial compute
	updateAvailableHeight()
	// update on resize
	window.addEventListener('resize', updateAvailableHeight)
})

onBeforeUnmount(() => {
	window.removeEventListener('resize', updateAvailableHeight)
})

// Recompute when results change (content size may change)
watch(results, () => {
	nextTick(() => updateAvailableHeight())
})

// Also recompute when selected dictionaries change
watch(selectedDictionaries, () => {
	nextTick(() => updateAvailableHeight())
})
</script>

<i18n>
{
  "en": {
    "searchDictionary": "Search dictionary...",
    "startSearching": "Start typing to search the dictionary..."
  },
  "vi": {
    "searchDictionary": "Tìm kiếm từ điển...",
    "startSearching": "Nhập từ để tìm kiếm từ điển..."
  },
  "ja": {
    "searchDictionary": "辞書を検索...",
    "startSearching": "入力して辞書を検索してください..."
  },
  "zh": {
    "searchDictionary": "搜索字典...",
    "startSearching": "输入以搜索字典..."
  }
}
</i18n>
