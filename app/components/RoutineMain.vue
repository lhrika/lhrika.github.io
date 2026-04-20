<script setup lang="ts">
const { routineId: id } = defineProps<{
	routineId: string
}>()
const store = useRoutineStore()

const { data, refresh } = useAsyncData(
	() => `routine-${id}`,
	() => queryCollection('routine').where('id', '=', id).first(),
	{
		watch: [() => id],
	},
)
watch(
	() => id,
	() => {
		console.log(id)
	},
)

const carouselRef = useTemplateRef('carousel')
const scrollTo = (index: number) => {
	carouselRef.value?.emblaApi?.scrollTo(index)
}

const getPeriodStart = (
	time: Temporal.Instant,
	start: Temporal.Instant,
	duration: Temporal.Duration,
) => {
	const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
	let periodStart = start.toZonedDateTimeISO(timezone)
	let periodEnd = periodStart.add(duration)
	while (Temporal.Instant.compare(periodEnd, time) < 0) {
		periodStart = periodStart.add(duration)
		periodEnd = periodStart.add(duration)
	}
	return periodStart.toInstant()
}

const parseInstant = (s: string) => {
	if (s.includes('Z') || s.includes('+')) {
		return Temporal.Instant.from(s)
	}
	const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
	if (!s.includes('T')) {
		if (s.includes('-')) {
			const d = Temporal.PlainDate.from(s)
			return d.toZonedDateTime(timezone).toInstant()
		} else {
			const t = Temporal.PlainTime.from(s)
			const now = Temporal.Now.zonedDateTimeISO(timezone)
			if (Temporal.PlainTime.compare(now.toPlainTime(), t) > 0) {
				return now.withPlainTime(t).toInstant()
			} else {
				return now.subtract({ days: 1 }).withPlainTime(t).toInstant()
			}
		}
	}
	return Temporal.PlainDateTime.from(s).toZonedDateTime(timezone).toInstant()
}

const shouldReset = (startAt: string, duration: string, resetAt: number) => {
	const start = parseInstant(startAt)
	const dur = Temporal.Duration.from(duration)
	const now = Temporal.Now.instant()
	const resetTime = Temporal.Instant.fromEpochMilliseconds(resetAt)
	const currentPeriodStart = getPeriodStart(now, start, dur)
	return Temporal.Instant.compare(resetTime, currentPeriodStart) < 0
}

watch(data, value => {
	if (value) {
		scrollTo(0)
		if (
			value.repeat &&
			shouldReset(
				value.startAt ?? '00:00:00',
				typeof value.repeat === 'boolean' ? 'P1D' : value.repeat,
				store.getResetAt(id),
			)
		) {
			onReset()
		}
	}
})

const scrollToNext = (index: number) => {
	const nextIndex = store.getNextIndex(id, index, data.value?.items.length ?? 0)
	if (nextIndex >= 0) {
		scrollTo(nextIndex)
	}
}
const onCheckItem = (index: number) => {
	store.setStatus(id, index, 'done')
	scrollToNext(index)
}
const onUncheckItem = (index: number) => {
	store.setStatus(id, index, 'todo')
}
const onDisableItem = (index: number) => {
	store.setStatus(id, index, 'disabled')
}
const onEnableItem = (index: number) => {
	store.setStatus(id, index, 'todo')
}
const onReset = () => {
	console.log('[onReset]', id)
	store.reset(id)
	scrollTo(0)
}
</script>
<template>
	<div v-if="data" class="flex flex-col gap-4">
		<UCarousel
			ref="carousel"
			v-slot="{ item, index }"
			orientation="vertical"
			:align="'start'"
			class-names
			:items="data.items"
			:contain-scroll="false"
			:ui="{
				container: 'max-h-80',
				item: 'basis-auto w-full',
			}"
		>
			<RoutineItem
				:index="index"
				:title="item.title"
				:description="item.description"
				:status="store.getStatus(routineId, index)"
				@check="onCheckItem"
				@uncheck="onUncheckItem"
				@disable="onDisableItem"
				@enable="onEnableItem"
			/>
		</UCarousel>
		<div class="flex justify-end">
			<UButton
				icon="i-lucide-rotate-ccw"
				label="Reset"
				color="neutral"
				variant="subtle"
				@click="onReset"
			/>
		</div>
	</div>
</template>
