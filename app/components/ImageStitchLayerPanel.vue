<template>
	<div class="w-48 border border-muted rounded-lg bg-elevated flex flex-col">
		<div class="px-3 py-2 text-sm font-bold border-b border-muted flex items-center justify-between">
			<span>图层 ({{ selectedIds.length > 0 ? `${selectedIds.length}/` : '' }}{{ sortedImages.length }})</span>
			<UTooltip :text="allSelected ? '取消全选' : '全选'">
				<UCheckbox
					:model-value="allSelected"
					:indeterminate="someSelected"
					size="sm"
					@update:model-value="allSelected ? emit('deselectAll') : emit('selectAll')"
				/>
			</UTooltip>
		</div>

		<!-- List (highest z first) -->
		<div
			class="flex-1 overflow-y-auto"
			@dragover.prevent
			@drop.prevent="onDrop($event, null)"
		>
			<div
				v-for="img in [...sortedImages].reverse()"
				:key="img.id"
				draggable="true"
				class="flex items-center gap-1 px-2 py-1.5 text-xs cursor-grab hover:bg-primary/20 transition-colors border-t-2 border-transparent"
				:class="{
					'bg-primary/10': selectedIds.includes(img.id),
					'border-t-primary!': dragOver === img.id && dragPos === 'before',
					'border-b-primary! border-b-2':
						dragOver === img.id && dragPos === 'after',
					'opacity-40': dragging === img.id,
				}"
				@click.stop="emit('select', $event, img.id)"
				@dragstart="onDragStart($event, img.id)"
				@dragend="onDragEnd"
				@dragover.prevent="onDragOver($event, img.id)"
				@dragleave="onDragLeave(img.id)"
				@drop.prevent.stop="onDrop($event, img.id)"
			>
				<Icon
					name="i-lucide-grip-vertical"
					class="size-3 text-muted shrink-0"
				/>
				<img :src="img.src" class="w-7 h-7 object-cover rounded shrink-0" />
				<input
					v-if="renamingId === img.id"
					:ref="el => { if (el) renameInput = el as HTMLInputElement }"
					v-model="renameValue"
					class="flex-1 min-w-0 bg-transparent border-b border-primary outline-none text-xs"
					@keydown.enter="onRenameEnter"
					@keydown.escape="cancelRename"
					@compositionstart="isComposing = true"
					@compositionend="isComposing = false"
					@blur="commitRename"
					@click.stop
					@mousedown.stop
				/>
				<span
					v-else
					class="flex-1 truncate text-muted"
					@dblclick.stop="startRename(img.id, img.name)"
				>{{ img.name }}</span>
				<UIcon
					v-if="img.groupId"
					name="i-lucide-group"
					class="size-3 text-amber-500 shrink-0"
				/>
			</div>
		</div>

		<div class="px-2 py-1.5 border-t border-muted flex gap-1 justify-center">
			<UFieldGroup size="xs">
				<UTooltip text="上移一层">
					<UButton
						icon="i-lucide-chevron-up"
						color="neutral"
						variant="subtle"
						:disabled="
							!singleSelected || singleSelected.zIndex >= sortedImages.length
						"
						@click="singleSelected && emit('moveLayer', singleSelected.id, 1)"
					/>
				</UTooltip>
				<UTooltip text="下移一层">
					<UButton
						icon="i-lucide-chevron-down"
						color="neutral"
						variant="subtle"
						:disabled="!singleSelected || singleSelected.zIndex <= 1"
						@click="singleSelected && emit('moveLayer', singleSelected.id, -1)"
					/>
				</UTooltip>
				<UTooltip text="置顶">
					<UButton
						icon="i-lucide-bring-to-front"
						color="neutral"
						variant="subtle"
						:disabled="
							!singleSelected || singleSelected.zIndex >= sortedImages.length
						"
						@click="
							singleSelected &&
							emit('moveLayerToEdge', singleSelected.id, 'top')
						"
					/>
				</UTooltip>
				<UTooltip text="置底">
					<UButton
						icon="i-lucide-send-to-back"
						color="neutral"
						variant="subtle"
						:disabled="!singleSelected || singleSelected.zIndex <= 1"
						@click="
							singleSelected &&
							emit('moveLayerToEdge', singleSelected.id, 'bottom')
						"
					/>
				</UTooltip>
			</UFieldGroup>
			<UTooltip text="删除选中">
				<UButton
					icon="i-lucide-trash-2"
					size="xs"
					color="error"
					variant="subtle"
					:disabled="selectedIds.length === 0"
					@click="emit('removeSelected')"
				/>
			</UTooltip>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { StitchImage } from '~/composables/useImageStitch'

const props = defineProps<{
	sortedImages: StitchImage[]
	selectedIds: string[]
	singleSelected: StitchImage | undefined
}>()

const emit = defineEmits<{
	select: [e: MouseEvent, id: string]
	moveLayer: [id: string, delta: number]
	moveLayerToEdge: [id: string, edge: 'top' | 'bottom']
	removeSelected: []
	reorder: [orderedIds: string[]]
	rename: [id: string, name: string]
	selectAll: []
	deselectAll: []
}>()

const allSelected = computed(
	() =>
		props.sortedImages.length > 0 &&
		props.sortedImages.every(i => props.selectedIds.includes(i.id)),
)
const someSelected = computed(
	() => !allSelected.value && props.selectedIds.length > 0,
)

// ---- Inline rename ----
const renamingId = ref<string | null>(null)
const renameValue = ref('')
const isComposing = ref(false)
let renameInput: HTMLInputElement | null = null

function startRename(id: string, currentName: string) {
	renamingId.value = id
	renameValue.value = currentName
	nextTick(() => {
		renameInput?.select()
	})
}

function onRenameEnter() {
	if (isComposing.value) return
	commitRename()
}

function commitRename() {
	if (renamingId.value) {
		emit('rename', renamingId.value, renameValue.value)
		renamingId.value = null
	}
}

function cancelRename() {
	renamingId.value = null
}

// ---- Drag to reorder ----
// List is rendered highest-z first; "before" = higher z, "after" = lower z
const dragging = ref<string | null>(null)
const dragOver = ref<string | null>(null)
const dragPos = ref<'before' | 'after'>('before')

function onDragStart(e: DragEvent, id: string) {
	dragging.value = id
	e.dataTransfer!.effectAllowed = 'move'
}

function onDragEnd() {
	dragging.value = null
	dragOver.value = null
}

function onDragOver(e: DragEvent, id: string) {
	if (dragging.value === id) return
	dragOver.value = id
	const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
	dragPos.value = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
}

function onDragLeave(id: string) {
	if (dragOver.value === id) dragOver.value = null
}

function onDrop(_e: DragEvent, targetId: string | null) {
	const srcId = dragging.value
	dragging.value = null
	dragOver.value = null
	if (!srcId || srcId === targetId) return

	const ordered = [...props.sortedImages].reverse()
	const srcIdx = ordered.findIndex(i => i.id === srcId)
	if (srcIdx === -1) return

	const srcImg = ordered.splice(srcIdx, 1)[0]
	if (!srcImg) return

	if (targetId === null) {
		ordered.push(srcImg)
	} else {
		const tgtIdx = ordered.findIndex(i => i.id === targetId)
		if (tgtIdx === -1) return
		const insertIdx = dragPos.value === 'before' ? tgtIdx : tgtIdx + 1
		ordered.splice(insertIdx, 0, srcImg)
	}

	emit(
		'reorder',
		ordered.map(i => i.id),
	)
}
</script>
