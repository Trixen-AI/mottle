import { useEffect, useRef } from 'react'
import { resetFont, SCENES } from '@/lib/dotArt'

const FILL = { width: '100%', height: '100%' } as const

type Props = { scene: string; className?: string; label?: string; offset?: number }

// Renders one scene from the dot grammar. DPR-sharp, paused while offscreen,
// a single still frame under prefers-reduced-motion.
export function DotCanvas({ scene, className, label, offset = 0 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const draw = SCENES[scene]
    if (!ctx || !draw) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0
    let h = 0
    let raf = 0
    let visible = false
    const start = performance.now()

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const box = canvas.getBoundingClientRect()
      w = box.width
      h = box.height
      // cap the bitmap so a mis-sized box can never balloon the backing store
      canvas.width = Math.min(4096, Math.max(1, Math.round(w * dpr)))
      canvas.height = Math.min(4096, Math.max(1, Math.round(h * dpr)))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      resetFont(ctx)
    }

    const frame = (now: number) => {
      const t = reduced ? 2.4 + offset : (now - start) / 1000 + offset
      ctx.clearRect(0, 0, w, h)
      // hidden canvases (display:none menus) have no size; nothing to draw
      if (w > 1 && h > 1) {
        try {
          draw(ctx, w, h, t)
        } catch (err) {
          console.warn(`scene ${scene} failed`, err)
          return
        }
      }
      if (!reduced && visible) raf = requestAnimationFrame(frame)
    }

    const ro = new ResizeObserver(() => {
      resize()
      if (reduced || !visible) frame(performance.now())
    })
    ro.observe(canvas)

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        cancelAnimationFrame(raf)
        if (visible) raf = requestAnimationFrame(frame)
      },
      { rootMargin: '100px' },
    )
    io.observe(canvas)

    resize()
    frame(performance.now())
    // repaint once the web fonts arrive, since some scenes draw text
    // (only when idle: a running loop picks the fonts up on its next frame)
    document.fonts?.ready.then(() => {
      resetFont(ctx)
      if (reduced || !visible) frame(performance.now())
    })

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
    }
  }, [scene, offset])

  // sized by its box (never by its bitmap), so resizing the bitmap cannot feed back into layout
  return <canvas ref={ref} className={className} style={FILL} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} />
}
