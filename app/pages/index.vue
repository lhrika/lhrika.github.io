<template>
	<UPage>
		<UPageBody>
			<!-- <OtmfcGallery /> -->
			<UPageSection
				title="动态"
				description="喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵"
			/>
			<UpdateList />
			<UpdateModal v-if="user" />
			<MessageBoard />
		</UPageBody>
	</UPage>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
</script>
