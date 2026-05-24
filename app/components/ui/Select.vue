<template>
  <div class="w-full">
    <label
      v-if="label"
      :for="triggerId"
      class="mb-1 block text-sm font-medium text-dark"
    >
      {{ label }}
    </label>
    <div ref="rootRef" class="relative" @keydown.esc.prevent="close">
      <button
        :id="triggerId"
        type="button"
        role="combobox"
        :aria-expanded="open ? 'true' : 'false'"
        aria-haspopup="listbox"
        :aria-controls="listboxId"
        :aria-invalid="error ? 'true' : undefined"
        :aria-required="required ? 'true' : undefined"
        :disabled="disabled"
        :class="[
          'relative flex w-full items-center justify-between rounded-xl border bg-white px-3 py-2.5 pr-10 text-left text-sm text-dark outline-none ring-primary transition focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60',
          error
            ? 'border-error focus:ring-error'
            : open
              ? 'border-primary/50 ring-2 ring-primary/35'
              : 'border-border hover:border-muted',
        ]"
        @click="toggle"
      >
        <span class="min-w-0 truncate">{{ selectedLabel }}</span>
        <span
          class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
          aria-hidden="true"
        >
          <Icon
            name="material-symbols:expand-more-rounded"
            class="size-5 transition-transform"
            :class="open ? 'rotate-180' : ''"
          />
        </span>
      </button>

      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="translate-y-1 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-1 opacity-0"
      >
        <div
          v-if="open"
          :id="listboxId"
          class="absolute left-0 z-40 w-full overflow-hidden rounded-xl border border-border bg-white py-1 shadow-floating ring-1 ring-black/5"
          :class="direction === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'"
          role="listbox"
          :aria-label="label || $t('l_Choice')"
        >
          <button
            v-for="opt in options"
            :key="opt.value"
            type="button"
            role="option"
            :aria-selected="modelValue === opt.value ? 'true' : 'false'"
            class="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm text-dark transition hover:bg-primary-light/40 focus:bg-primary-light/40 focus:outline-none"
            :class="
              modelValue === opt.value
                ? 'bg-primary-light/30 font-medium text-dark'
                : ''
            "
            @click="select(opt.value)"
          >
            <span>{{ opt.label }}</span>
            <Icon
              v-if="modelValue === opt.value"
              name="material-symbols:check-rounded"
              class="size-4 shrink-0 text-primary"
              aria-hidden="true"
            />
          </button>
        </div>
      </Transition>
    </div>
    <p v-if="error" class="mt-1 text-sm text-error">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
export type UiSelectOption = {
  value: string;
  label: string;
};

const props = withDefaults(
  defineProps<{
    label?: string;
    modelValue: string;
    options: UiSelectOption[];
    error?: string;
    disabled?: boolean;
    required?: boolean;
  }>(),
  {
    disabled: false,
    required: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const triggerId = useId();
const listboxId = `${triggerId}-listbox`;

const rootRef = ref<HTMLElement | null>(null);
const open = ref(false);
const direction = ref<"top" | "bottom">("bottom");

const { t } = useI18n();

const selectedLabel = computed(() => {
  return (
    props.options.find((o) => o.value === props.modelValue)?.label ??
    t("l_Select_placeholder")
  );
});

function updateDirection() {
  const el = rootRef.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight;
  const row = 44;
  const approx = props.options.length * row + 16;
  const below = vh - rect.bottom;
  const above = rect.top;
  direction.value = below < approx && above > below ? "top" : "bottom";
}

function close() {
  open.value = false;
}

function toggle() {
  if (props.disabled) return;
  if (open.value) {
    close();
    return;
  }
  updateDirection();
  open.value = true;
}

function select(value: string) {
  emit("update:modelValue", value);
  close();
}

function onDocClick(ev: MouseEvent) {
  if (!open.value) return;
  const t = ev.target as Node | null;
  if (!t || !rootRef.value?.contains(t)) close();
}

onMounted(() => {
  document.addEventListener("click", onDocClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onDocClick);
});
</script>
