import {
  useCallback,
  useEffect,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react'

/**
 * Lets a mouse user drag a horizontally scrolling row (touch already scrolls
 * natively). A drag suppresses the click that follows so chips and links do
 * not activate accidentally.
 */
export function useDragScroll<T extends HTMLElement>(ref: RefObject<T | null>) {
  const state = useRef({
    dragging: false,
    startX: 0,
    startScroll: 0,
    moved: false,
  })

  const onPointerDown = useCallback(
    (event: ReactPointerEvent) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return
      const el = ref.current
      if (!el) return
      state.current = {
        dragging: true,
        startX: event.clientX,
        startScroll: el.scrollLeft,
        moved: false,
      }
    },
    [ref]
  )

  useEffect(() => {
    function onMove(event: PointerEvent) {
      const el = ref.current
      const current = state.current
      if (!el || !current.dragging) return
      const dx = event.clientX - current.startX
      if (Math.abs(dx) > 3) current.moved = true
      el.scrollLeft = current.startScroll - dx
    }

    function onEnd() {
      state.current.dragging = false
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onEnd)
    window.addEventListener('pointercancel', onEnd)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onEnd)
      window.removeEventListener('pointercancel', onEnd)
    }
  }, [ref])

  const onClickCapture = useCallback((event: ReactMouseEvent) => {
    if (!state.current.moved) return
    event.preventDefault()
    event.stopPropagation()
    state.current.moved = false
  }, [])

  return { onPointerDown, onClickCapture }
}
