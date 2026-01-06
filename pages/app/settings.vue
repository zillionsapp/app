<script setup lang="ts">
definePageMeta({
  layout: 'app',
  middleware: 'auth'
})
</script>

<template>
  <!-- General Settings -->
  <section class="card col-span-12 bg-base-100 rounded-box xl:col-span-6">
    <div class="card-body">
      <h2 class="card-title">{{ $t('app.settings.general_preferences') }}</h2>
      <div class="divider"></div>

      <div class="form-control">
        <label class="label cursor-pointer">
          <span class="label-text">{{ $t('app.settings.email_notifications') }}</span>
          <input type="checkbox" :checked="true" class="checkbox checkbox-primary" />
        </label>
        <label class="label-text-alt ml-1 opacity-70">{{ $t('app.settings.email_notifications_desc') }}</label>
      </div>

       <div class="form-control mt-4">
        <label class="label cursor-pointer">
          <span class="label-text">{{ $t('app.settings.marketing_emails') }}</span>
          <input type="checkbox" class="checkbox checkbox-primary" />
        </label>
      </div>
    </div>
  </section>

  <!-- Security Settings -->
  <section class="card col-span-12 bg-base-100 rounded-box xl:col-span-6">
    <div class="card-body">
      <h2 class="card-title">{{ $t('app.settings.security') }}</h2>
      <div class="divider"></div>
       <div class="flex flex-col gap-4">
            <NuxtLink to="/update-password" class="btn btn-outline btn-warning w-fit">{{ $t('app.settings.change_pass') }}</NuxtLink>
       </div>
    </div>
  </section>
</template>
