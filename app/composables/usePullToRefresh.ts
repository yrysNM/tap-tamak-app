import type { MaybeRefOrGetter } from "vue";
import { toValue } from "vue";

export interface UsePullToRefreshOptions {
  getScrollTarget: () => HTMLElement | null;
  disabled?: MaybeRefOrGetter<boolean>;
  threshold?: number;
  maxPull?: number;
}

export function usePullToRefresh(
  onRefresh: () => Promise<void>,
  options: UsePullToRefreshOptions,
) {
  const pullDistance = ref(0);
  const isRefreshing = ref(false);
  const threshold = options.threshold ?? 64;
  const maxPull = options.maxPull ?? 96;

  let startY = 0;
  let pulling = false;
  let activeScrollEl: HTMLElement | null = null;

  function isDisabled(): boolean {
    return toValue(options.disabled) === true;
  }

  function resetPull(): void {
    pulling = false;
    if (!isRefreshing.value) {
      pullDistance.value = 0;
    }
  }

  function onTouchStart(e: TouchEvent): void {
    if (isDisabled() || isRefreshing.value) return;
    activeScrollEl = options.getScrollTarget();
    if (!activeScrollEl || activeScrollEl.scrollTop > 0) return;
    if (e.touches.length !== 1) return;
    startY = e.touches[0]!.clientY;
    pulling = true;
  }

  function onTouchMove(e: TouchEvent): void {
    if (!pulling || isDisabled() || isRefreshing.value) return;
    activeScrollEl = activeScrollEl ?? options.getScrollTarget();
    if (!activeScrollEl || activeScrollEl.scrollTop > 0) {
      resetPull();
      return;
    }
    const delta = e.touches[0]!.clientY - startY;
    if (delta <= 0) {
      pullDistance.value = 0;
      return;
    }
    e.preventDefault();
    pullDistance.value = Math.min(maxPull, delta * 0.45);
  }

  async function onTouchEnd(): Promise<void> {
    if (!pulling) return;
    pulling = false;
    const shouldRefresh =
      pullDistance.value >= threshold && !isRefreshing.value && !isDisabled();
    if (!shouldRefresh) {
      pullDistance.value = 0;
      return;
    }
    isRefreshing.value = true;
    pullDistance.value = threshold;
    try {
      await onRefresh();
    } finally {
      isRefreshing.value = false;
      pullDistance.value = 0;
    }
  }

  let scrollEl: HTMLElement | null = null;

  function bindScrollTarget(): void {
    const el = options.getScrollTarget();
    if (!el || el === scrollEl) return;
    unbindScrollTarget();
    scrollEl = el;
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
  }

  function unbindScrollTarget(): void {
    if (!scrollEl) return;
    scrollEl.removeEventListener("touchstart", onTouchStart);
    scrollEl.removeEventListener("touchmove", onTouchMove);
    scrollEl.removeEventListener("touchend", onTouchEnd);
    scrollEl.removeEventListener("touchcancel", onTouchEnd);
    scrollEl = null;
  }

  onMounted(() => {
    nextTick(() => bindScrollTarget());
  });

  onBeforeUnmount(() => {
    unbindScrollTarget();
  });

  return { pullDistance, isRefreshing };
}
