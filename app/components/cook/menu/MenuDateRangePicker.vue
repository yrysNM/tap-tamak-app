<script setup lang="ts">
const { t } = useI18n()
import { DatePicker } from 'v-calendar'
import { ymdFromLocalDate } from '~/composables/useUtcMenuDates'

const props = defineProps<{
  from: string
  to: string
}>()

const emit = defineEmits<{
  'update:from': [value: string]
  'update:to': [value: string]
}>()

const panelOpen = ref(false)
const rootRef = ref<HTMLElement | null>(null)

type RangeModel = { start: Date; end: Date } | null

function parseYmdToLocalDate(ymd: string): Date {
  const p = ymd.split('-').map((x) => Number.parseInt(x, 10))
  const y = p[0] ?? 1970
  const m = p[1] ?? 1
  const d = p[2] ?? 1
  return new Date(y, m - 1, d)
}

const range = ref<RangeModel>(null)

watch(
  () => [props.from, props.to] as const,
  ([f, t]) => {
    if (!f || !t) return
    range.value = {
      start: parseYmdToLocalDate(f),
      end: parseYmdToLocalDate(t),
    }
  },
  { immediate: true },
)

watch(range, (r) => {
  if (!r?.start || !r?.end) return
  const a = ymdFromLocalDate(r.start)
  const b = ymdFromLocalDate(r.end)
  const [from, to] = a <= b ? [a, b] : [b, a]
  if (from !== props.from) emit('update:from', from)
  if (to !== props.to) emit('update:to', to)
})

function onClickOutside(ev: MouseEvent) {
  const el = rootRef.value
  if (!el || !panelOpen.value) return
  if (ev.target instanceof Node && !el.contains(ev.target)) {
    panelOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
})

const label = computed(() => {
  if (!props.from || !props.to) return t('l_Select_period')
  return `${props.from} → ${props.to}`
})
</script>

<template>
  <div ref="rootRef" class="relative">
    <button
      type="button"
      class="flex min-h-11 w-full max-w-[220px] items-center justify-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-left text-[13px] font-medium text-dark shadow-sm transition hover:border-primary/40 hover:shadow-md sm:max-w-none sm:justify-between sm:px-4"
      :class="panelOpen ? 'ring-2 ring-primary/35' : ''"
      @click.stop="panelOpen = !panelOpen"
    >
      <Icon name="material-symbols:calendar-month-outline" class="size-5 shrink-0 text-primary" />
      <span class="min-w-0 flex-1 truncate text-[12px] text-body sm:text-[13px]">{{ label }}</span>
      <Icon
        name="material-symbols:keyboard-arrow-down-rounded"
        class="size-5 shrink-0 text-caption transition"
        :class="panelOpen ? 'rotate-180' : ''"
      />
    </button>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div
        v-if="panelOpen"
        class="absolute right-0 z-40 mt-2 w-[min(100vw-2rem,340px)] overflow-hidden rounded-2xl border border-border bg-white shadow-floating ring-1 ring-black/5"
        @click.stop
      >
        <ClientOnly>
          <DatePicker
            v-model.range="range"
            mode="date"
            is-range
            title-position="left"
            class="menu-range-picker"
          />
          <template #fallback>
            <div class="p-6 text-center text-sm text-caption">{{ t("l_Loading_calendar") }}</div>
          </template>
        </ClientOnly>
        <div class="flex justify-end border-t border-border bg-peach-wash/40 px-3 py-2">
          <button
            type="button"
            class="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-primary-cta transition hover:bg-primary-hover"
            @click="panelOpen = false"
          >
            {{ t("l_Done") }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.menu-range-picker :deep(.vc-container) {
  --vc-accent-500: #f47b20;
  --vc-accent-600: #d4611a;
  --vc-gray-200: #e8e8e8;
  --vc-gray-400: #9a9a9a;
  border: 0;
  width: 100%;
  font-family: inherit;
}
.menu-range-picker :deep(.vc-weekday) {
  color: #666;
  font-weight: 600;
  font-size: 11px;
}
.menu-range-picker :deep(.vc-day-content) {
  border-radius: 10px;
  font-weight: 600;
}
.menu-range-picker :deep(.vc-highlight-content-solid) {
  color: #fff;
}
.menu-range-picker :deep(.vc-pane-header-wrapper) {
  padding-top: 0.5rem;
}
.menu-range-picker :deep(.vc-title) {
  font-weight: 700;
  color: #1a1a1a;
}
</style>
