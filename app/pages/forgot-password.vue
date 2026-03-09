<template>
  <div>
    <div class="mb-4">
      <button
        type="button"
        class="text-sm font-medium text-primary"
        @click="navigateTo('/login')"
      >
        ← Back to login
      </button>
    </div>

    <div class="mb-6 text-center">
      <div class="text-4xl">🍳</div>
      <div class="mt-2 text-2xl font-bold text-primary">Tap Tamak</div>
    </div>

    <div class="space-y-6 rounded-2xl bg-white p-6 shadow-card md:p-8">
      <div v-if="state === 'request'" class="space-y-6">
        <div class="space-y-1 text-center">
          <h1 class="text-lg font-semibold text-dark">Reset password</h1>
          <p class="text-sm text-muted">
            Enter your phone or email and we'll send you a reset link.
          </p>
        </div>

        <UiInput
          label="Phone or email"
          placeholder="+7 ___ ___-__-__ or name@example.com"
          v-model="values.identifier"
          :error="errors.identifier"
        />

        <div class="space-y-3">
          <UiButton
            variant="primary"
            fullWidth
            :loading="isSubmitting"
            :disabled="isSubmitting"
            @click="onSubmit"
          >
            Send reset link
          </UiButton>

          <p v-if="apiError" class="text-center text-sm text-red-500">
            {{ apiError }}
          </p>
        </div>
      </div>

      <div v-else class="space-y-6 text-center">
        <div class="flex justify-center">
          <div
            class="flex size-16 items-center justify-center rounded-full bg-primary-light text-3xl text-success"
          >
            ✅
          </div>
        </div>

        <div class="space-y-1">
          <h1 class="text-lg font-semibold text-dark">Check your messages</h1>
          <p class="text-sm text-muted">
            We sent a reset link to
            <span class="font-medium text-dark">{{ lastIdentifier }}</span>.
          </p>
        </div>

        <div class="space-y-3">
          <UiButton variant="primary" fullWidth @click="navigateTo('/login')">
            ← Back to login
          </UiButton>

          <div class="text-sm text-muted">
            <p>Didn't receive it?</p>
            <button
              v-if="resendCooldown === 0"
              type="button"
              class="mt-1 font-medium text-primary"
              :disabled="isSubmitting"
              @click="onResend"
            >
              Resend
            </button>
            <p v-else class="mt-1">Resend in {{ resendCooldown }}s</p>
          </div>

          <p v-if="apiError" class="text-center text-sm text-red-500">
            {{ apiError }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

const forgotSchema = toTypedSchema(
  z.object({
    identifier: z.string().min(1, 'Phone or email is required'),
  }),
)

const { handleSubmit, errors, values, isSubmitting } = useForm<
  z.infer<typeof forgotSchema>
>({
  validationSchema: forgotSchema,
  initialValues: {
    identifier: '',
  },
})

type State = 'request' | 'sent'

const state = ref<State>('request')
const lastIdentifier = ref('')
const resendCooldown = ref(0)
const apiError = ref<string | null>(null)
let timer: ReturnType<typeof setInterval> | null = null

const submit = handleSubmit(async (formValues) => {
  apiError.value = null
  lastIdentifier.value = formValues.identifier

  try {
    const { $api } = useNuxtApp()
    await ($api as any)('/auth/forgot-password', {
      method: 'POST',
      body: { identifier: formValues.identifier },
    })
  } catch (error: any) {
    if (error?.data?.message) {
      apiError.value = String(error.data.message)
    } else {
      apiError.value = 'We could not send the reset link. Please try again.'
    }
  } finally {
    state.value = 'sent'
    startCooldown()
  }
})

function onSubmit() {
  void submit()
}

function onResend() {
  if (resendCooldown.value > 0) return
  void submit()
}

function startCooldown() {
  resendCooldown.value = 60
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    if (resendCooldown.value <= 1) {
      resendCooldown.value = 0
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    } else {
      resendCooldown.value -= 1
    }
  }, 1000)
}

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})

definePageMeta({
  layout: 'auth',
  middleware: [],
})
</script>
