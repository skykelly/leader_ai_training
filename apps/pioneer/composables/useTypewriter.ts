/**
 * 한 글자씩 찍히는 텍스트 출력.
 *
 * 원본은 녹음된 음성을 재생하지만, 여기서는 문장을 화면에 타이핑한다 —
 * 오디오 에셋도, 브라우저 음성 엔진 의존도, 자동재생 정책 문제도 없다.
 * 글자가 찍히는 리듬을 그대로 콜백으로 흘려보내 얼굴 파티클 진동에 물린다.
 *
 * 타이머는 경과 시간 기준으로 목표 인덱스를 계산한다 — setInterval 누적 방식은
 * 탭이 백그라운드로 갔다 오면 밀린 만큼 한꺼번에 튀거나 어긋난다.
 */

export interface TypewriterOptions {
  /** 글자당 밀리초 (기본 82ms ≈ 초당 12자) */
  charDelay?: number
  /** 글자가 찍힐 때마다 호출 — 진동 펄스에 쓴다 */
  onChar?: (index: number, char: string) => void
  onStart?: () => void
  onEnd?: () => void
}

export function useTypewriter() {
  const text = ref('')
  const typing = ref(false)

  let raf: number | undefined
  let endTimer: ReturnType<typeof setTimeout> | undefined

  function stop() {
    if (raf !== undefined) cancelAnimationFrame(raf)
    clearTimeout(endTimer)
    raf = undefined
    endTimer = undefined
    typing.value = false
  }

  function type(full: string, opts: TypewriterOptions = {}) {
    stop()
    const { charDelay = 82 } = opts

    // 모션을 줄이는 사용자에게는 타이핑도 진동도 없이 문장을 그대로 보여준다
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      text.value = full
      opts.onEnd?.()
      return
    }

    text.value = ''
    typing.value = true
    opts.onStart?.()

    const start = performance.now()
    let shown = 0

    const step = () => {
      const target = Math.min(full.length, Math.floor((performance.now() - start) / charDelay))
      while (shown < target) {
        opts.onChar?.(shown, full[shown]!)
        shown++
      }
      text.value = full.slice(0, shown)

      if (shown < full.length) {
        raf = requestAnimationFrame(step)
        return
      }
      raf = undefined
      // 마지막 글자의 여운을 조금 남기고 진동을 푼다
      endTimer = setTimeout(() => {
        typing.value = false
        opts.onEnd?.()
      }, 320)
    }
    raf = requestAnimationFrame(step)
  }

  /** 타이핑을 건너뛰고 문장을 완성한다 */
  function finish(full: string, opts: Pick<TypewriterOptions, 'onEnd'> = {}) {
    stop()
    text.value = full
    opts.onEnd?.()
  }

  onScopeDispose(stop)

  return { text, typing, type, finish, stop }
}
