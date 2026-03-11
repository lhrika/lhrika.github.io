<template>
	<UPage>
		<UPageBody>
			<!-- <OtmfcGallery /> -->
			<UPageSection
				title="动态"
				description="喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵"
				orientation="horizontal"
				:ui="{
					title: 'text-center lg:text-start',
					wrapper: 'lg:order-last',
					footer: 'hidden lg:block',
				}"
			>
				<template #footer>
					<UpdateForm />
				</template>
				<UScrollArea class="lg:max-h-80">
					<UpdateList />
				</UScrollArea>
			</UPageSection>
			<UpdateModal v-if="user" />
			<MessageBoard />
		</UPageBody>
	</UPage>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
</script>
