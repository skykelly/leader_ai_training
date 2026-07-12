/**
 * 파티클이 형태를 바꾸는 세 개의 목표 포인트 세트를 생성한다.
 * 모든 세트는 같은 개수(count)의 점을 가져야, 정점 셰이더에서 같은 인덱스의
 * 점이 자연스럽게 A→B→C로 자리를 옮겨가며 형태를 바꿀 수 있다.
 *
 * chaos: 흩어진 지식(파편화된 툴들)을 상징하는 무질서한 구름
 * bulb : "통찰(insight)"을 상징하는 전구 — 유리구 셸 + 베이스 + 필라멘트
 * globe: "공유된 전역 지식"을 상징하는 매끈한 구체
 */

function randRange(min: number, max: number) {
  return min + Math.random() * (max - min)
}

/** 반지름 r인 공(ball) 내부에 균일 분포하는 점 하나 */
function randomInBall(r: number): [number, number, number] {
  const u = Math.random()
  const radius = r * Math.cbrt(u)
  const theta = Math.random() * Math.PI * 2
  const phi = Math.acos(Math.random() * 2 - 1)
  return [radius * Math.sin(phi) * Math.cos(theta), radius * Math.sin(phi) * Math.sin(theta), radius * Math.cos(phi)]
}

/** 반지름 r인 구(sphere) 표면 위의 점 하나(살짝 두께를 줘 얇은 셸처럼) */
function randomOnShell(r: number, thickness = 0.04): [number, number, number] {
  const theta = Math.random() * Math.PI * 2
  const phi = Math.acos(Math.random() * 2 - 1)
  const radius = r + randRange(-thickness, thickness)
  return [radius * Math.sin(phi) * Math.cos(theta), radius * Math.sin(phi) * Math.sin(theta), radius * Math.cos(phi)]
}

export function generateShapes(count: number) {
  const chaos = new Float32Array(count * 3)
  const bulb = new Float32Array(count * 3)
  const globe = new Float32Array(count * 3)

  const bulbCount = Math.floor(count * 0.68)
  const baseCount = Math.floor(count * 0.17)
  const filamentCount = count - bulbCount - baseCount

  for (let i = 0; i < count; i++) {
    const ix = i * 3

    // chaos: 큰 구형 볼륨 안에 완전히 무질서하게
    const [cx, cy, cz] = randomInBall(2.4)
    chaos[ix] = cx
    chaos[ix + 1] = cy
    chaos[ix + 2] = cz

    // bulb: 유리구 셸 + 원통형 베이스 + 지그재그 필라멘트
    if (i < bulbCount) {
      const [x, y, z] = randomOnShell(0.56, 0.03)
      bulb[ix] = x
      bulb[ix + 1] = y + 0.18
      bulb[ix + 2] = z
    } else if (i < bulbCount + baseCount) {
      const t = (i - bulbCount) / baseCount
      const angle = Math.random() * Math.PI * 2
      const radius = 0.16 + Math.random() * 0.03
      bulb[ix] = Math.cos(angle) * radius
      bulb[ix + 1] = -0.28 - t * 0.22
      bulb[ix + 2] = Math.sin(angle) * radius
    } else {
      const t = (i - bulbCount - baseCount) / filamentCount
      const strand = i % 2 === 0 ? 1 : -1
      const y = -0.05 + t * 0.4
      const wiggle = Math.sin(t * Math.PI * 5) * 0.14
      bulb[ix] = wiggle + strand * 0.05
      bulb[ix + 1] = y
      bulb[ix + 2] = Math.cos(t * Math.PI * 5) * 0.06

      // 무시
      void 0
    }

    // globe: 매끈한 구체 표면 — 공유된 전역 지식
    const [gx, gy, gz] = randomOnShell(0.95, 0.008)
    globe[ix] = gx
    globe[ix + 1] = gy
    globe[ix + 2] = gz
  }

  return { chaos, bulb, globe }
}
