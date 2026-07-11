/**
 * 웨이브 path 생성기 — waaark의 시그니처 리퀴드 전환의 핵심.
 * 위/아래 두 개의 물결 가장자리 사이 영역을 하나의 path로 그린다.
 * (viewBox 0 0 100 100, preserveAspectRatio="none" 기준)
 *
 * top=100,bottom=100  → 높이 0 (화면 아래에 숨음)
 * top=0,  bottom=100  → 화면 전체 덮음
 * top=0,  bottom=0    → 높이 0 (화면 위로 빠져나감)
 *
 * crest 값은 곡선 제어점의 세로 오프셋 — 이동 중에만 부풀려서
 * "액체가 밀려 올라오는" 느낌을 만든다.
 */
export interface WaveState {
  top: number
  bottom: number
  crestTop: number
  crestBottom: number
}

export function wavePath(s: WaveState): string {
  return [
    `M 0 ${s.top}`,
    `C 30 ${s.top + s.crestTop}, 70 ${s.top + s.crestTop}, 100 ${s.top}`,
    `L 100 ${s.bottom}`,
    `C 70 ${s.bottom + s.crestBottom}, 30 ${s.bottom + s.crestBottom}, 0 ${s.bottom}`,
    'Z',
  ].join(' ')
}
