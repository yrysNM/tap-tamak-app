import { reactive } from 'vue'

export type PageToastKind = 'success' | 'error' | 'info'

export function usePageToast() {
  const open = ref(false)
  const message = ref('')
  const kind = ref<PageToastKind>('info')
  let timer: ReturnType<typeof setTimeout> | undefined

  function hide() {
    open.value = false
  }

  function show(msg: string, type: PageToastKind = 'info', ms = 3600) {
    message.value = msg
    kind.value = type
    open.value = true
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      open.value = false
    }, ms)
  }

  onBeforeUnmount(() => {
    if (timer) clearTimeout(timer)
  })

  return reactive({ open, message, kind, show, hide })
}
