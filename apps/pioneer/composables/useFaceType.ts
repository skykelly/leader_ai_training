import type { TypewriterOptions } from './useTypewriter'

/**
 * 타이핑과 얼굴 파티클 진동을 함께 굴린다.
 *
 * 문단이 여럿이면(타이틀 → 리드문, 질문 → 다음 질문) 찍히는 구간이 이어지거나
 * 겹친다. 문단마다 진동을 껐다 켜면 그 사이가 깜빡이므로, 활성 문단 수를 세어
 * 마지막 하나가 끝날 때만 진동을 푼다.
 */

let active = 0

export function useFaceType() {
  const aura = useAura()
  const tw = useTypewriter()
  let counted = false

  function release() {
    if (!counted) return
    counted = false
    active = Math.max(0, active - 1)
    if (active === 0) aura.setFaceTyping(false)
  }

  function type(text: string, opts: TypewriterOptions = {}) {
    tw.type(text, {
      ...opts,
      onStart: () => {
        if (!counted) {
          counted = true
          active += 1
        }
        if (active === 1) aura.setFaceTyping(true)
        opts.onStart?.()
      },
      // 글자마다 진폭이 튄다. 공백·줄바꿈은 건너뛰어 단어의 호흡이 살아난다
      onChar: (i, ch) => {
        if (ch !== ' ' && ch !== '\n') aura.faceTypePulse()
        opts.onChar?.(i, ch)
      },
      onEnd: () => {
        release()
        opts.onEnd?.()
      },
    })
  }

  function stop() {
    tw.stop()
    release()
  }

  onScopeDispose(release)

  return { text: tw.text, typing: tw.typing, type, stop }
}
