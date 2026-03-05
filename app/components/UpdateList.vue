<template>
	<UContainer class="space-y-4">
		<div class="space-y-4">
			<UpdateItem
				v-for="(update, index) in updates"
				:key="index"
				:content="update.content"
				:at="update.at"
				:user="update.user"
			/>
		</div>
		<UButton
			class="flex mx-auto"
			icon="i-lucide-arrow-big-down-dash"
			label="Load more"
			variant="outline"
			:loading="loading"
			:disabled="localState.done && remoteState.done"
			@click="loadMore"
		/>
	</UContainer>
</template>
<script setup lang="ts">
const supabase = useSupabaseClient()
const itemsPerChunk = 2
const restItemsToLoad = ref(0)
const remoteState = reactive({
	done: false,
	count: 0,
})
const localState = reactive({
	done: false,
	count: 0,
})
const startTime = ref(Date.now())

type Update = {
	content: string
	at: string
	user: string
}

const loadedItems = ref<Update[]>([])

const { data: localUpdates, ...localUpdatesData } = useAsyncData(
	'local-updates',
	() => {
		return queryCollection('updates')
			.select('at', 'content', 'user')
			.order('at', 'DESC')
			.skip(localState.count)
			.limit(restItemsToLoad.value)
			.all()
	},
	{
		transform: data => {
			if (!data) return []
			return data as Update[]
		},
		immediate: false,
	},
)
const { data: remoteUpdates, ...remoteUpdatesData } = useAsyncData(
	'remote-updates',
	async () => {
		return await supabase
			.from('updates')
			.select('*')
			.range(remoteState.count, remoteState.count + restItemsToLoad.value - 1)
			.order('created_at', { ascending: false })
	},
	{
		transform: ({ data }) => {
			if (!data) return []
			return data.map(item => ({
				content: item.content,
				at: item.created_at,
				user: item.user_id,
			})) as Update[]
		},
		immediate: false,
	},
)

const { data: latestUpdates } = useAsyncData(
	'latest-updates',
	async () => {
		if (remoteUpdatesData.status.value === 'idle') {
			return
		}
		return await supabase
			.from('updates')
			.select('*')
			.order('created_at', { ascending: false })
			.gt(
				'created_at',
				loadedItems.value.length > 0
					? loadedItems.value[0]!.at
					: new Date(startTime.value).toISOString(),
			)
	},
	{
		transform: data => {
			if (!data || !data.data) return []
			return data.data.map(item => ({
				content: item.content,
				at: item.created_at,
				user: item.user_id,
			})) as Update[]
		},
		immediate: true,
	},
)

watch(latestUpdates, newUpdates => {
	if (newUpdates && newUpdates.length > 0) {
		// Prepend new updates to the list
		loadedItems.value.unshift(...newUpdates)
		remoteState.count += newUpdates.length
	}
})

const loading = computed(() => {
	return (
		localUpdatesData.status.value === 'pending' ||
		remoteUpdatesData.status.value === 'pending'
	)
})

const loadMore = async () => {
	if (remoteState.done && localState.done) {
		return
	}
	restItemsToLoad.value = itemsPerChunk
	if (!remoteState.done) {
		if (remoteUpdatesData.status.value === 'idle') {
			startTime.value = Date.now()
			await remoteUpdatesData.execute()
		} else {
			await remoteUpdatesData.refresh()
		}
		if (
			!remoteUpdates.value ||
			remoteUpdates.value.length < restItemsToLoad.value
		) {
			remoteState.done = true
		}
		if (remoteUpdates.value) {
			loadedItems.value.push(...remoteUpdates.value)
			remoteState.count += remoteUpdates.value.length
			restItemsToLoad.value -= remoteUpdates.value?.length ?? 0
		}
	}
	if (!localState.done && restItemsToLoad.value > 0) {
		if (localUpdatesData.status.value === 'idle') {
			await localUpdatesData.execute()
		} else {
			await localUpdatesData.refresh()
		}
		if (
			!localUpdates.value ||
			localUpdates.value.length < restItemsToLoad.value
		) {
			localState.done = true
		}
		if (localUpdates.value) {
			loadedItems.value.push(...localUpdates.value)
			localState.count += localUpdates.value.length
			restItemsToLoad.value -= localUpdates.value?.length ?? 0
		}
	}
}
const updates = computed(() => {
	return loadedItems.value
})

onMounted(() => {
	loadMore()
})
</script>
