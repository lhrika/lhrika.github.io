<template>
	<UPage>
		<UPageHeader title="家計簿" class="p-4" />
		<UPageBody>
			<UContainer>
				<UScrollArea orientation="horizontal">
					<UCheckbox
						v-for="column in table?.tableApi
							?.getAllColumns()
							.filter(column => column.getCanHide() && columnLabels[column.id])"
						:key="column.id"
						:label="columnLabels[column.id]"
						variant="card"
						indicator="hidden"
						color="neutral"
						:ui="{
							root: 'shrink-0 bg-muted opacity-50 has-data-[state=checked]:opacity-100 rounded-none border-none',
						}"
						:default-value="column.getIsVisible()"
						@update:model-value="
							value => {
								column.toggleVisibility(!!value)
							}
						"
					/>
				</UScrollArea>
			</UContainer>
			<UContainer>
				<UFieldGroup>
					<UButton
						icon="i-lucide-chevrons-left"
						variant="ghost"
						color="neutral"
						@click="
							() => {
								dateRange = {
									start: dateRange.start
										.subtract({ months: 1 })
										.set({ day: 1 }),
									end: dateRange.start.subtract({ months: 1 }).set({ day: 31 }),
								}
							}
						"
					/>
					<UInputDate ref="inputDateRange" v-model="dateRange" range>
						<template #trailing>
							<UPopover :reference="inputDateRange?.inputsRef[0]?.$el">
								<UButton
									color="neutral"
									variant="link"
									size="sm"
									icon="i-lucide-calendar"
									aria-label="Select a date range"
									class="px-0"
								/>
								<template #content>
									<UCalendar
										v-model="dateRange"
										range
										variant="soft"
										class="p-2"
									/>
								</template>
							</UPopover>
						</template>
					</UInputDate>
					<UButton
						icon="i-lucide-chevrons-right"
						variant="ghost"
						color="neutral"
						@click="
							() => {
								dateRange = {
									start: dateRange.end.add({ months: 1 }).set({ day: 1 }),
									end: dateRange.end.add({ months: 1 }).set({ day: 31 }),
								}
							}
						"
					/>
				</UFieldGroup>
			</UContainer>
			<UContainer>
				<UFormField
					orientation="horizontal"
					label="グループ化"
					:ui="{
						root: 'justify-start items-center gap-4',
					}"
				>
					<UCheckboxGroup
						v-model="groupingColumns"
						orientation="horizontal"
						:items="[
							{
								label: '日付',
								value: 'date',
							},
							{
								label: 'カテゴリー',
								value: 'category',
							},
						]"
						@change="
							() => {
								if (groupingColumns.length > 0) {
									table?.tableApi.getColumn('expand')?.toggleVisibility(true)
								} else {
									table?.tableApi.getColumn('expand')?.toggleVisibility(false)
								}
							}
						"
					/>
				</UFormField>
			</UContainer>
			<UContainer>
				<UTable
					ref="table"
					sticky
					:data="kakeiboData ?? []"
					:columns="columns"
					:initial-state="{
						columnVisibility: {
							expand: false,
							date: true,
							category: true,
							amount: true,
							currency: false,
							shop: true,
							note: false,
							actions: true,
						},
						columnPinning: {
							left: ['expand'],
						},
						sorting: [{ id: 'date', desc: true }],
					}"
					:grouping-options="groupingOptions"
					:grouping="groupingColumns"
					class="flex-1 max-h-[calc(100vh-var(--ui-header-height))]"
					:ui="{
						root: 'min-w-full',
						td: 'empty:p-0', // helps with the colspaned row added for expand slot
					}"
				/>
			</UContainer>
			<UContainer>
				<UFormField label="通貨">
					<USelect
						v-model="currency"
						:items="[
							{
								label: 'JPY',
								value: 'jpy',
							},
							{
								label: 'CNY',
								value: 'cny',
							},
							{
								label: 'USD',
								value: 'usd',
							},
						]"
						@update:model-value="handleCurrencyChange"
					/>
				</UFormField>
			</UContainer>
			<UModal
				v-model:open="formModalOpen"
				:ui="{
					content: 'p-4',
				}"
				@update:open="
					open => {
						if (!open && entryState.id !== undefined) {
							initializeEntryState()
							entryState.date = new Date()
						}
					}
				"
			>
				<UButton
					icon="i-lucide-plus"
					size="lg"
					class="rounded-full p-3 fixed bottom-4 right-4 z-2000"
				>
					<UContextMenu
						:items="[
							{
								label: 'カテゴリーを追加',
								onSelect() {
									categoryFormModalOpen = true
								},
							},
						]"
					>
						<div class="absolute inset-0" />
					</UContextMenu>
				</UButton>
				<template #content>
					<UForm
						:schema="entrySchema"
						:state="entryState"
						class="space-y-4"
						@submit="submitEntry"
					>
						<UFormField
							name="date"
							label="日付"
							orientation="horizontal"
							:ui="{
								root: 'justify-start',
							}"
						>
							<UInputDate ref="inputDate" v-model="entryDate">
								<template #trailing>
									<UPopover
										v-model:open="entryDateCalendarOpen"
										:reference="inputDate?.inputsRef[3]?.$el"
									>
										<UButton
											color="neutral"
											variant="link"
											size="sm"
											icon="i-lucide-calendar"
											aria-label="Select a date"
											class="px-0"
										/>
										<template #content>
											<UCalendar
												v-model="entryDate"
												variant="soft"
												class="p-2"
												@update:model-value="entryDateCalendarOpen = false"
											/>
										</template>
									</UPopover>
								</template>
							</UInputDate>
						</UFormField>
						<UFormField name="category" label="カテゴリー">
							<UDropdownMenu
								class="w-full"
								:items="categories"
								:content="{
									align: 'start',
								}"
							>
								<UButton variant="outline" :label="categoryLabel" />
							</UDropdownMenu>
						</UFormField>
						<UFormField name="amount" label="金額">
							<UFieldGroup class="flex">
								<UInputNumber
									v-model="entryState.amount"
									:min="0"
									class="flex-1"
									:step="entryState.currency === 'JPY' ? 1 : 0.01"
									:format-options="{
										style: 'currency',
										currency: entryState.currency,
										currencyDisplay: 'symbol',
										currencySign: 'accounting',
									}"
								/>
								<USelect
									v-model="entryState.currency"
									default-value="JPY"
									:items="['JPY', 'CNY', 'USD']"
								/>
							</UFieldGroup>
						</UFormField>
						<UFormField name="shop" label="店舗">
							<UInputMenu
								v-model="entryState.shop"
								:items="shopItems"
								create-item
								class="w-full"
								@create="onCreateShopItem"
							/>
						</UFormField>
						<UFormField name="note" label="メモ">
							<UTextarea v-model="entryState.note" class="w-full" />
						</UFormField>
						<div class="flex gap-4">
							<UButton
								label="リセット"
								color="neutral"
								variant="subtle"
								@click="initializeEntryState"
							/>
							<UButton
								type="submit"
								:label="entryState.id === undefined ? '追加' : '修正'"
								class="flex-1 justify-center"
							/>
						</div>
					</UForm>
				</template>
			</UModal>
			<UModal
				v-model:open="categoryFormModalOpen"
				:ui="{
					content: 'p-4',
				}"
			>
				<template #content>
					<UForm
						:schema="categorySchema"
						:state="categoryState"
						class="space-y-4"
						@submit="submitCategory"
					>
						<UFormField name="label" label="カテゴリー名">
							<UInput v-model="categoryState.label" class="w-full" />
						</UFormField>
						<UFormField name="parent" label="親カテゴリー">
							<USelectMenu
								v-model="categoryState.parent"
								value-key="id"
								:items="categorySelectMenuItems"
								class="w-full"
							/>
						</UFormField>
						<UFormField name="order" label="表示順">
							<UInputNumber
								v-model="categoryState.order"
								:min="0"
								class="w-full"
							/>
						</UFormField>
						<div class="flex justify-end">
							<UButton type="submit" label="カテゴリー追加" />
						</div>
					</UForm>
				</template>
			</UModal>
		</UPageBody>
	</UPage>
</template>
<script setup lang="ts">
import * as z from 'zod/v4'
import { h, resolveComponent } from 'vue'
import { CalendarDate, today, getLocalTimeZone } from '@internationalized/date'
import type { DropdownMenuItem, FormSubmitEvent, TableColumn } from '@nuxt/ui'
import type { Row, GroupingOptions, Column } from '@tanstack/vue-table'
import shops from '~/assets/json/kakeiboShops.json'
import { getGroupedRowModel } from '@tanstack/vue-table'

definePageMeta({
	title: '家計簿',
})

// Supabase
const supabase = useSupabaseClient()
const user = useSupabaseUser()

// Resolve vue components
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

// Nuxt UI composable
const toast = useToast()

// Template refs
const inputDate = useTemplateRef('inputDate')
const inputDateRange = useTemplateRef('inputDateRange')
const table = useTemplateRef('table')

// Currencies and exchanges
const currency = ref<string>('')
const exchangeRates = ref<
	Record<string, Record<string, Record<string, number>>>
>({})

// Modal open states
const formModalOpen = ref(false)
const categoryFormModalOpen = ref(false)
const entryDateCalendarOpen = shallowRef(false)

// Model value of date range filter
const dateRange = shallowRef({
	start: today(getLocalTimeZone()).set({ day: 1 }),
	end: today(getLocalTimeZone()),
})

// Shop select menu items
const shopItems = ref(shops)
const onCreateShopItem = (item: string) => {
	shopItems.value.push(item)
	entryState.shop = item
}

// Kakeibo entry form schema definition
const entrySchema = z.object({
	id: z.number().optional(),
	date: z.date(),
	category: z.number().optional(),
	amount: z.number().min(0, '金額は0以上で入力してください'),
	currency: z.string(),
	shop: z.string().optional(),
	note: z.string().optional(),
})
type EntrySchema = z.output<typeof entrySchema>

// Kakeibo entry form state
const entryState = reactive<Partial<EntrySchema>>({
	date: new Date(),
	amount: 0,
	currency: 'JPY',
})
// Model value for UInputDate
const entryDate = computed({
	get() {
		if (!entryState.date) {
			return today(getLocalTimeZone())
		}
		return new CalendarDate(
			entryState.date.getFullYear(),
			entryState.date.getMonth() + 1,
			entryState.date.getDate(),
		)
	},
	set(value) {
		entryState.date = value.toDate(getLocalTimeZone())
	},
})

// Initalize entry form state without resetting date
const initializeEntryState = () => {
	entryState.id = undefined
	entryState.amount = 0
	entryState.currency = 'JPY'
	entryState.category = undefined
	entryState.note = undefined
	entryState.shop = undefined
}

// Category form schema definition
const categorySchema = z.object({
	id: z.number().optional(),
	label: z.string(),
	parent: z.number().optional(),
	order: z.number().optional(),
})
type CategorySchema = z.output<typeof categorySchema>

// Category form state
const categoryState = reactive<Partial<CategorySchema>>({})

// Fetch kakeibo category data from supabase
const { data: categoryData, refresh: refreshCategoryData } = await useAsyncData(
	'kakeibo-cateogries',
	async () => await supabase.from('kakeibo_categories').select('*').order('id'),
	{
		server: false,
		transform: res => {
			return res.data
		},
	},
)

// Label of the category select in the entry modal
const categoryLabel = computed(() => {
	const category = (categoryData.value ?? []).find(
		cat => cat.id === entryState.category,
	)
	return category ? category.label! : 'カテゴリーを選択'
})

// Category map. Key is category id
type CategoryMapItem = {
	id: number
	label: string
	order: number | null
	parent: number | null
	children: CategoryMapItem[]
}
const categoryMap = computed(() => {
	const m = new Map<number, CategoryMapItem>()
	categoryData.value?.forEach(cat => {
		m.set(cat.id, {
			...cat,
			children: [],
		})
	})
	m.forEach(item => {
		if (item.parent && m.has(item.parent)) {
			m.get(item.parent)?.children.push(item)
		}
	})
	return m
})

// Items of the category drop down menu in the entry form
const categories = computed(() => {
	const orderMaxValue = Number.MAX_SAFE_INTEGER
	const rootItems: DropdownMenuItem[] = [
		{
			label: '未分類',
			order: orderMaxValue,
			children: [],
			onSelect() {
				entryState.category = undefined
			},
		},
	]
	const buildCategoryItem = (cat: CategoryMapItem): DropdownMenuItem => ({
		label: cat.label,
		order: cat.order ?? orderMaxValue,
		onSelect() {
			if (cat.children.length < 1) {
				entryState.category = cat.id
			}
		},
		...(cat.children.length > 0 && {
			children: [
				{
					label: cat.label,
					order: orderMaxValue,
					onSelect() {
						entryState.category = cat.id
					},
				},
				...cat.children.map(buildCategoryItem),
			].toSorted(
				(a: DropdownMenuItem, b: DropdownMenuItem) => a.order - b.order,
			),
		}),
	})
	categoryMap.value.forEach(cat => {
		if (!cat.parent) {
			rootItems.push(buildCategoryItem(cat))
		}
	})
	rootItems.sort(
		(a: DropdownMenuItem, b: DropdownMenuItem) => a.order - b.order,
	)
	return rootItems
})

// Items of the category select (to select parent category) in the category form
const categorySelectMenuItems = computed(() =>
	(categoryData.value ?? []).map(cat => {
		return {
			label: cat.label,
			id: cat.id,
		}
	}),
)

// Kakeibo entries data
const { data: kakeiboData, refresh: refreshKakeiboData } = useAsyncData(
	'kakeibo',
	async () =>
		await supabase
			.from('kakeibo')
			.select('*')
			.gte('date', dateRange.value.start.toString())
			.lte('date', dateRange.value.end.toString())
			.order('date', { ascending: false }),
	{
		server: false,
		transform: res => {
			return res.data
		},
		watch: [user, dateRange],
	},
)

// Type definition of a row in the table
type Entry = {
	id: number
	date: string
	category: number | null
	amount: number
	currency: string
	shop: string | null
	note: string | null
}

// Drop down menu items of actions at the end of each table row
function getRowItems(row: Row<Entry>): DropdownMenuItem[] {
	return [
		{
			label: '編集',
			onSelect: () => {
				entryState.id = row.original.id
				entryState.date = new Date(row.original.date)
				entryState.amount = row.original.amount
				entryState.currency = row.original.currency
				entryState.category = row.original.category ?? undefined
				entryState.note = row.original.note ?? undefined
				entryState.shop = row.original.shop ?? undefined
				formModalOpen.value = true
			},
		},
		{
			label: '削除',
			onSelect: async () => {
				const { error } = await supabase
					.from('kakeibo')
					.delete()
					.eq('id', row.original.id)
				if (error) {
					console.error('エントリの削除に失敗しました:', error)
					toast.add({
						title: 'エラー',
						description: 'エントリの削除に失敗しました。',
						color: 'error',
					})
				} else {
					toast.add({
						title: '成功',
						description: 'エントリが削除されました。',
						color: 'success',
					})
					refreshKakeiboData()
				}
			},
		},
	]
}

// Total expense amount in current selected currency
const totalAmount = (column: Column<Entry>) => {
	return column.getFacetedRowModel().rows.reduce((acc, currentValue) => {
		const rate =
			(exchangeRates.value &&
			exchangeRates.value[currentValue.original.date] &&
			exchangeRates.value[currentValue.original.date]![
				currentValue.original.currency
			]
				? exchangeRates.value[currentValue.original.date]![
						currentValue.original.currency
					]![currency.value]
				: 1) ?? 1
		return acc + currentValue.original.amount * rate
	}, 0)
}

// Amount of one row in current selected currency
const amountInCurrency = (row: Row<Entry>) => {
	const rate =
		(exchangeRates.value &&
		exchangeRates.value[row.original.date] &&
		exchangeRates.value[row.original.date]![row.original.currency]
			? exchangeRates.value[row.original.date]![row.original.currency]![
					currency.value
				]
			: 1) ?? 1
	return row.original.amount * rate
}

// Labels of table columns. Key is table column accessorKey
const columnLabels: Record<string, string> = {
	date: '日付',
	category: 'カテゴリー',
	amount: '金額',
	shop: '店舗',
	note: 'メモ',
	currency: '通貨',
}

// Table columns definition
const columns: TableColumn<Entry>[] = [
	{
		id: 'expand',
		cell({ row }) {
			if (row.getIsGrouped()) {
				return h(
					'div',
					{
						class: 'flex items-center',
					},
					[
						h('span', {
							class: 'inline-block',
							style: `width: calc(${row.depth} * 1rem);`,
						}),
						h(UButton, {
							icon: row.getIsExpanded() ? 'i-lucide-minus' : 'i-lucide-plus',
							variant: 'outline',
							color: 'neutral',
							size: 'xs',
							onClick: () => {
								row.toggleExpanded()
							},
						}),
					],
				)
			}
		},
	},
	{
		id: 'date',
		accessorKey: 'date',
		header({ column }) {
			const isSorted = column.getIsSorted()
			return h(UButton, {
				label: columnLabels[column.id],
				icon: isSorted
					? isSorted === 'asc'
						? 'i-lucide-arrow-up-narrow-wide'
						: 'i-lucide-arrow-down-wide-narrow'
					: 'i-lucide-arrow-up-down',
				variant: 'ghost',
				color: 'neutral',
				ui: {
					label: 'font-bold',
				},
				onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
			})
		},
	},
	{
		id: 'category',
		accessorKey: 'category',
		header: columnLabels['category'],
		cell({ row }) {
			if (row.original.category === null) {
				return '未分類'
			}
			if (row.getIsGrouped()) {
				let item = categoryMap.value.get(row.original.category)
				while (item?.parent) {
					item = categoryMap.value.get(item.parent)
				}
				return item?.label
			}
			return categoryMap.value.get(row.original.category)?.label ?? '未分類'
		},
		getGroupingValue(row) {
			if (row.category) {
				let item = categoryMap.value.get(row.category)
				while (item?.parent) {
					item = categoryMap.value.get(item.parent)
				}
				return item?.id
			}
			return row.category
		},
	},
	{
		id: 'amount',
		accessorKey: 'amount',
		header: columnLabels['amount'],
		cell({ row, column }) {
			if (row.getIsGrouped()) {
				const amount = row.getLeafRows().reduce((acc, currentValue) => {
					return acc + amountInCurrency(currentValue)
				}, 0)
				const total = totalAmount(column)
				return `${parseFloat(amount.toFixed(2))} (${parseFloat(((amount / total) * 100).toFixed(2))}%)`
			}
			const amount = amountInCurrency(row)
			return parseFloat(amount.toFixed(2))
		},
		footer({ column }) {
			const amount = totalAmount(column)
			return parseFloat(amount.toFixed(2))
		},
	},
	{
		id: 'currency',
		accessorKey: 'currency',
		header: columnLabels['currency'],
	},
	{
		id: 'shop',
		accessorKey: 'shop',
		header: columnLabels['shop'],
	},
	{
		id: 'note',
		accessorKey: 'note',
		header: columnLabels['note'],
	},
	{
		id: 'actions',
		enableHiding: false,
		cell: ({ row }) => {
			if (row.getIsGrouped()) {
				return
			}
			return h(
				UDropdownMenu,
				{
					content: {
						align: 'end',
					},
					items: getRowItems(row),
				},
				() =>
					h(UButton, {
						icon: 'i-lucide-ellipsis-vertical',
						color: 'neutral',
						variant: 'ghost',
						'aria-label': 'Actions dropdown',
					}),
			)
		},
	},
]

// Event handler on submitting entry form
const submitEntry = async (event: FormSubmitEvent<EntrySchema>) => {
	event.preventDefault()
	const entryData = event.data
	if (!user.value) {
		alert('ログインが必要です。')
		return
	}
	const { error } = await supabase
		.from('kakeibo')
		.upsert({
			id: entryData.id,
			date: entryData.date.toDateString(),
			category: entryData.category,
			amount: entryData.amount,
			currency: entryData.currency,
			shop: entryData.shop,
			note: entryData.note,
		})
		.select()
	if (error) {
		console.error('エントリの追加に失敗しました:', error)
		alert('エントリの追加に失敗しました。')
	} else {
		toast.add({
			title: '成功',
			description: 'エントリが追加されました。',
			color: 'success',
			duration: 300,
		})
		formModalOpen.value = false
		// フォームをリセット
		initializeEntryState()
		// データを再取得
		refreshKakeiboData()
	}
}

// Event handler on submitting category form
const submitCategory = async (event: FormSubmitEvent<CategorySchema>) => {
	event.preventDefault()
	const categoryData = event.data
	if (!user.value) {
		alert('ログインが必要です。')
		return
	}
	const { error } = await supabase
		.from('kakeibo_categories')
		.upsert({
			id: categoryData.id,
			label: categoryData.label,
			parent: categoryData.parent,
			order: categoryData.order,
		})
		.select()
	if (error) {
		console.error('カテゴリーの追加に失敗しました:', error)
		alert('カテゴリーの追加に失敗しました。')
	} else {
		toast.add({
			title: '成功',
			description: 'カテゴリーが追加されました。',
			color: 'success',
		})
		categoryFormModalOpen.value = false
		// フォームをリセット
		categoryState.label = undefined
		categoryState.parent = undefined
		categoryState.order = undefined
		// データを再取得
		refreshCategoryData()
	}
}

// Grouping settings
const groupingOptions = ref<GroupingOptions>({
	groupedColumnMode: 'reorder',
	getGroupedRowModel: getGroupedRowModel(),
})
const groupingColumns = shallowRef<string[]>([])

// Fetch exchange rates from currency API when selected currency changes
const handleCurrencyChange = async () => {
	const dates = kakeiboData.value?.map(row => row.date)
	const currencies = kakeiboData.value?.map(row => row.currency.toLowerCase())
	if (!exchangeRates.value) {
		exchangeRates.value = {}
	}
	dates?.forEach(async date => {
		for (const cur of currencies ?? []) {
			if (!exchangeRates.value[date] || !exchangeRates.value[date][cur]) {
				const endpoint = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/${cur}.json`
				const data = (await $fetch(endpoint)) as Record<
					string,
					string | Record<string, string>
				>
				if (!exchangeRates.value[date]) {
					exchangeRates.value[date] = {}
				}
				exchangeRates.value[date][cur.toUpperCase()] = data[
					cur
				] as unknown as Record<string, number>
			}
		}
	})
}
</script>
