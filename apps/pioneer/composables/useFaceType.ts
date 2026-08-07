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
        // 첫 단어의 링은 문장이 시작하는 순간 함께 나간다
        aura.faceTypeRing()
        opts.onStart?.()
      },
      // 단어가 끝날 때마다 확산 링을 하나 쏘고, 글자마다는 알갱이 진폭만 튄다.
      // 글자마다 링을 쏘면 82ms 간격이라 링이 대여섯 겹으로 겹쳐 다시
      // "출렁이는 파동"으로 뭉개진다 — 단어 간격(0.4~0.6초)이라야 한 겹씩 읽힌다
      onChar: (i, ch) => {
        if (ch === ' ' || ch === '\n') aura.faceTypeRing()
        else aura.faceTypePulse()
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

  /** 남은 글자를 건너뛰고 문장을 완성한다 — 클릭으로 건너뛸 때 쓴다 */
  function finish(text: string, onEnd?: () => void) {
    tw.finish(text, {
      onEnd: () => {
        release()
        onEnd?.()
      },
    })
  }

  onScopeDispose(release)

  return { text: tw.text, typing: tw.typing, type, finish, stop }
}
