<script setup lang="ts">
defineProps<{
	businessHours: string
	address: string
	postcode: number
	fee: string | number
	parking: boolean | string
}>()
</script>

<template>
	<table class="spot-info">
		<tbody>
			<tr>
				<th>住所</th>
				<td>〒{{ postcode }}<br />{{ address }}</td>
			</tr>
			<tr>
				<th>営業時間</th>
				<td>{{ businessHours }}</td>
			</tr>
			<tr>
				<th>料金</th>
				<td>{{ typeof fee === 'string' ? fee : fee ? `${fee}円` : '無料' }}</td>
			</tr>
			<tr>
				<th>駐車場</th>
				<td>
					{{
						typeof parking === 'string' ? parking : parking ? '無料' : 'なし'
					}}
				</td>
			</tr>
		</tbody>
	</table>
</template>

<style>
@reference '~/assets/css/main.css';
.spot-info {
	@apply border border-accented border-collapse;
	th {
		@apply border border-accented p-2 text-nowrap font-bold;
	}
	td {
		@apply border border-accented p-2;
	}
}
</style>
