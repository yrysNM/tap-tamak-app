<script setup lang="ts">
const { t } = useI18n()
import { useDebounceFn } from '@vueuse/core'
import type { CookDish } from '~/types'
import { apiMessage } from '~/utils/apiMessage'
import { dishImageSrc, unwrapDishesList } from '~/utils/dishApi'
import { formatMenuDateLabel, utcTodayYmd } from '~/composables/useUtcMenuDates'
import { httpStatus } from '~/composables/useHttpStatus'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [open: boolean]
  success: []
}>()

const { $api } = useNuxtApp()
const config = useRuntimeConfig()
const apiBase = computed(() => config.public.apiBaseUrl as string)

const search = ref('')
const debouncedSearch = ref('')
const updateDebounced = useDebounceFn((q: string) => {
  debouncedSearch.value = q
}, 280)

watch(search, (q: string) => {
  updateDebounced(q)
})

const dishes = ref<CookDish[]>([])
const listLoading = ref(false)
const listError = ref('')
const selected = ref<Set<string>>(new Set())
const submitting = ref(false)
const formError = ref('')

const todayYmd = utcTodayYmd()
const todayLabel = computed(() => formatMenuDateLabel(todayYmd))

function imageSrc(url: string | undefined) {
  return dishImageSrc(url, apiBase.value)
}

function isSelected(id: string) {
  return selected.value.has(id)
}

function toggle(id: string) {
  const next = new Set(selected.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selected.value = next
}

async function loadDishes() {
  listLoading.value = true
  listError.value = ''
  try {
    const q = debouncedSearch.value.trim()
    const raw = await ($api as (url: string, opts: object) => Promise<unknown>)('/dishes', {
      method: 'GET',
      query: {
        page: 1,
        limit: 80,
        ...(q ? { search: q } : {}),
      },
    })
    const { items } = unwrapDishesList((raw as { data?: unknown }).data ?? raw)
    dishes.value = items
  } catch (err) {
    listError.value = apiMessage(err, 'l_Failed_load_dishes')
    dishes.value = []
  } finally {
    listLoading.value = false
  }
}

watch(debouncedSearch, () => {
  if (props.modelValue) void loadDishes()
})

watch(
  () => props.modelValue,
  (open: boolean) => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = open ? 'hidden' : ''
    }
    if (open) {
      search.value = ''
      debouncedSearch.value = ''
      selected.value = new Set()
      formError.value = ''
      void loadDishes()
    }
  },
)

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') document.body.style.overflow = ''
})

function close() {
  if (submitting.value) return
  emit('update:modelValue', false)
}

async function submit() {
  formError.value = ''
  const dishIds = [...selected.value]
  if (dishIds.length === 0) {
    formError.value = t('l_Select_at_least_one_dish')
    return
  }
  submitting.value = true
  try {
    await ($api as (url: string, opts: object) => Promise<unknown>)('/menus', {
      method: 'POST',
      body: { date: todayYmd, dishIds },
    })
    emit('success')
    emit('update:modelValue', false)
  } catch (err) {
    if (httpStatus(err) === 409) {
      formError.value = t('l_Menu_today_exists')
    } else {
      formError.value = apiMessage(err, 'l_Failed_create_menu')
    }
  } finally {
    submitting.value = false
  }
}

function caloriesOf(d: CookDish) {
  const c = d.calories
  return typeof c === 'number' && Number.isFinite(c) ? c : undefined
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog"
      aria-modal="true" aria-labelledby="create-menu-title">
      <div class="absolute inset-0 bg-black/45 backdrop-blur-[2px]" aria-hidden="true" @click="close" />
      <div
        class="safe-sheet relative flex max-h-[min(92dvh,760px)] w-full max-w-lg flex-col rounded-t-3xl border border-border bg-white shadow-elevated sm:max-h-[min(88vh,720px)] sm:rounded-3xl">
        <header class="shrink-0 border-b border-border px-5 py-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 id="create-menu-title" class="text-lg font-bold text-dark">
                {{ t("l_Create_menu") }}
              </h2>
              <p class="mt-1 text-[13px] text-caption">
                {{ t("l_Date_utc") }}
              </p>
              <p class="text-sm font-semibold text-dark">
                {{ todayLabel }}
                <span class="ml-1 text-caption font-normal">({{ todayYmd }})</span>
              </p>
            </div>
            <button type="button"
              class="flex size-10 items-center justify-center rounded-xl text-caption transition hover:bg-surface-muted hover:text-dark"
              :disabled="submitting" :aria-label="t('l_Close')" @click="close">
              <Icon name="material-symbols:close-rounded" class="size-6" />
            </button>
          </div>
        </header>

        <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <label class="block">
            <span class="text-[13px] font-medium text-dark">{{ t("l_Search_dishes") }}</span>
            <div class="relative mt-1.5">
              <Icon name="material-symbols:search-rounded"
                class="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-caption" />
              <input v-model="search" type="search" autocomplete="off" :placeholder="t('l_Search_name_ingredient')"
                class="w-full rounded-xl border border-border py-2.5 pl-10 pr-3 text-sm outline-none ring-primary focus:ring-2" />
            </div>
          </label>

          <p v-if="listError" class="mt-3 text-[13px] text-error">
            {{ listError }}
          </p>

          <div v-if="listLoading" class="mt-4 space-y-3">
            <div v-for="n in 5" :key="n" class="flex gap-3 rounded-2xl border border-border bg-white p-3 shadow-sm">
              <div class="size-16 shrink-0 animate-pulse rounded-xl bg-surface-muted" />
              <div class="min-w-0 flex-1 space-y-2 py-0.5">
                <div class="h-4 w-2/3 animate-pulse rounded bg-surface-muted" />
                <div class="h-3 w-full animate-pulse rounded bg-surface-muted" />
              </div>
            </div>
          </div>
          <div v-else-if="dishes.length === 0"
            class="mt-8 rounded-2xl border border-dashed border-border bg-surface-muted/20 py-10 text-center text-sm text-caption">
            {{ t("l_No_dishes_match_query") }}
          </div>
          <ul v-else class="mt-4 space-y-3 pb-2">
            <li v-for="dish in dishes" :key="dish.id"
              class="flex gap-3 rounded-2xl border border-border bg-white p-3 shadow-sm transition hover:border-primary/30 hover:shadow-md">
              <button type="button"
                class="relative size-16 shrink-0 overflow-hidden rounded-xl bg-primary-light text-left outline-none ring-primary focus-visible:ring-2"
                @click="toggle(dish.id)">
                <img v-if="imageSrc(dish.imageUrl)" :src="imageSrc(dish.imageUrl)" :alt="dish.name"
                  class="size-full object-cover">
                <div v-else class="flex size-full items-center justify-center text-icon-muted">
                  <Icon name="material-symbols:restaurant-outline" class="size-8" />
                </div>
                <span
                  class="absolute right-1 top-1 flex size-5 items-center justify-center rounded-md border border-white/80 bg-white/95 shadow-sm">
                  <Icon v-if="isSelected(dish.id)" name="material-symbols:check-box-rounded"
                    class="size-5 text-primary" />
                  <Icon v-else name="material-symbols:check-box-outline-blank-rounded" class="size-5 text-caption" />
                </span>
              </button>
              <button type="button" class="min-w-0 flex-1 text-left outline-none" @click="toggle(dish.id)">
                <p class="font-semibold text-dark">
                  {{ dish.name }}
                </p>
                <p v-if="dish.description" class="mt-0.5 line-clamp-2 text-[12px] text-caption">
                  {{ dish.description }}
                </p>
                <p class="mt-1 text-[12px] text-muted">
                  {{ t("l_Cooking_time_single", { min: dish.cookingTime }) }}
                  <template v-if="caloriesOf(dish) != null">
                    {{ t("l_Calories_kcal", { calories: caloriesOf(dish) }) }}
                  </template>
                </p>
              </button>
            </li>
          </ul>

          <p v-if="formError" class="mt-4 text-[13px] text-error">
            {{ formError }}
          </p>
        </div>

        <footer class="shrink-0 border-t border-border bg-white/95 px-5 py-4 backdrop-blur-sm sm:rounded-b-3xl">
          <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button"
              class="h-11 rounded-xl border border-border px-6 text-sm font-semibold text-dark transition hover:bg-surface-muted/50 disabled:opacity-45"
              :disabled="submitting" @click="close">
              {{ t("l_Cancel") }}
            </button>
            <button type="button"
              class="flex h-11 items-center justify-center rounded-xl bg-primary px-8 text-sm font-bold text-white shadow-primary-cta transition hover:bg-primary-hover disabled:opacity-45"
              :disabled="submitting || listLoading" @click="submit">
              {{ submitting ? t("l_Creating") : t("l_Create_menu") }}
            </button>
          </div>
        </footer>
      </div>
    </div>
  </Teleport>
</template>
