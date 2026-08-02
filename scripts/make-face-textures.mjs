/**
 * 정면 헤드 스컬프트 렌더 → 파티클 셰이더용 albedo + depth 텍스처 생성.
 *
 * 원본(preparetopioneer)이 쓰는 것과 같은 형식:
 *   - face-albedo.png : 파티클 색 + 밝기(=알파) 소스. 배경은 검정(=투명)
 *   - face-depth.png  : 파티클 z 변위 소스. 흰=앞(코), 검=뒤
 *
 * depth는 측면 뷰 없이 두 성분을 합성한다:
 *   저주파 볼륨  = 실루엣 거리변환 (머리를 타원체처럼 부풀림)
 *   고주파 디테일 = 클레이 렌더의 명암 (코·입술은 밝고 눈두덩은 어둡다)
 *
 * 사용법: node make-face-textures.mjs <input> [outDir]
 * 의존성: ffmpeg/ffprobe 만 사용 (npm 패키지 추가 없음)
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const INPUT = process.argv[2]
const OUT_DIR = process.argv[3] ?? '.'
const SIZE = 1024 // 원본도 1024 텍스처

if (!INPUT || !fs.existsSync(INPUT)) {
  console.error('사용법: node make-face-textures.mjs <input> [outDir]')
  process.exit(1)
}

const tmp = fs.mkdtempSync('/tmp/facetex-')
const rawPath = path.join(tmp, 'in.raw')

const probe = execFileSync('ffprobe', [
  '-v', 'error', '-select_streams', 'v:0',
  '-show_entries', 'stream=width,height', '-of', 'csv=p=0:s=x', INPUT,
]).toString().trim()
const [W, H] = probe.split('x').map(Number)
execFileSync('ffmpeg', ['-v', 'error', '-i', INPUT, '-f', 'rawvideo', '-pix_fmt', 'rgb24', rawPath, '-y'])
const src = fs.readFileSync(rawPath)
console.log(`입력: ${W}x${H}`)

const rgbAt = (x, y) => {
  const i = (y * W + x) * 3
  return [src[i], src[i + 1], src[i + 2]]
}
const lumAt = (x, y) => {
  const [r, g, b] = rgbAt(x, y)
  return (r * 0.299 + g * 0.587 + b * 0.114) / 255
}

// --- 1. 배경 밝기: 좌우 가장자리의 중앙값 --------------------------------
const bgSamples = []
for (let y = Math.round(H * 0.1); y < H * 0.7; y += 20) {
  bgSamples.push(lumAt(4, y), lumAt(W - 5, y))
}
bgSamples.sort((a, b) => a - b)
const bg = bgSamples[Math.floor(bgSamples.length / 2)]
// 전경: 배경과 충분히 다르고, 레터박스(거의 검정)도 아닌 픽셀
const isFg = (x, y) => {
  const l = lumAt(x, y)
  return Math.abs(l - bg) > 0.08 && l > 0.12
}
console.log(`배경 밝기: ${bg.toFixed(3)}`)

// --- 2. 행별 전경 폭 → 머리/목/어깨 경계 ---------------------------------
const rowSpan = []
for (let y = 0; y < H; y++) {
  let l = -1, r = -1, n = 0
  for (let x = 0; x < W; x++) if (isFg(x, y)) { n++; if (l < 0) l = x; r = x }
  rowSpan.push({ y, n, l, r })
}
const headTop = rowSpan.findIndex((s) => s.n > W * 0.05)
// 귀 부근 최대폭 → 그 아래에서 턱(최소폭) → 다시 넓어지면 어깨
let widest = headTop, widestN = 0
for (let y = headTop; y < H * 0.7; y++) if (rowSpan[y].n > widestN) { widestN = rowSpan[y].n; widest = y }
let chin = widest, chinN = widestN
for (let y = widest; y < H * 0.85; y++) if (rowSpan[y].n < chinN) { chinN = rowSpan[y].n; chin = y }
// 어깨: 턱 아래에서 폭이 최소폭의 1.5배를 넘는 첫 지점
let shoulder = H - 1
for (let y = chin; y < H; y++) if (rowSpan[y].n > chinN * 1.5) { shoulder = y; break }
console.log(`머리 상단 y=${headTop}, 최대폭 y=${widest}(${widestN}px), 턱 y=${chin}(${chinN}px), 어깨 y=${shoulder}`)

// 크롭 영역: 정수리 ~ 턱 아래 약간(목 일부 포함). 어깨는 제외
const cropBottom = Math.min(shoulder - 10, chin + Math.round((chin - headTop) * 0.12))
let minX = W, maxX = 0
for (let y = headTop; y <= cropBottom; y++) {
  if (rowSpan[y].l >= 0 && rowSpan[y].l < minX) minX = rowSpan[y].l
  if (rowSpan[y].r > maxX) maxX = rowSpan[y].r
}
const cx = (minX + maxX) / 2
const cy = (headTop + cropBottom) / 2
const cropSize = Math.max(maxX - minX, cropBottom - headTop) * 1.06
console.log(`크롭: 중심(${cx.toFixed(0)}, ${cy.toFixed(0)}) 한 변 ${cropSize.toFixed(0)}px`)

// --- 3. 정사각 리샘플 → albedo / 마스크 / 명암 ---------------------------
const albedo = Buffer.alloc(SIZE * SIZE * 3)
const shade = new Float32Array(SIZE * SIZE)
const mask = new Uint8Array(SIZE * SIZE)
const soft = new Float32Array(SIZE * SIZE) // 가장자리 페이드 계수

// 귀는 두상 실루엣 밖으로 튀어나와 파티클로 그리면 형태가 지저분해진다.
// 세로로 긴 타원 밖을 부드럽게 잘라 귀를 지운다(원본도 귀가 드러나지 않는다).
const EAR_RX = 0.355
const EAR_RY = 0.52
function smooth01(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

for (let j = 0; j < SIZE; j++) {
  for (let i = 0; i < SIZE; i++) {
    const sx = Math.round(cx + (i / SIZE - 0.5) * cropSize)
    const sy = Math.round(cy + (j / SIZE - 0.5) * cropSize)
    const o = j * SIZE + i
    if (sx < 0 || sx >= W || sy < 0 || sy >= H || sy > cropBottom || !isFg(sx, sy)) continue
    const ex = (i / SIZE - 0.5) / EAR_RX
    const ey = (j / SIZE - 0.5) / EAR_RY
    const er = Math.sqrt(ex * ex + ey * ey)
    const keep = 1 - smooth01(0.9, 1.04, er)
    if (keep <= 0.02) continue
    soft[o] = keep
    mask[o] = 1
    const [r, g, b] = rgbAt(sx, sy)
    // 클레이 색을 그대로 쓰되 배경 대비로 정규화 — 셰이더가 밝기를 알파로 쓰므로
    // 어두운 배경이 자연스럽게 투명이 된다
    const l = lumAt(sx, sy)
    const norm = Math.max(0, Math.min(1, (l - bg * 0.9) / (1 - bg * 0.9)))
    const scale = l > 0 ? (norm * keep) / l : 0
    albedo[o * 3] = Math.min(255, Math.round(r * scale))
    albedo[o * 3 + 1] = Math.min(255, Math.round(g * scale))
    albedo[o * 3 + 2] = Math.min(255, Math.round(b * scale))
    shade[o] = norm * keep
  }
}
const fgCount = mask.reduce((a, b) => a + b, 0)
console.log(`전경 픽셀: ${fgCount} (${((fgCount / (SIZE * SIZE)) * 100).toFixed(1)}%)`)

function blur(buf, radius) {
  const t = new Float32Array(buf.length)
  const w = []
  const sigma = radius / 2
  for (let k = -radius; k <= radius; k++) w.push(Math.exp(-(k * k) / (2 * sigma * sigma)))
  const wsum = w.reduce((a, b) => a + b, 0)
  for (let j = 0; j < SIZE; j++) for (let i = 0; i < SIZE; i++) {
    let s = 0
    for (let k = -radius; k <= radius; k++) s += buf[j * SIZE + Math.min(SIZE - 1, Math.max(0, i + k))] * w[k + radius]
    t[j * SIZE + i] = s / wsum
  }
  for (let j = 0; j < SIZE; j++) for (let i = 0; i < SIZE; i++) {
    let s = 0
    for (let k = -radius; k <= radius; k++) s += t[Math.min(SIZE - 1, Math.max(0, j + k)) * SIZE + i] * w[k + radius]
    buf[j * SIZE + i] = s / wsum
  }
}

// --- 3.5 입 지우기 -------------------------------------------------------
// 이목구비 중 입만 없앤다. 두 가지를 함께 처리해야 한다:
//
//  1) 입술은 클레이 렌더에서 너무 어두워 전경 판정(isFg)에 걸리지 않는다 —
//     albedo에 어두운 띠로 남는 게 아니라 아예 **마스크 구멍**으로 남는다.
//     그래서 먼저 타원 안쪽의 마스크를 메운다.
//  2) 메우는 값은 **가로 방향 보간**으로 만든다. 흐린 복사본을 섞는 방식은
//     소스에 입이 그대로 들어 있어 립 라인이 유령처럼 남는다. 이 부위의 명암은
//     거의 세로로만 변하므로(코→턱), 각 행을 타원 좌우 바깥값 사이로 이으면
//     세로 그라디언트는 보존한 채 입만 사라진다.
//
// 거리변환(4)보다 먼저 와야 한다 — 구멍이 남은 채로 거리를 재면 입 자리의
// 볼륨이 0이 되어 depth에도 골이 파인다.
const MOUTH = { cx: 0.548, cy: 0.886, rx: 0.135, ry: 0.082 }
{
  const chans = [shade, null, null, null] // [0]=shade, [1..3]=albedo r,g,b
  for (let c = 0; c < 3; c++) {
    const a = new Float32Array(SIZE * SIZE)
    for (let o = 0; o < a.length; o++) a[o] = albedo[o * 3 + c]
    chans[c + 1] = a
  }

  /** 이 행에서 타원이 차지하는 i 구간 (없으면 null) */
  function spanAt(j) {
    const dy = (j / SIZE - MOUTH.cy) / MOUTH.ry
    if (Math.abs(dy) >= 1) return null
    const half = MOUTH.rx * Math.sqrt(1 - dy * dy) * SIZE
    const cxPx = MOUTH.cx * SIZE
    return [Math.max(1, Math.round(cxPx - half)), Math.min(SIZE - 2, Math.round(cxPx + half))]
  }

  // 1) 마스크 구멍 메우기
  let filledMask = 0
  for (let j = 0; j < SIZE; j++) {
    const span = spanAt(j)
    if (!span) continue
    for (let i = span[0]; i <= span[1]; i++) {
      const o = j * SIZE + i
      if (mask[o]) continue
      mask[o] = 1
      soft[o] = 1
      filledMask++
    }
  }

  // 2) 가로 보간으로 값 채우기
  let touched = 0
  for (let j = 0; j < SIZE; j++) {
    const span = spanAt(j)
    if (!span) continue
    const [iL, iR] = span
    if (iR <= iL) continue
    const dy = (j / SIZE - MOUTH.cy) / MOUTH.ry
    // 위아래 경계에서는 서서히 섞여야 메운 자국이 가로줄로 드러나지 않는다
    const w = 1 - smooth01(0.72, 1.0, Math.abs(dy))
    for (const buf of chans) {
      const left = buf[j * SIZE + iL - 1]
      const right = buf[j * SIZE + iR + 1]
      for (let i = iL; i <= iR; i++) {
        const o = j * SIZE + i
        const t = (i - iL + 1) / (iR - iL + 2)
        buf[o] += (left + (right - left) * t - buf[o]) * w
        if (buf === shade) touched++
      }
    }
  }

  // 이은 자리의 미세한 각을 없앤다 — 타원 주변만 살짝 흐린다
  for (const buf of chans) {
    const soften = Float32Array.from(buf)
    blur(soften, 5)
    for (let j = 0; j < SIZE; j++) {
      for (let i = 0; i < SIZE; i++) {
        const o = j * SIZE + i
        if (!mask[o]) continue
        const dx = (i / SIZE - MOUTH.cx) / MOUTH.rx
        const dy2 = (j / SIZE - MOUTH.cy) / MOUTH.ry
        const w2 = 1 - smooth01(0.75, 1.3, Math.sqrt(dx * dx + dy2 * dy2))
        if (w2 > 0) buf[o] += (soften[o] - buf[o]) * w2
      }
    }
  }

  for (let c = 0; c < 3; c++) {
    const a = chans[c + 1]
    for (let o = 0; o < a.length; o++) {
      albedo[o * 3 + c] = Math.max(0, Math.min(255, Math.round(a[o])))
    }
  }
  console.log(`입 제거 — 마스크 구멍 ${filledMask}px, 값 보정 ${touched}px`)
}

// --- 4. 거리변환으로 저주파 볼륨 ----------------------------------------
const dist = new Float32Array(SIZE * SIZE)
{
  const INF = 1e9
  for (let o = 0; o < dist.length; o++) dist[o] = mask[o] ? INF : 0
  for (let j = 1; j < SIZE; j++) for (let i = 1; i < SIZE; i++) {
    const o = j * SIZE + i
    if (!mask[o]) continue
    dist[o] = Math.min(dist[o], dist[o - 1] + 1, dist[o - SIZE] + 1, dist[o - SIZE - 1] + 1.414)
  }
  for (let j = SIZE - 2; j >= 0; j--) for (let i = SIZE - 2; i >= 0; i--) {
    const o = j * SIZE + i
    if (!mask[o]) continue
    dist[o] = Math.min(dist[o], dist[o + 1] + 1, dist[o + SIZE] + 1, dist[o + SIZE + 1] + 1.414)
  }
}
let maxDist = 0
for (const d of dist) if (d < 1e8 && d > maxDist) maxDist = d
console.log(`거리변환 최대: ${maxDist.toFixed(0)}px`)

// --- 5. depth 합성 + 스무딩 ---------------------------------------------

// 명암은 잔 노이즈(피부 질감)를 담고 있으므로 살짝 흐린 뒤 디테일로 쓴다
const shadeSmooth = Float32Array.from(shade)
blur(shadeSmooth, 3)

// 조명 추세 제거(detrend): 이 렌더는 위쪽에서 빛이 와서 이마·정수리가 밝다.
// 그대로 깊이로 쓰면 이마가 코보다 앞으로 튀어나오므로, 행/열 평균이 만드는
// 저주파 조명 기울기를 빼고 "국소 돌출"만 디테일로 남긴다.
const shadeDetail = Float32Array.from(shadeSmooth)
{
  const trend = Float32Array.from(shadeSmooth)
  blur(trend, 90) // 넓게 흐리면 조명이 만든 저주파 성분만 남는다
  for (let o = 0; o < shadeDetail.length; o++) {
    shadeDetail[o] = mask[o] ? shadeDetail[o] - trend[o] : 0
  }
}
let sdMin = 1e9, sdMax = -1e9
for (let o = 0; o < shadeDetail.length; o++) {
  if (!mask[o]) continue
  if (shadeDetail[o] < sdMin) sdMin = shadeDetail[o]
  if (shadeDetail[o] > sdMax) sdMax = shadeDetail[o]
}
for (let o = 0; o < shadeDetail.length; o++) {
  shadeDetail[o] = mask[o] ? (shadeDetail[o] - sdMin) / (sdMax - sdMin || 1) : 0
}
console.log(`명암 디테일 범위(detrend 전): ${sdMin.toFixed(3)} ~ ${sdMax.toFixed(3)}`)

// 얼굴 정면 돌출 prior — 해부학적으로 코가 가장 앞이고, 그 주변(광대~미간)이
// 그 다음이다. 명암만으로는 위쪽 조명 탓에 이마가 최전방이 되어버리므로
// 좁고 강한 코 범프 + 넓고 약한 안면 범프를 겹쳐 순서를 바로잡는다.
function bump(u, v, cxN, cyN, sx, sy) {
  const dx = (u - cxN) / sx
  const dy = (v - cyN) / sy
  return Math.exp(-(dx * dx + dy * dy))
}
const facePrior = new Float32Array(SIZE * SIZE)
for (let j = 0; j < SIZE; j++) {
  for (let i = 0; i < SIZE; i++) {
    const o = j * SIZE + i
    if (!mask[o]) continue
    const u = i / SIZE, v = j / SIZE
    const nose = bump(u, v, 0.5, 0.7, 0.14, 0.17) // 코: 좁고 강하게
    const face = bump(u, v, 0.5, 0.6, 0.3, 0.26) // 안면 중앙: 넓고 약하게
    facePrior[o] = Math.min(1, nose * 0.72 + face * 0.42)
  }
}

const depth = new Float32Array(SIZE * SIZE)
for (let o = 0; o < depth.length; o++) {
  if (!mask[o]) continue
  // sqrt(거리)로 반구에 가까운 볼륨 — 가장자리는 급히 떨어지고 중앙은 완만하다
  const volume = Math.sqrt(Math.min(1, dist[o] / (maxDist * 0.92)))
  depth[o] = volume * 0.44 + facePrior[o] * 0.42 + shadeDetail[o] * 0.14
}
blur(depth, 5)
for (let o = 0; o < depth.length; o++) if (!mask[o]) depth[o] = 0

let dMin = 1e9, dMax = 0
for (let o = 0; o < depth.length; o++) {
  if (!mask[o]) continue
  if (depth[o] < dMin) dMin = depth[o]
  if (depth[o] > dMax) dMax = depth[o]
}
const depthBuf = Buffer.alloc(SIZE * SIZE * 3)
for (let o = 0; o < depth.length; o++) {
  const v = mask[o] ? Math.round(255 * ((depth[o] - dMin) / (dMax - dMin || 1))) : 0
  depthBuf[o * 3] = depthBuf[o * 3 + 1] = depthBuf[o * 3 + 2] = v
}
console.log(`depth 범위: ${dMin.toFixed(3)} ~ ${dMax.toFixed(3)}`)

// --- 6. 저장 -------------------------------------------------------------
fs.mkdirSync(OUT_DIR, { recursive: true })
function writePng(buf, name) {
  const raw = path.join(tmp, name + '.raw')
  fs.writeFileSync(raw, buf)
  const out = path.join(OUT_DIR, name)
  execFileSync('ffmpeg', [
    '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
    '-s', `${SIZE}x${SIZE}`, '-i', raw, out, '-y',
  ])
  console.log(`저장: ${out} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`)
}
writePng(albedo, 'face-albedo.png')
writePng(depthBuf, 'face-depth.png')

fs.rmSync(tmp, { recursive: true, force: true })
console.log('완료')
