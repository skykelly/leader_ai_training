/**
 * Web Speech API(SpeechSynthesis) 래퍼.
 *
 * 원본은 howler.js로 미리 녹음된 음성을 재생하지만, 여기서는 브라우저 내장
 * 음성 합성을 쓴다 — 오디오 에셋도, 런타임 의존성도 늘지 않는다.
 *
 * 발화 진행도(0..1)를 매 프레임 노출해 얼굴 파티클 진동에 물린다.
 * 음성 엔진이 없는 환경(헤드리스 등)에서도 모션은 그대로 재생되도록,
 * 글자 수로 추정한 길이를 폴백 타이머로 돌린다.
 */

export interface SpeakOptions {
  /** 단어 경계마다 호출 — 파티클 펄스에 쓴다 */
  onWord?: (charIndex: number) => void
  onStart?: () => void
  onEnd?: () => void
  lang?: string
  rate?: number
  pitch?: number
}

let speaking = false
let fallbackTimer: ReturnType<typeof setTimeout> | undefined
let wordTimer: ReturnType<typeof setInterval> | undefined

function supported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/** 영어 음성을 우선 고르되, 없으면 기본 음성을 쓴다 */
function pickVoice(lang: string) {
  if (!supported()) return null
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null
  const exact = voices.find((v) => v.lang.replace('_', '-').toLowerCase().startsWith(lang.toLowerCase()))
  return exact ?? voices.find((v) => v.lang.toLowerCase().startsWith('en')) ?? voices[0]
}

export function useSpeech() {
  function cancel() {
    clearTimeout(fallbackTimer)
    clearInterval(wordTimer)
    fallbackTimer = undefined
    wordTimer = undefined
    if (supported()) window.speechSynthesis.cancel()
    speaking = false
  }

  /**
   * 문장을 읽는다. 음성 재생 여부와 관계없이 onStart/onEnd는 항상 호출되므로
   * 호출부는 모션만 신경 쓰면 된다.
   */
  function speak(text: string, opts: SpeakOptions = {}) {
    if (speaking) cancel()
    const { lang = 'en-US', rate = 0.92, pitch = 1.02 } = opts
    speaking = true
    opts.onStart?.()

    // 실제 발화가 끝나지 않거나(엔진 없음) 이벤트가 안 오는 경우를 대비한 길이 추정.
    // 영어 기준 대략 초당 12자, 최소 1.6초
    const estimated = Math.max(1600, (text.length / 12) * 1000 / rate)

    const finish = () => {
      if (!speaking) return
      speaking = false
      clearInterval(wordTimer)
      wordTimer = undefined
      opts.onEnd?.()
    }

    if (supported()) {
      const u = new SpeechSynthesisUtterance(text)
      u.lang = lang
      u.rate = rate
      u.pitch = pitch
      const voice = pickVoice(lang)
      if (voice) u.voice = voice
      u.onboundary = (e) => opts.onWord?.(e.charIndex)
      u.onend = finish
      // 음성 엔진이 없거나 정책상 막혀도 모션은 그대로 재생한다 —
      // 여기서 finish()를 부르면 진동이 시작하자마자 꺼져버린다.
      // 종료는 아래 폴백 타이머가 책임진다.
      u.onerror = () => {}
      try {
        window.speechSynthesis.speak(u)
      } catch {
        /* 정책상 차단되어도 아래 폴백이 모션을 살린다 */
      }
    }

    // onboundary를 주지 않는 엔진이 많아 단어 타이밍을 직접 만든다
    const words = text.split(/\s+/).filter(Boolean)
    if (words.length) {
      const step = estimated / words.length
      let i = 0
      wordTimer = setInterval(() => {
        if (i >= words.length) {
          clearInterval(wordTimer)
          wordTimer = undefined
          return
        }
        opts.onWord?.(i)
        i++
      }, step)
    }

    clearTimeout(fallbackTimer)
    fallbackTimer = setTimeout(finish, estimated + 400)
  }

  /** 음성 목록은 비동기로 채워지므로 미리 워밍업해 첫 발화가 무음이 되지 않게 한다 */
  function warmUp() {
    if (!supported()) return
    window.speechSynthesis.getVoices()
  }

  return { speak, cancel, warmUp, isSupported: supported }
}
