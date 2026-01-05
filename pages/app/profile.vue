<script setup lang="ts">
definePageMeta({
  layout: 'app',
  middleware: 'auth'
})

const user = useSupabaseUser()
</script>

<template>
  <section class="card col-span-12 bg-base-100 rounded-box xl:col-span-8">
    <div class="card-body">
        <div class="flex items-center gap-4 mb-6">
             <div class="avatar placeholder">
                <div class="bg-neutral text-neutral-content rounded-full w-24 text-3xl">
                <span v-if="user?.email">{{ user.email?.[0]?.toUpperCase() }}</span>
                <span v-else>U</span>
                </div>
            </div>
            <div>
                <h2 class="text-2xl font-bold">{{ user?.email?.split('@')[0] || 'User' }}</h2>
                <p class="opacity-70">{{ $t('member_since') }}</p>
            </div>
        </div>

        <div class="divider"></div>

        <form>
            <div class="form-control w-full">
                <label class="label">
                    <span class="label-text">{{ $t('email_address') }}</span>
                </label>
                <input type="text" :value="user?.email" disabled class="input input-bordered w-full" />
                <label class="label">
                    <span class="label-text-alt text-warning">{{ $t('email_cannot_change') }}</span>
                </label>
            </div>

            <div class="form-control w-full mt-4">
                <label class="label">
                    <span class="label-text">{{ $t('full_name') }}</span>
                </label>
                <input type="text" :placeholder="$t('full_name')" class="input input-bordered w-full" />
            </div>

             <div class="form-control w-full mt-4">
                <label class="label">
                    <span class="label-text">{{ $t('job_title') }}</span>
                </label>
                <input type="text" :placeholder="$t('job_title')" class="input input-bordered w-full" />
            </div>

            <div class="mt-8 flex justify-end">
                <button class="btn btn-primary" type="button" onclick="alert('Profile Updated!')">{{ $t('save_changes') }}</button>
            </div>
        </form>
    </div>
  </section>
</template>
