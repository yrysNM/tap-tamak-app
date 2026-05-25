<template>
  <div class="min-h-screen bg-page-cream pb-10" data-name="Верификация повара" data-node-id="178:759">
    <div class="mx-auto w-full max-w-md px-5 pt-4">
      <div class="flex items-start gap-3">
        <div class="min-w-0 flex-1 pt-0.5 text-left">
          <h1 class="text-[22px] font-bold leading-tight tracking-[-0.4px] text-heading" data-node-id="178:765">
            {{ t("l_Verification_title") }}
          </h1>
          <p class="mt-1.5 text-[11px] leading-snug text-caption" data-node-id="178:767">
            {{ t("l_Verification_subtitle") }}
          </p>
        </div>
        <div class="size-[38px] shrink-0" aria-hidden="true" />
      </div>

      <div v-if="verificationLoading"
        class="mt-8 rounded-[20px] border border-black/10 bg-white p-5 text-center shadow-soft" role="status"
        aria-live="polite">
        <p class="text-[13px] text-caption">{{ t("l_Loading_verification") }}</p>
      </div>

      <!-- Нет документов: статус + кнопка редактирования -->
      <div v-else-if="showDocumentsIntro" class="mt-8 rounded-[20px] border border-black/10 bg-white p-5 shadow-soft"
        role="region" aria-labelledby="verification-status-heading">
        <p id="verification-status-heading" class="text-[15px] font-bold text-heading">
          {{ t("l_Verification_status") }}
        </p>
        <p class="mt-2 rounded-[14px] bg-primary/10 px-3 py-2 text-[12px] font-bold text-primary">
          {{ statusLabel }}
        </p>
        <p class="mt-3 text-[12px] leading-relaxed text-caption">
          {{ t("l_Verification_not_sent") }}
        </p>
        <button type="button"
          class="mt-4 flex h-12 w-full items-center justify-center rounded-[16px] border border-black/10 bg-white text-[14px] font-bold text-heading shadow-sm transition-colors hover:bg-black/2"
          @click="editingDocuments = true">
          {{ t("l_Edit_documents") }}
        </button>


        <div>
          <button type="button"
            class="mt-6 flex h-14 w-full items-center justify-center rounded-[18px] bg-primary text-[17px] font-bold text-white shadow-[0_10px_24px_rgba(244,123,32,0.28)] disabled:opacity-45"
            @click="signOut">{{ $t('l_Log_out') }}</button>
        </div>
      </div>

      <!-- Статус: на проверке -->
      <div v-else-if="status === 'UNDER_REVIEW'"
        class="mt-8 rounded-[20px] border border-black/10 bg-white p-5 shadow-soft" role="status">
        <p class="text-[15px] font-bold text-heading">{{ t("l_Application_under_review") }}</p>
        <p class="mt-2 text-[12px] leading-relaxed text-caption">
          {{ t("l_Under_review_hint") }}
        </p>
        <p class="mt-3 rounded-[14px] bg-primary/10 px-3 py-2 text-[11px] font-bold text-primary">
          {{ t("l_Status_under_review") }}
        </p>


        <div>
          <button type="button"
            class="mt-6 flex h-14 w-full items-center justify-center rounded-[18px] bg-primary text-[17px] font-bold text-white shadow-[0_10px_24px_rgba(244,123,32,0.28)] disabled:opacity-45"
            @click="signOut">{{ $t('l_Log_out') }}</button>
        </div>
      </div>

      <!-- Форма загрузки -->
      <template v-else-if="showUploadForm && !verificationLoading">
        <!-- Фото кухни -->
        <div class="mt-6 rounded-[20px] border border-black/10 bg-white p-3.5 shadow-soft" data-node-id="178:770">
          <div class="flex items-center justify-between gap-2">
            <span class="text-[11.5px] font-bold tracking-[-0.2px] text-heading" data-node-id="178:773">
              {{ t("l_Kitchen_photos") }}
            </span>
            <span class="text-[8.8px] font-bold tracking-[-0.2px] text-caption" data-node-id="178:775">
              {{ kitchenPhotos.length }}/6
            </span>
          </div>

          <div
            class="mt-2.5 rounded-[18px] border border-dashed border-black/15 bg-linear-to-b from-white to-peach-wash p-3"
            data-node-id="178:776">
            <div class="flex gap-3">
              <div
                class="flex size-11 shrink-0 items-center justify-center rounded-[14px] border border-primary/20 bg-primary/10"
                data-node-id="178:777">
                <img :src="imgCamera" alt="" class="size-5" data-node-id="178:778" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-[12.6px] font-bold tracking-[-0.2px] text-heading" data-node-id="178:783">
                  {{ t("l_Upload_3_6_photos") }}
                </p>
                <p class="mt-1 text-[11px] leading-snug text-caption" data-node-id="178:785">
                  {{ t("l_Kitchen_photos_hint") }}
                </p>
                <input ref="kitchenInputRef" type="file" accept="image/jpeg,image/png,image/webp" multiple
                  class="sr-only" @change="onKitchenFiles" />
                <button type="button"
                  class="mt-2 h-[42px] rounded-[14px] bg-primary px-3.5 text-[12.5px] font-bold uppercase tracking-wide text-white shadow-primary-cta"
                  data-node-id="178:787" @click="kitchenInputRef?.click()">
                  {{ t("l_Upload_photos") }}
                </button>

                <div class="mt-2 grid grid-cols-3 gap-2" data-node-id="178:789">
                  <div v-for="(slot, i) in photoSlots" :key="i"
                    class="relative flex h-[78px] w-full items-center justify-center overflow-hidden rounded-[14px] border border-black/10 bg-black/3"
                    data-node-id="178:791">
                    <template v-if="slot">
                      <img :src="slot.previewUrl" alt="" class="size-full object-cover" />
                      <button type="button"
                        class="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/50 text-xs font-bold text-white"
                        :aria-label="t('l_Delete_photo')" @click="removeKitchenPhoto(i)">
                        ×
                      </button>
                    </template>
                    <span v-else class="text-[11.5px] font-bold text-caption" data-node-id="178:792">
                      {{ t("l_Photo") }}
                    </span>
                  </div>
                </div>
                <p class="mt-2 text-[11px] leading-snug text-caption" data-node-id="178:799">
                  {{ t("l_Photos_format_hint") }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Сан. книжка -->
        <div class="mt-4 rounded-[20px] border border-black/10 bg-white/90 p-3.5 shadow-soft" data-node-id="178:800">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-bold tracking-[-0.2px] text-heading" data-node-id="178:803">
              {{ t("l_Sanitary_book_pdf") }}
            </span>
            <span class="text-[10px] font-bold tracking-[-0.2px] text-caption" data-node-id="178:805">
              {{ certificatePdf ? certificatePdf.name : t("l_Not_uploaded") }}
            </span>
          </div>

          <div
            class="mt-2.5 rounded-[18px] border border-dashed border-blue-500/25 bg-linear-to-b from-white to-sky-50 p-3"
            data-node-id="178:806">
            <div class="flex gap-3">
              <div
                class="flex size-11 shrink-0 items-center justify-center rounded-[14px] border border-blue-500/20 bg-blue-500/10"
                data-node-id="178:807">
                <img :src="imgPdf" alt="" class="size-5" data-node-id="178:808" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-[12.9px] font-bold tracking-[-0.2px] text-heading" data-node-id="178:812">
                  {{ t("l_Upload_one_pdf") }}
                </p>
                <p class="mt-1 text-[11px] leading-snug text-caption" data-node-id="178:814">
                  {{ t("l_Sanitary_book_size_hint") }}
                </p>
                <input ref="pdfInputRef" type="file" accept="application/pdf" class="sr-only" @change="onPdfFile" />
                <div class="mt-2 flex flex-wrap gap-2" data-node-id="178:815">
                  <button type="button"
                    class="h-[42px] rounded-[14px] bg-primary px-3.5 text-[12.5px] font-bold uppercase tracking-wide text-white shadow-primary-cta"
                    data-node-id="178:816" @click="pdfInputRef?.click()">
                    {{ t("l_Upload_pdf") }}
                  </button>
                  <button type="button"
                    class="h-[42px] rounded-[14px] border border-black/10 bg-white px-4 text-[12.5px] font-bold text-muted"
                    data-node-id="178:818" :disabled="!certificatePdf" :class="!certificatePdf && 'opacity-40'"
                    @click="clearPdf">
                    {{ t("l_Delete") }}
                  </button>
                </div>
                <p v-if="status === 'REJECTED'" class="mt-2 text-[11px] leading-snug text-error">
                  {{ t("l_Rejected_resubmit_hint") }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 rounded-[20px] border border-black/10 bg-white p-3.5 shadow-soft">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-bold tracking-[-0.2px] text-heading">
              {{ t("l_Kitchen_address_map") }}
            </span>
            <span class="text-[10px] font-bold tracking-[-0.2px] text-caption">
              {{ selectedLocationLabel }}
            </span>
          </div>
          <p class="mt-1 text-[11px] leading-snug text-caption">
            {{ t("l_Tap_map_select_kitchen") }}
          </p>
          <ClientOnly>
            <div class="h-[240px]">
              <LMap :zoom="mapZoom" :center="mapCenter"
                class="mt-3 w-full overflow-hidden rounded-[16px] border border-black/10" @click="onMapClick">
                <LTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" layer-type="base"
                  name="OpenStreetMap" />
                <LCircleMarker v-if="latitude !== null && longitude !== null" :lat-lng="[latitude, longitude]"
                  :radius="9" :weight="2" />
              </LMap>
            </div>
          </ClientOnly>
          <p v-if="latitude !== null && longitude !== null" class="mt-2 text-[11px] text-caption">
            {{ t("l_Latitude_longitude", { lat: latitude.toFixed(6), lng: longitude.toFixed(6) }) }}
          </p>
        </div>

        <p v-if="hint" class="mt-3 text-center text-xs text-red-500">
          {{ hint }}
        </p>

        <button v-if="showDocumentsBack" type="button"
          class="mt-4 w-full text-center text-[12px] font-bold text-primary underline-offset-2 hover:underline"
          @click="editingDocuments = false">
          {{ t("l_Back_to_status") }}
        </button>

        <button type="button"
          class="mt-6 flex h-14 w-full items-center justify-center rounded-[18px] bg-primary text-[17px] font-bold text-white shadow-[0_10px_24px_rgba(244,123,32,0.28)] disabled:opacity-45"
          :disabled="!canContinue || submitting" @click="onContinue">
          {{ submitting ? t("l_Submitting") : t("l_Continue") }}
        </button>
      </template>

      <div v-else-if="status === 'APPROVED'"
        class="mt-8 rounded-[20px] border border-black/10 bg-white p-5 text-center shadow-soft">
        <p class="text-[13px] text-caption">
          {{ t("l_Account_verified_redirect") }}
        </p>
      </div>

      <div v-else-if="fetchError"
        class="mt-8 rounded-[20px] border border-black/10 bg-white p-5 text-center shadow-soft">
        <p class="text-[13px] text-caption">{{ fetchError }}</p>
      </div>

      <div v-else class="mt-8 rounded-[20px] border border-black/10 bg-white p-5 text-center shadow-soft">
        <p class="text-[13px] text-caption">
          {{ t("l_Could_not_determine_verification") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();
import { LCircleMarker, LMap, LTileLayer } from "@vue-leaflet/vue-leaflet";
import type {
  CookVerificationGetResponse,
  CookVerificationSubmitPayload,
  VerificationStatus,
} from "~/types";

const imgCamera =
  "https://tap-tamak-production.up.railway.app/api/v1/uploads/gallery/8e334890-6a0d-43aa-9f68-547c511445bd.png";
const imgPdf =
  "https://tap-tamak-production.up.railway.app/api/v1/uploads/gallery/55800c1c-5aa4-4b1c-ad50-f9ca7581ad2b.png";

const MAX_KITCHEN = 6;
const MIN_KITCHEN = 3;
const MAX_PDF_BYTES = 10 * 1024 * 1024;
const ALMATY_CENTER: [number, number] = [43.238949, 76.889709];
const MAP_DEFAULT_ZOOM = 12;

const authStore = useAuthStore();
const nuxtApp = useNuxtApp();
const kitchenInputRef = ref<HTMLInputElement | null>(null);
const pdfInputRef = ref<HTMLInputElement | null>(null);

const kitchenPhotos = ref<{ previewUrl: string; file: File }[]>([]);
const certificatePdf = ref<{ name: string; file: File } | null>(null);
const hint = ref("");
const submitting = ref(false);
const latitude = ref<number | null>(null);
const longitude = ref<number | null>(null);
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
    PENDING: t("l_Verification_status_pending"),
    UNDER_REVIEW: t("l_Verification_status_under_review"),
    APPROVED: t("l_Verification_status_approved"),
    REJECTED: t("l_Verification_status_rejected"),
  };
  return m[status.value as VerificationStatus] ?? status.value;
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
  if (status.value === "APPROVED" || status.value === "UNDER_REVIEW")
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

const mapCenter = computed<[number, number]>(() => [
  ALMATY_CENTER[0],
  ALMATY_CENTER[1],
]);
const mapZoom = computed(() => MAP_DEFAULT_ZOOM);

const selectedLocationLabel = computed(() => {
  if (latitude.value === null || longitude.value === null) {
    return t("l_Not_selected");
  }
  return `${latitude.value.toFixed(4)}, ${longitude.value.toFixed(4)}`;
});

function apiMessage(
  err: unknown,
  fallback = t("l_Request_failed"),
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
      t("l_Failed_load_verification"),
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

async function signOut() {
  authStore.logout();
  await navigateTo("/login");
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
    certificatePdf.value?.file !== undefined &&
    latitude.value !== null &&
    longitude.value !== null,
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
    hint.value = t("l_Max_kitchen_photos_hint", { max: MAX_KITCHEN });
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
    hint.value = t("l_Need_pdf_file");
    return;
  }
  if (file.size > MAX_PDF_BYTES) {
    hint.value = t("l_Pdf_max_10mb");
    return;
  }
  certificatePdf.value = { name: file.name, file };
}

function clearPdf() {
  certificatePdf.value = null;
  if (pdfInputRef.value) pdfInputRef.value.value = "";
}

function onMapClick(event: { latlng?: { lat: number; lng: number } }) {
  if (!event.latlng) return;
  hint.value = "";
  latitude.value = event.latlng.lat;
  longitude.value = event.latlng.lng;
}

async function onContinue() {
  if (!canContinue.value || submitting.value) return;
  const cert = certificatePdf.value;
  if (!cert || latitude.value === null || longitude.value === null) {
    hint.value = t("l_Select_kitchen_on_map");
    return;
  }

  const payload: CookVerificationSubmitPayload = {
    kitchenPhotos: kitchenPhotos.value.map((photo: any) => photo.file),
    certificate: cert.file,
    latitude: latitude.value,
    longitude: longitude.value,
  };

  const form = new FormData();
  for (const p of payload.kitchenPhotos) {
    form.append("kitchenPhotos", p);
  }
  form.append("certificate", payload.certificate, cert.name);
  form.append("latitude", String(payload.latitude));
  form.append("longitude", String(payload.longitude));

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
    hint.value = apiMessage(err, t("l_Failed_send_documents"));
  } finally {
    submitting.value = false;
  }
}
</script>
