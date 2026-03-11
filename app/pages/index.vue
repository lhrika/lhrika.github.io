<template>
	<UPage>
		<UPageBody>
			<!-- <OtmfcGallery /> -->
			<UPageSection
				ref="updateSection"
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
			<MessageBoard />
		</UPageBody>
		<UpdateModal v-if="user && updateSectionVisible" />
	</UPage>
</template>

<script setup lang="ts">
import { useElementVisibility } from '@vueuse/core'

// Supabase user
const user = useSupabaseUser()

// Template refs
const updateSection = useTemplateRef('updateSection')

// Visibility of updateSection to show/hide FAB
const updateSectionVisible = useElementVisibility(updateSection)
</script>
