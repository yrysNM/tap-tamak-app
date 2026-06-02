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

function parseDateYmd(dateYmd: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateYmd.split("-").map((part) => Number(part));
  return { year, month, day };
}

function parseTimeHm(timeHm: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeHm.split(":").map((part) => Number(part));
  return { hours, minutes };
}

/** Build UTC instants from local calendar date + local clock time. */
function toUtcIsoFromLocal(dateYmd: string, timeHm: string): string {
  const { year, month, day } = parseDateYmd(dateYmd);
  const { hours, minutes } = parseTimeHm(timeHm);
  return new Date(year, month - 1, day, hours, minutes, 0, 0).toISOString();
}

export function buildSchedulePatchPayload(
  dateYmd: string,
  startHm: string,
  endHm: string,
): CookSchedulePatchPayload {
  return {
    workStartAt: toUtcIsoFromLocal(dateYmd, startHm),
    workEndAt: toUtcIsoFromLocal(dateYmd, endHm),
  };
}

export function toLocalDateYmd(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function toLocalTimeFromIso(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function toLocalDateYmdFromIso(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return toLocalDateYmd(d);
}

/** @deprecated Use toLocalTimeFromIso — schedule inputs are local time. */
export function toUtcTimeFromIso(iso: string | null): string {
  return toLocalTimeFromIso(iso);
}

export function formatScheduleLocalRange(
  workStartAt: string | null,
  workEndAt: string | null,
): string {
  if (!workStartAt || !workEndAt) return "";
  const start = toLocalTimeFromIso(workStartAt);
  const end = toLocalTimeFromIso(workEndAt);
  if (!start || !end) return "";
  return `${start} - ${end}`;
}
