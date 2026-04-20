<script setup lang="ts">
const { data: routineTitles } = useAsyncData('routine-titles', () =>
	queryCollection('routine').select('title', 'id').all(),
)

const selectValue = ref('')
const selectModel = computed({
	get() {
		if (selectValue.value) return selectValue.value
		if (routineTitles.value) {
			return routineTitles.value[0]?.id ?? ''
		}
		return ''
	},
	set(value) {
		selectValue.value = value
	},
})

const selectItems = computed(() => {
	if (!routineTitles.value) return []
	return routineTitles.value?.map(item => {
		return {
			label: item.title,
			value: item.id,
		}
	})
})
</script>
<template>
	<div class="flex flex-col gap-4">
		<RoutineSelect v-model="selectModel" :items="selectItems" />
		<RoutineMain :routine-id="selectModel" />
	</div>
</template>
