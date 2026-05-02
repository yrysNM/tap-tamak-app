import type { CookSchedule, CookSchedulePatchPayload } from "~/types";

type UnknownRecord = Record<string, unknown>;

function isIsoLike(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function toNullableIso(value: unknown): string | null {
  return isIsoLike(value) ? value : null;
}

export function unwrapCookSchedule(raw: unknown): CookSchedule {
  const envelope =
    raw && typeof raw === "object" && "data" in (raw as UnknownRecord)
      ? ((raw as UnknownRecord).data as unknown)
      : raw;
  const data = (envelope ?? {}) as UnknownRecord;
  return {
    workStartAt: toNullableIso(data.workStartAt),
    workEndAt: toNullableIso(data.workEndAt),
    isActiveNow: Boolean(data.isActiveNow),
  };
}

function toUtcIso(dateYmd: string, timeHm: string): string {
  const [year, month, day] = dateYmd.split("-").map((part) => Number(part));
  const [hours, minutes] = timeHm.split(":").map((part) => Number(part));
  return new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0)).toISOString();
}

export function buildSchedulePatchPayload(
  dateYmd: string,
  startHm: string,
  endHm: string,
): CookSchedulePatchPayload {
  return {
    workStartAt: toUtcIso(dateYmd, startHm),
    workEndAt: toUtcIso(dateYmd, endHm),
  };
}

export function toUtcTimeFromIso(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

