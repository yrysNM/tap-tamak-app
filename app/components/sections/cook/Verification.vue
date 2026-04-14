<template>
  <div
    class="min-h-screen bg-page-cream pb-10"
    data-name="Верификация повара"
    data-node-id="178:759"
  >
    <div class="mx-auto w-full max-w-md px-5 pt-4">
      <div class="flex items-start gap-3">
        <div class="min-w-0 flex-1 pt-0.5 text-left">
          <h1
            class="text-[22px] font-bold leading-tight tracking-[-0.4px] text-heading"
            data-node-id="178:765"
          >
            Верификация повара
          </h1>
          <p
            class="mt-1.5 text-[11px] leading-snug text-caption"
            data-node-id="178:767"
          >
            Загрузите фото кухни и санитарную книжку (PDF).
          </p>
        </div>
        <div class="size-[38px] shrink-0" aria-hidden="true" />
      </div>

      <div
        v-if="verificationLoading"
        class="mt-8 rounded-[20px] border border-black/10 bg-white p-5 text-center shadow-soft"
        role="status"
        aria-live="polite"
      >
        <p class="text-[13px] text-caption">Загрузка статуса…</p>
      </div>

      <!-- Нет документов: статус + кнопка редактирования -->
      <div
        v-else-if="showDocumentsIntro"
        class="mt-8 rounded-[20px] border border-black/10 bg-white p-5 shadow-soft"
        role="region"
        aria-labelledby="verification-status-heading"
      >
        <p
          id="verification-status-heading"
          class="text-[15px] font-bold text-heading"
        >
          Статус верификации
        </p>
        <p
          class="mt-2 rounded-[14px] bg-primary/10 px-3 py-2 text-[12px] font-bold text-primary"
        >
          {{ statusLabel }}
        </p>
        <p class="mt-3 text-[12px] leading-relaxed text-caption">
          Документы ещё не отправлены. Загрузите фото кухни и санитарную книжку
          (PDF), затем нажмите «Продолжить».
        </p>
        <button
          type="button"
          class="mt-4 flex h-12 w-full items-center justify-center rounded-[16px] border border-black/10 bg-white text-[14px] font-bold text-heading shadow-sm transition-colors hover:bg-black/[0.02]"
          @click="editingDocuments = true"
        >
          Редактировать документы
        </button>
      </div>

      <!-- Статус: на проверке -->
      <div
        v-else-if="status === 'UNDER_REVIEW' || status === 'PENDING'"
        class="mt-8 rounded-[20px] border border-black/10 bg-white p-5 shadow-soft"
        role="status"
      >
        <p class="text-[15px] font-bold text-heading">Заявка на проверке</p>
        <p class="mt-2 text-[12px] leading-relaxed text-caption">
          Документы отправлены. Модерация проверит их и изменит статус аккаунта.
          Обычно это занимает до нескольких рабочих дней.
        </p>
        <p
          class="mt-3 rounded-[14px] bg-primary/10 px-3 py-2 text-[11px] font-bold text-primary"
        >
          Статус: на проверке
        </p>
      </div>

      <!-- Форма загрузки -->
      <template v-else-if="showUploadForm && !verificationLoading">
        <!-- Фото кухни -->
        <div
          class="mt-6 rounded-[20px] border border-black/10 bg-white p-3.5 shadow-soft"
          data-node-id="178:770"
        >
          <div class="flex items-center justify-between gap-2">
            <span
              class="text-[11.5px] font-bold tracking-[-0.2px] text-heading"
              data-node-id="178:773"
            >
              Фото кухни
            </span>
            <span
              class="text-[8.8px] font-bold tracking-[-0.2px] text-caption"
              data-node-id="178:775"
            >
              {{ kitchenPhotos.length }}/6
            </span>
          </div>

          <div
            class="mt-2.5 rounded-[18px] border border-dashed border-black/15 bg-gradient-to-b from-white to-peach-wash p-3"
            data-node-id="178:776"
          >
            <div class="flex gap-3">
              <div
                class="flex size-11 shrink-0 items-center justify-center rounded-[14px] border border-primary/20 bg-primary/10"
                data-node-id="178:777"
              >
                <img
                  :src="imgCamera"
                  alt=""
                  class="size-5"
                  data-node-id="178:778"
                />
              </div>
              <div class="min-w-0 flex-1">
                <p
                  class="text-[12.6px] font-bold tracking-[-0.2px] text-heading"
                  data-node-id="178:783"
                >
                  Загрузите 3–6 фото
                </p>
                <p
                  class="mt-1 text-[11px] leading-snug text-caption"
                  data-node-id="178:785"
                >
                  Покажите рабочее место: стол, плита, чистота, хранение
                  продуктов.
                </p>
                <input
                  ref="kitchenInputRef"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  class="sr-only"
                  @change="onKitchenFiles"
                />
                <button
                  type="button"
                  class="mt-2 h-[42px] rounded-[14px] bg-primary px-3.5 text-[12.5px] font-bold uppercase tracking-wide text-white shadow-primary-cta"
                  data-node-id="178:787"
                  @click="kitchenInputRef?.click()"
                >
                  Загрузить фото
                </button>

                <div class="mt-2 grid grid-cols-3 gap-2" data-node-id="178:789">
                  <div
                    v-for="(slot, i) in photoSlots"
                    :key="i"
                    class="relative flex h-[78px] w-full items-center justify-center overflow-hidden rounded-[14px] border border-black/10 bg-black/[0.03]"
                    data-node-id="178:791"
                  >
                    <template v-if="slot">
                      <img
                        :src="slot.previewUrl"
                        alt=""
                        class="size-full object-cover"
                      />
                      <button
                        type="button"
                        class="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/50 text-xs font-bold text-white"
                        aria-label="Удалить фото"
                        @click="removeKitchenPhoto(i)"
                      >
                        ×
                      </button>
                    </template>
                    <span
                      v-else
                      class="text-[11.5px] font-bold text-caption"
                      data-node-id="178:792"
                    >
                      Фото
                    </span>
                  </div>
                </div>
                <p
                  class="mt-2 text-[11px] leading-snug text-caption"
                  data-node-id="178:799"
                >
                  Поддерживаются JPG/PNG. Фото можно удалить.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Сан. книжка -->
        <div
          class="mt-4 rounded-[20px] border border-black/10 bg-white/90 p-3.5 shadow-soft"
          data-node-id="178:800"
        >
          <div class="flex items-center justify-between gap-2">
            <span
              class="text-xs font-bold tracking-[-0.2px] text-heading"
              data-node-id="178:803"
            >
              Сан. книжка (PDF)
            </span>
            <span
              class="text-[10px] font-bold tracking-[-0.2px] text-caption"
              data-node-id="178:805"
            >
              {{ certificatePdf ? certificatePdf.name : "не загружено" }}
            </span>
          </div>

          <div
            class="mt-2.5 rounded-[18px] border border-dashed border-blue-500/25 bg-gradient-to-b from-white to-sky-50 p-3"
            data-node-id="178:806"
          >
            <div class="flex gap-3">
              <div
                class="flex size-11 shrink-0 items-center justify-center rounded-[14px] border border-blue-500/20 bg-blue-500/10"
                data-node-id="178:807"
              >
                <img
                  :src="imgPdf"
                  alt=""
                  class="size-5"
                  data-node-id="178:808"
                />
              </div>
              <div class="min-w-0 flex-1">
                <p
                  class="text-[12.9px] font-bold tracking-[-0.2px] text-heading"
                  data-node-id="178:812"
                >
                  Загрузите один файл PDF
                </p>
                <p
                  class="mt-1 text-[11px] leading-snug text-caption"
                  data-node-id="178:814"
                >
                  Санитарная книжка. Размер до 10MB.
                </p>
                <input
                  ref="pdfInputRef"
                  type="file"
                  accept="application/pdf"
                  class="sr-only"
                  @change="onPdfFile"
                />
                <div class="mt-2 flex flex-wrap gap-2" data-node-id="178:815">
                  <button
                    type="button"
                    class="h-[42px] rounded-[14px] bg-primary px-3.5 text-[12.5px] font-bold uppercase tracking-wide text-white shadow-primary-cta"
                    data-node-id="178:816"
                    @click="pdfInputRef?.click()"
                  >
                    Загрузить PDF
                  </button>
                  <button
                    type="button"
                    class="h-[42px] rounded-[14px] border border-black/10 bg-white px-4 text-[12.5px] font-bold text-muted"
                    data-node-id="178:818"
                    :disabled="!certificatePdf"
                    :class="!certificatePdf && 'opacity-40'"
                    @click="clearPdf"
                  >
                    Удалить
                  </button>
                </div>
                <p
                  v-if="status === 'REJECTED'"
                  class="mt-2 text-[11px] leading-snug text-error"
                >
                  Ранее заявка отклонена — загрузите новые документы и отправьте
                  снова.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p v-if="hint" class="mt-3 text-center text-xs text-red-500">
          {{ hint }}
        </p>

        <button
          v-if="showDocumentsBack"
          type="button"
          class="mt-4 w-full text-center text-[12px] font-bold text-primary underline-offset-2 hover:underline"
          @click="editingDocuments = false"
        >
          Назад к статусу
        </button>

        <button
          type="button"
          class="mt-6 flex h-14 w-full items-center justify-center rounded-[18px] bg-primary text-[17px] font-bold text-white shadow-[0_10px_24px_rgba(244,123,32,0.28)] disabled:opacity-45"
          :disabled="!canContinue || submitting"
          @click="onContinue"
        >
          {{ submitting ? "Отправка…" : "Продолжить" }}
        </button>
      </template>

      <div
        v-else-if="status === 'APPROVED'"
        class="mt-8 rounded-[20px] border border-black/10 bg-white p-5 text-center shadow-soft"
      >
        <p class="text-[13px] text-caption">
          Аккаунт подтверждён. Перенаправление…
        </p>
      </div>

      <div
        v-else-if="fetchError"
        class="mt-8 rounded-[20px] border border-black/10 bg-white p-5 text-center shadow-soft"
      >
        <p class="text-[13px] text-caption">{{ fetchError }}</p>
      </div>

      <div
        v-else
        class="mt-8 rounded-[20px] border border-black/10 bg-white p-5 text-center shadow-soft"
      >
        <p class="text-[13px] text-caption">
          Не удалось определить статус верификации. Обновите страницу или
          войдите снова.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CookVerificationGetResponse, VerificationStatus } from "~/types";

const imgCamera =
  "https://tap-tamak-production.up.railway.app/api/v1/uploads/gallery/75513deb-b547-4868-9e9a-1ba5ca9c8bdc.png";
const imgPdf =
  "https://tap-tamak-production.up.railway.app/api/v1/uploads/gallery/b792aebe-9238-484d-ab04-58e1f35a71e0.png";

const MAX_KITCHEN = 6;
const MIN_KITCHEN = 3;
const MAX_PDF_BYTES = 10 * 1024 * 1024;

const authStore = useAuthStore();
const nuxtApp = useNuxtApp();
const kitchenInputRef = ref<HTMLInputElement | null>(null);
const pdfInputRef = ref<HTMLInputElement | null>(null);

const kitchenPhotos = ref<{ previewUrl: string; file: File }[]>([]);
const certificatePdf = ref<{ name: string; file: File } | null>(null);
const hint = ref("");
const submitting = ref(false);
const verificationLoading = ref(true);
const fetchError = ref("");
const documentsFromApi = ref<
  CookVerificationGetResponse["documents"] | undefined
>(undefined);
const editingDocuments = ref(false);
const { verificationStatus } = storeToRefs(authStore);

const status = computed<VerificationStatus>(() => {
  return verificationStatus.value ?? "PENDING";
});

const statusLabel = computed(() => {
  const m: Record<VerificationStatus, string> = {
    PENDING: "Ожидает загрузки документов",
    UNDER_REVIEW: "На проверке",
    APPROVED: "Подтверждён",
    REJECTED: "Отклонён",
  };
  return m[status.value] ?? status.value;
});

const showDocumentsIntro = computed(
  () =>
    !verificationLoading.value &&
    !fetchError.value &&
    status.value === "PENDING" &&
    documentsFromApi.value === null &&
    !editingDocuments.value,
);

const showUploadForm = computed(() => {
  if (
    status.value === "APPROVED" ||
    status.value === "UNDER_REVIEW" ||
    status.value === "PENDING"
  )
    return false;
  if (status.value === "REJECTED") return true;
  if (documentsFromApi.value === null && !editingDocuments.value) return false;
  return true;
});

const showDocumentsBack = computed(
  () =>
    status.value === "PENDING" &&
    documentsFromApi.value === null &&
    editingDocuments.value,
);

function apiMessage(
  err: unknown,
  fallback = "Не удалось выполнить запрос.",
): string {
  const e = err as {
    data?: { message?: string | string[] };
    message?: string;
  };
  const m = e?.data?.message;
  if (Array.isArray(m)) return m.join(", ");
  if (typeof m === "string") return m;
  if (e?.message) return e.message;
  return fallback;
}

function unwrapVerificationPayload(raw: unknown): CookVerificationGetResponse {
  if (raw && typeof raw === "object" && "data" in raw) {
    return (raw as { data: CookVerificationGetResponse }).data;
  }
  return raw as CookVerificationGetResponse;
}

async function loadVerification(opts?: { skipLoading?: boolean }) {
  if (!opts?.skipLoading) verificationLoading.value = true;
  fetchError.value = "";
  try {
    const raw = await (
      nuxtApp.$api as (url: string, opts: object) => Promise<unknown>
    )("/cooks/me/verification", { method: "GET" });
    const body = unwrapVerificationPayload(raw);
    authStore.setVerificationStatus(body.verificationStatus);
    documentsFromApi.value = body.documents ?? null;
  } catch (err) {
    fetchError.value = apiMessage(
      err,
      "Не удалось загрузить статус верификации.",
    );
    documentsFromApi.value = undefined;
  } finally {
    if (!opts?.skipLoading) verificationLoading.value = false;
  }
}

function redirectIfApproved() {
  if (status.value === "APPROVED") {
    navigateTo("/cook/dashboard");
  }
}

onMounted(async () => {
  await loadVerification();
  redirectIfApproved();
});
watch(status, redirectIfApproved);

const photoSlots = computed(() => {
  const slots: ({ previewUrl: string; file: File } | null)[] = [
    ...kitchenPhotos.value,
  ];
  while (slots.length < 6) slots.push(null);
  return slots.slice(0, 6);
});

const canContinue = computed(
  () =>
    kitchenPhotos.value.length >= MIN_KITCHEN &&
    certificatePdf.value?.file !== undefined,
);

function revokePreviews() {
  for (const p of kitchenPhotos.value) {
    URL.revokeObjectURL(p.previewUrl);
  }
}

onUnmounted(() => {
  revokePreviews();
});

function onKitchenFiles(e: Event) {
  hint.value = "";
  const input = e.target as HTMLInputElement;
  const files = input.files;
  if (!files?.length) return;

  const incoming = Array.from(files).filter((f) =>
    /^image\/(jpeg|png|webp)$/i.test(f.type),
  );
  const room = MAX_KITCHEN - kitchenPhotos.value.length;
  const take = incoming.slice(0, Math.max(0, room));

  if (incoming.length > room) {
    hint.value = `Можно не больше ${MAX_KITCHEN} фото. Лишние файлы пропущены.`;
  }

  for (const file of take) {
    kitchenPhotos.value.push({
      file,
      previewUrl: URL.createObjectURL(file),
    });
  }
  input.value = "";
}

function removeKitchenPhoto(index: number) {
  const p = kitchenPhotos.value[index];
  if (!p) return;
  URL.revokeObjectURL(p.previewUrl);
  kitchenPhotos.value.splice(index, 1);
}

function onPdfFile(e: Event) {
  hint.value = "";
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  if (file.type !== "application/pdf") {
    hint.value = "Нужен файл PDF.";
    return;
  }
  if (file.size > MAX_PDF_BYTES) {
    hint.value = "PDF больше 10MB.";
    return;
  }
  certificatePdf.value = { name: file.name, file };
}

function clearPdf() {
  certificatePdf.value = null;
  if (pdfInputRef.value) pdfInputRef.value.value = "";
}

async function onContinue() {
  if (!canContinue.value || submitting.value) return;
  const cert = certificatePdf.value;
  if (!cert) return;

  const form = new FormData();
  for (const p of kitchenPhotos.value) {
    form.append("kitchenPhotos", p.file);
  }
  form.append("certificate", cert.file, cert.name);

  hint.value = "";
  submitting.value = true;
  try {
    await (nuxtApp.$api as (url: string, opts: object) => Promise<unknown>)(
      "/cooks/me/verification",
      { method: "POST", body: form },
    );
    editingDocuments.value = false;
    await loadVerification({ skipLoading: true });
    kitchenPhotos.value = [];
    revokePreviews();
    certificatePdf.value = null;
    if (pdfInputRef.value) pdfInputRef.value.value = "";
  } catch (err) {
    hint.value = apiMessage(err, "Не удалось отправить документы.");
  } finally {
    submitting.value = false;
  }
}
</script>
