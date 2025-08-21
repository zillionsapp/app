<template>
  <div v-if="modelValue" class="modal modal-open">
    <div class="modal-box max-w-2xl bg-base-100">
      <h3 class="text-2xl font-bold mb-6 text-base-content">Terms of Service</h3>
      
      <div class="space-y-6 text-base-content/80">
        <p class="text-sm text-base-content/60 italic">Last updated: August 21, 2025</p>

        <div class="space-y-4">
          <h4 class="text-lg font-semibold text-base-content border-b border-base-300/40 pb-2">Agreement to Terms</h4>
          <p class="leading-relaxed hover:text-base-content transition-colors duration-200">
            By accessing our waitlist or using our service, you agree to these Terms of Service. 
            If you disagree with any part of the terms, you may not access the service.
          </p>
        </div>

        <div class="space-y-4">
          <h4 class="text-lg font-semibold text-base-content border-b border-base-300/40 pb-2">Waitlist Service</h4>
          <p class="leading-relaxed mb-2 hover:text-base-content transition-colors duration-200">By joining our waitlist:</p>
          <ul class="list-disc pl-5 space-y-2">
            <li class="hover:text-base-content transition-colors duration-200">You agree to receive updates about Zillions.ai</li>
            <li class="hover:text-base-content transition-colors duration-200">You understand this does not guarantee access to the service</li>
            <li class="hover:text-base-content transition-colors duration-200">You acknowledge this is not an offer of securities or investment advice</li>
          </ul>
        </div>

        <div class="space-y-4">
          <h4 class="text-lg font-semibold text-base-content border-b border-base-300/40 pb-2">Risk Disclosure</h4>
          <p class="leading-relaxed mb-2 hover:text-base-content transition-colors duration-200">
            Trading cryptocurrencies involves substantial risk of loss and is not suitable for all investors. You should:
          </p>
          <ul class="list-disc pl-5 space-y-2">
            <li class="hover:text-base-content transition-colors duration-200">Never trade more than you can afford to lose</li>
            <li class="hover:text-base-content transition-colors duration-200">Understand that past performance does not guarantee future results</li>
            <li class="hover:text-base-content transition-colors duration-200">Be aware that automated trading systems are subject to various risks</li>
          </ul>
        </div>

        <div class="space-y-4">
          <h4 class="text-lg font-semibold text-base-content border-b border-base-300/40 pb-2">No Investment Advice</h4>
          <p class="leading-relaxed hover:text-base-content transition-colors duration-200">
            Zillions.ai provides automated trading technology. We do not provide personalized investment advice. 
            All trading decisions are made by our autonomous system based on predefined parameters.
          </p>
        </div>

        <div class="space-y-4">
          <h4 class="text-lg font-semibold text-base-content border-b border-base-300/40 pb-2">Service Availability</h4>
          <p class="leading-relaxed hover:text-base-content transition-colors duration-200">
            We aim to maintain high availability but cannot guarantee uninterrupted access to our service. 
            We reserve the right to modify, suspend, or discontinue any part of our service without notice.
          </p>
        </div>

        <div class="space-y-4">
          <h4 class="text-lg font-semibold text-base-content border-b border-base-300/40 pb-2">Intellectual Property</h4>
          <p class="leading-relaxed hover:text-base-content transition-colors duration-200">
            The Zillions.ai service, including all content and technology, is protected by copyright, trademark, and other laws. 
            Our trademarks and trade dress may not be used without our prior written permission.
          </p>
        </div>

        <div class="space-y-4">
          <h4 class="text-lg font-semibold text-base-content border-b border-base-300/40 pb-2">Limitation of Liability</h4>
          <p class="leading-relaxed hover:text-base-content transition-colors duration-200">
            To the maximum extent permitted by law, Zillions.ai shall not be liable for any indirect, incidental, special, 
            consequential, or punitive damages resulting from your use or inability to use the service.
          </p>
        </div>

        <div class="space-y-4">
          <h4 class="text-lg font-semibold text-base-content border-b border-base-300/40 pb-2">Changes to Terms</h4>
          <p class="leading-relaxed hover:text-base-content transition-colors duration-200">
            We reserve the right to modify these terms at any time. 
            We will notify users of any material changes via email or through our service.
          </p>
        </div>

<!--         <div class="space-y-4">
          <h4 class="text-lg font-semibold text-base-content border-b border-base-300/40 pb-2">Contact Us</h4>
          <p class="leading-relaxed hover:text-base-content transition-colors duration-200">
            If you have questions about these terms, please contact us at 
            <a href="mailto:legal@zillions.ai" class="text-primary hover:underline">legal@zillions.ai</a>
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
