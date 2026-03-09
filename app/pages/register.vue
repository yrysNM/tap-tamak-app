<template>
  <div>
    <div class="mb-6 text-center">
      <div class="text-4xl">🍳</div>
      <div class="mt-2 text-2xl font-bold text-primary">Tap Tamak</div>
      <p class="mt-1 text-sm text-muted">Create your account</p>
    </div>

    <div class="rounded-2xl bg-white p-6 shadow-card md:p-8">
      <div class="mb-4 flex items-center justify-between">
        <div class="text-base font-semibold text-dark">
          <span v-if="step === 1">Create account</span>
          <span v-else>Almost there!</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span
            class="h-2 w-2 rounded-full"
            :class="step === 1 ? 'bg-primary' : 'bg-border'"
          />
          <span
            class="h-2 w-2 rounded-full"
            :class="step === 2 ? 'bg-primary' : 'bg-border'"
          />
        </div>
      </div>

      <Transition name="fade" mode="out-in">
        <div v-if="step === 1" key="step-1" class="space-y-5">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <UiInput
              label="First name"
              placeholder="e.g. Aidana"
              v-model="stepOneValues.firstName"
              :error="stepOneErrors.firstName"
            />
            <UiInput
              label="Last name"
              placeholder="e.g. Sadykova"
              v-model="stepOneValues.lastName"
              :error="stepOneErrors.lastName"
            />
          </div>

          <div class="space-y-4">
            <UiInput
              label="Phone number"
              placeholder="+7 (___) ___-__-__"
              :model-value="stepOneValues.phone"
              :error="stepOneErrors.phone"
              @update:modelValue="onPhoneInput"
            />

            <UiInput
              label="Email address"
              placeholder="name@example.com"
              v-model="stepOneValues.email"
              :error="stepOneErrors.email"
            />

            <div class="relative">
              <UiInput
                label="Password"
                :type="showPassword ? 'text' : 'password'"
                v-model="stepOneValues.password"
                :error="stepOneErrors.password"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-4 flex items-center text-muted"
                @click="showPassword = !showPassword"
              >
                <Icon
                  :name="showPassword ? 'material-symbols:visibility-off-outline' : 'material-symbols:visibility-outline'"
                  class="size-5"
                />
              </button>
            </div>

            <div class="relative">
              <UiInput
                label="Confirm password"
                :type="showConfirmPassword ? 'text' : 'password'"
                v-model="stepOneValues.confirmPassword"
                :error="stepOneErrors.confirmPassword"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-4 flex items-center text-muted"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <Icon
                  :name="showConfirmPassword ? 'material-symbols:visibility-off-outline' : 'material-symbols:visibility-outline'"
                  class="size-5"
                />
              </button>
            </div>

            <div class="space-y-2">
              <p class="text-sm font-medium text-muted">
                I am registering as:
              </p>
              <div class="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  class="flex flex-col items-center gap-1 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors"
                  :class="
                    stepOneValues.role === 'USER'
                      ? 'border-primary bg-primary-light text-primary'
                      : 'border-border bg-white text-dark'
                  "
                  @click="stepOneValues.role = 'USER'"
                >
                  <span class="text-xl" aria-hidden>🛒</span>
                  <span>User</span>
                </button>
                <button
                  type="button"
                  class="flex flex-col items-center gap-1 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors"
                  :class="
                    stepOneValues.role === 'COOK'
                      ? 'border-primary bg-primary-light text-primary'
                      : 'border-border bg-white text-dark'
                  "
                  @click="stepOneValues.role = 'COOK'"
                >
                  <span class="text-xl" aria-hidden>👨‍🍳</span>
                  <span>Cook</span>
                </button>
              </div>
              <p v-if="stepOneErrors.role" class="text-sm text-red-500">
                {{ stepOneErrors.role }}
              </p>
            </div>
          </div>

          <div class="space-y-3 pt-2">
            <UiButton
              variant="primary"
              fullWidth
              :loading="isStepOneSubmitting"
              :disabled="isStepOneSubmitting"
              @click="onStepOneSubmit"
            >
              Continue
            </UiButton>

            <div class="text-center text-sm text-muted">
              <p>Already have an account?</p>
              <button
                type="button"
                class="mt-1 font-medium text-primary"
                @click="navigateTo('/login')"
              >
                Log in
              </button>
            </div>
          </div>
        </div>

        <div v-else key="step-2" class="space-y-5">
          <div class="space-y-3 rounded-xl bg-primary-light p-4">
            <div class="flex items-center gap-2 text-sm text-dark">
              <span aria-hidden>👤</span>
              <span>{{ stepOneValues.firstName }} {{ stepOneValues.lastName }}</span>
            </div>
            <div class="flex items-center gap-2 text-sm text-dark">
              <span aria-hidden>📱</span>
              <span>{{ stepOneValues.phone }}</span>
            </div>
            <div class="flex items-center gap-2 text-sm text-dark">
              <span aria-hidden>✉️</span>
              <span>{{ stepOneValues.email }}</span>
            </div>
            <div class="flex items-center gap-2 text-sm text-dark">
              <span aria-hidden>🎭</span>
              <span>Role: {{ stepOneValues.role === 'COOK' ? 'Cook' : 'User' }}</span>
            </div>
          </div>

          <div class="space-y-2">
            <label class="flex items-start gap-2 text-sm text-dark">
              <input
                v-model="stepTwoValues.termsAccepted"
                type="checkbox"
                class="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
              >
              <span>I agree to the Terms of Service</span>
            </label>
            <p v-if="stepTwoErrors.termsAccepted" class="text-sm text-red-500">
              {{ stepTwoErrors.termsAccepted }}
            </p>
          </div>

          <div class="space-y-3 pt-2">
            <UiButton
              variant="primary"
              fullWidth
              :loading="isStepTwoSubmitting"
              :disabled="isStepTwoSubmitting"
              @click="onStepTwoSubmit"
            >
              Create account
            </UiButton>

            <button
              type="button"
              class="w-full text-center text-sm font-medium text-muted"
              @click="step = 1"
            >
              ← Back
            </button>

            <p v-if="apiError" class="text-center text-sm text-red-500">
              {{ apiError }}
            </p>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

type Role = 'USER' | 'COOK'

const authStore = useAuthStore()
const redirectState = useState<string>('redirectTo', () => '/')

const step = ref<1 | 2>(1)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const apiError = ref<string | null>(null)

const stepOneSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .refine((value) => isValidPhone(value), {
      message: 'Enter a valid phone number',
    }),
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .refine((value) => /\d/.test(value), {
      message: 'Password must contain at least one number',
    }),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  role: z.enum(['USER', 'COOK'], {
    required_error: 'Please choose a role',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords must match',
  path: ['confirmPassword'],
})

type StepOneValues = z.infer<typeof stepOneSchema>

const {
  handleSubmit: handleStepOneSubmit,
  errors: stepOneErrors,
  values: stepOneValues,
  isSubmitting: isStepOneSubmitting,
  setFieldError: setStepOneFieldError,
} = useForm<StepOneValues>({
  validationSchema: toTypedSchema(stepOneSchema),
  initialValues: {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'USER',
  },
})

const stepTwoSchema = z.object({
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the Terms of Service' }),
  }),
})

type StepTwoValues = z.infer<typeof stepTwoSchema>

const {
  handleSubmit: handleStepTwoSubmit,
  errors: stepTwoErrors,
  values: stepTwoValues,
  isSubmitting: isStepTwoSubmitting,
} = useForm<StepTwoValues>({
  validationSchema: toTypedSchema(stepTwoSchema),
  initialValues: {
    termsAccepted: false,
  },
})

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '')

  let cleaned = digits
  if (cleaned.startsWith('8')) {
    cleaned = '7' + cleaned.slice(1)
  }
  if (!cleaned.startsWith('7')) {
    cleaned = '7' + cleaned
  }
  cleaned = cleaned.slice(0, 11)

  const country = '+7'
  const part1 = cleaned.slice(1, 4)
  const part2 = cleaned.slice(4, 7)
  const part3 = cleaned.slice(7, 9)
  const part4 = cleaned.slice(9, 11)

  let result = country
  if (part1) result += ` (${part1}`
  if (part1 && part1.length === 3) result += ')'
  if (part2) result += ` ${part2}`
  if (part3) result += `-${part3}`
  if (part4) result += `-${part4}`

  return result
}

function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  if (digits.length < 10) return false
  const last10 = digits.slice(-10)
  const plus7 = `+7${last10}`
  const eight = `8${last10}`
  const pattern = /^(\+7\d{10}|8\d{10})$/
  return pattern.test(plus7) || pattern.test(eight)
}

function getCanonicalPhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  const last10 = digits.slice(-10)
  return `+7${last10}`
}

function onPhoneInput(value: string) {
  stepOneValues.phone = formatPhone(value)
}

const handleStepOne = handleStepOneSubmit(async () => {
  apiError.value = null
  step.value = 2
})

function onStepOneSubmit() {
  void handleStepOne()
}

const handleStepTwo = handleStepTwoSubmit(async () => {
  apiError.value = null

  const payload = {
    firstName: stepOneValues.firstName,
    lastName: stepOneValues.lastName,
    email: stepOneValues.email,
    phone: getCanonicalPhone(stepOneValues.phone),
    password: stepOneValues.password,
    role: stepOneValues.role as Role,
  }

  try {
    const { $api } = useNuxtApp()
    await ($api as any)('/auth/register', {
      method: 'POST',
      body: payload,
    })

    await authStore.login({
      email: payload.email,
      phone: payload.phone,
      password: payload.password,
    } as any)

    if (payload.role === 'COOK') {
      await navigateTo('/cook/verification')
      return
    }

    const target = redirectState.value || '/'
    redirectState.value = '/'
    await navigateTo(target)
  } catch (error: any) {
    const status =
      error?.statusCode ?? error?.response?.status ?? error?.status ?? 0

    if (status === 409) {
      step.value = 1
      const field = error?.data?.field as string | undefined
      const message =
        error?.data?.message ??
        'An account already exists with this phone or email.'
      if (field === 'email') {
        setStepOneFieldError('email', message)
      } else if (field === 'phone') {
        setStepOneFieldError('phone', message)
      } else {
        setStepOneFieldError('email', message)
        setStepOneFieldError('phone', message)
      }
      return
    }

    apiError.value =
      error?.data?.message ?? 'Something went wrong. Please try again.'
  }
})

function onStepTwoSubmit() {
  void handleStepTwo()
}

definePageMeta({
  layout: 'auth',
  middleware: [],
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
