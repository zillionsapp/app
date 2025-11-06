<template>
  <div v-if="modelValue" class="modal modal-open">
    <div class="modal-box max-w-2xl bg-base-100">
      <h3 class="text-2xl font-bold mb-6 text-base-content">Privacy Policy</h3>
      
      <div class="space-y-6 text-base-content/80">
        <p class="text-sm text-base-content/60 italic">Last updated: August 21, 2025</p>

        <div class="space-y-4">
          <h4 class="text-lg font-semibold text-base-content border-b border-base-300/40 pb-2">Information We Collect</h4>
          <p class="leading-relaxed hover:text-base-content transition-colors duration-200">
            When you join our waitlist, we collect your email address to keep you updated about Zillions's development and launch. 
            We may also collect anonymous usage data to improve our service.
          </p>
        </div>

        <div class="space-y-4">
          <h4 class="text-lg font-semibold text-base-content border-b border-base-300/40 pb-2">How We Use Your Information</h4>
          <ul class="list-disc pl-5 space-y-2">
            <li class="hover:text-base-content transition-colors duration-200">To communicate updates about Zillions</li>
            <li class="hover:text-base-content transition-colors duration-200">To provide early access opportunities</li>
            <li class="hover:text-base-content transition-colors duration-200">To improve our service and user experience</li>
            <li class="hover:text-base-content transition-colors duration-200">To send important announcements and updates</li>
          </ul>
        </div>

        <div class="space-y-4">
          <h4 class="text-lg font-semibold text-base-content border-b border-base-300/40 pb-2">Data Security</h4>
          <p class="leading-relaxed hover:text-base-content transition-colors duration-200">
            We implement appropriate security measures to protect your personal information. 
            However, no method of transmission over the internet is 100% secure.
          </p>
        </div>

        <div class="space-y-4">
          <h4 class="text-lg font-semibold text-base-content border-b border-base-300/40 pb-2">Third-Party Services</h4>
          <p class="leading-relaxed hover:text-base-content transition-colors duration-200">
            We may use third-party services to help operate our service and communicate with you. 
            These services have their own privacy policies.
          </p>
        </div>

        <div class="space-y-4">
          <h4 class="text-lg font-semibold text-base-content border-b border-base-300/40 pb-2">Your Rights</h4>
          <p class="leading-relaxed hover:text-base-content transition-colors duration-200">
            You can unsubscribe from our communications at any time. 
            You may also request to delete your data from our systems.
          </p>
        </div>

        <div class="space-y-4">
          <h4 class="text-lg font-semibold text-base-content border-b border-base-300/40 pb-2">Updates to This Policy</h4>
          <p class="leading-relaxed hover:text-base-content transition-colors duration-200">
            We may update this privacy policy from time to time. 
            We will notify you of any changes by posting the new policy on this page.
          </p>
        </div>

<!--         <div class="space-y-4">
          <h4 class="text-lg font-semibold text-base-content border-b border-base-300/40 pb-2">Contact Us</h4>
          <p class="leading-relaxed hover:text-base-content transition-colors duration-200">
            If you have questions about this privacy policy, please contact us at 
            <a href="mailto:privacy@Zillions" class="text-primary hover:underline">privacy@Zillions</a>
          </p>
        </div> -->
      </div>

      <div class="modal-action mt-8">
        <button class="btn btn-primary" @click="$emit('update:modelValue', false)">Close</button>
      </div>
    </div>
    <div class="modal-backdrop" @click="$emit('update:modelValue', false)">
      <button class="sr-only">Close modal</button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean
}>()

defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()
</script>
