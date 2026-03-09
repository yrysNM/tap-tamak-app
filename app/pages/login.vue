<template>
  <div>
    <div class="mb-6 text-center">
      <div class="text-4xl">🍳</div>
      <div class="mt-2 text-2xl font-bold text-primary">Tap Tamak</div>
      <p class="mt-1 text-sm text-muted">Order homemade food</p>
    </div>

    <div class="space-y-6 rounded-2xl bg-white p-6 shadow-card md:p-8">
      <div class="space-y-4">
        <UiInput
          label="Phone or email"
          placeholder="+7 ___ ___-__-__ or name@example.com"
          v-model="values.identifier"
          :error="errors.identifier"
        />

        <div class="relative">
          <UiInput
            label="Password"
            :type="showPassword ? 'text' : 'password'"
            v-model="values.password"
            :error="errors.password"
          />
          <button
            type="button"
            class="absolute inset-y-0 right-4 flex items-center text-muted"
            @click="showPassword = !showPassword"
          >
            <Icon
              :name="
                showPassword
                  ? 'material-symbols:visibility-off-outline'
                  : 'material-symbols:visibility-outline'
              "
              class="size-5"
            />
          </button>
        </div>

        <div class="flex justify-end">
          <button
            type="button"
            class="text-sm font-medium text-primary"
            @click="navigateTo('/forgot-password')"
          >
            Forgot password?
          </button>
        </div>
      </div>

      <div class="space-y-3">
        <UiButton
          variant="primary"
          size="md"
          :loading="isSubmitting"
          :disabled="isSubmitting"
          fullWidth
          @click="onSubmit"
        >
          Login
        </UiButton>

        <p v-if="apiError" class="text-center text-sm text-red-500">
          {{ apiError }}
        </p>

        <div class="flex items-center gap-3 text-sm text-muted">
          <div class="h-px flex-1 bg-border" />
          <span>or</span>
          <div class="h-px flex-1 bg-border" />
        </div>

        <div class="text-center text-sm text-muted">
          <p>Don't have an account?</p>
          <button
            type="button"
            class="mt-1 font-medium text-primary"
            @click="navigateTo('/register')"
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";

const authStore = useAuthStore();
const route = useRoute();
const redirectState = useState<string>("redirectTo", () => "/");

const loginSchema = toTypedSchema(
  z.object({
    identifier: z.string().min(1, "Phone or email is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
);

const { handleSubmit, errors, values, isSubmitting } = useForm<
  z.infer<typeof loginSchema>
>({
  validationSchema: loginSchema,
  initialValues: {
    identifier: "",
    password: "",
  },
});

const apiError = ref<string | null>(null);
const showPassword = ref(false);

function parseCredentials(identifier: string, password: string) {
  const trimmed = identifier.trim();
  if (trimmed.includes("@")) {
    return { email: trimmed, password };
  }

  const digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("8")) {
    return { phone: `8${digits.slice(1, 11)}`, password };
  }

  const last10 = digits.slice(-10);
  return { phone: `+7${last10}`, password };
}

const submit = handleSubmit(async (formValues) => {
  apiError.value = null;

  const credentials = parseCredentials(
    formValues.identifier,
    formValues.password,
  );

  try {
    await authStore.login(credentials as any);

    const queryRedirect = route.query.redirect as string | undefined;
    const target = redirectState.value || queryRedirect || "/";
    redirectState.value = "/";

    await navigateTo(target);
  } catch (error: any) {
    const status =
      error?.statusCode ?? error?.response?.status ?? error?.status ?? 0;

    if (status === 401) {
      apiError.value = "Invalid phone/email or password";
    } else if (status === 429) {
      apiError.value = "Too many attempts. Try again later.";
    } else if (error?.data?.message) {
      apiError.value = String(error.data.message);
    } else {
      apiError.value = "Something went wrong. Please try again.";
    }
  }
});

function onSubmit() {
  void submit();
}

definePageMeta({
  layout: "auth",
  middleware: [],
});
</script>
