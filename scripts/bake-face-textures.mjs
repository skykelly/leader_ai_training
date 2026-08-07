/**
 * 3D 헤드 모델(GLB) → 파티클 셰이더용 albedo / depth / normal 텍스처 베이킹.
 *
 * 왜 모델을 런타임에 싣지 않고 굽는가:
 *   GLB는 수십 MB지만 구운 텍스처는 수백 KB다. 런타임 구조(격자 파티클 →
 *   UV 샘플링 → depth 변위)는 그대로 두고, **입력의 품질만** 올린다.
 *
 * 이전 파이프라인(`make-face-textures.mjs`)은 정면 렌더 한 장에서 depth를
 * "추정"했다 — 실루엣 거리변환 + 코/안면 가우시안 prior + 조명 추세 제거.
 * 위에서 조명을 받은 렌더는 밝기를 그대로 깊이로 쓰면 이마가 코보다 앞으로
 * 나오기 때문이었다. 모델이 있으면 그 추정이 전부 필요 없다:
 *   depth  = 카메라 깊이 버퍼 (코가 앞이라는 게 계산 결과로 보장된다)
 *   normal = 실제 표면 법선 (유한차분 근사가 아니라)
 *   albedo = 조명 없는 기본 색 (detrend할 조명 성분 자체가 없다)
 *
 * 렌더는 헤드리스 Chromium + SwiftShader에서 three.js로 돌린다(검증 하네스와
 * 같은 환경). 새 런타임 의존성은 없다 — GLTFLoader는 three에 들어 있다.
 *
 * 사용법: node bake-face-textures.mjs <model.glb> [outDir] [--yaw=0] [--preview]
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * playwright-core는 검증용 도구라 package.json에 넣지 않는다(런타임 의존성 금지).
 * 설치 위치가 세션마다 다르므로 런타임에 찾고, 못 찾으면 방법을 알려준다.
 */
async function loadChromium() {
  const env = process.env.PLAYWRIGHT_CORE
  const tries = [
    'playwright-core',
    // 디렉터리 경로로 넘어오면 ESM은 그대로 못 읽는다 — 엔트리까지 붙여준다
    env && (env.endsWith('.mjs') || env.endsWith('.js') ? env : path.join(env, 'index.mjs')),
    env,
  ].filter(Boolean)
  for (const spec of tries) {
    try {
      return (await import(spec)).chromium
    } catch { /* 다음 후보 */ }
  }
  console.error(
    'playwright-core를 찾지 못했다. 설치된 경로를 PLAYWRIGHT_CORE로 넘길 것:\n' +
    '  PLAYWRIGHT_CORE=/path/to/node_modules/playwright-core node scripts/bake-face-textures.mjs ...',
  )
  process.exit(1)
}
const chromium = await loadChromium()

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MODEL = process.argv[2]
const OUT_DIR = process.argv.find((a, i) => i >= 3 && !a.startsWith('--')) ?? '.'
const YAW = Number((process.argv.find((a) => a.startsWith('--yaw=')) ?? '--yaw=0').slice(6))
const PITCH = Number((process.argv.find((a) => a.startsWith('--pitch=')) ?? '--pitch=0').slice(8))
const FIT = Number((process.argv.find((a) => a.startsWith('--fit=')) ?? '--fit=1.72').slice(6))
// 귀·목을 잘라내는 타원 (NDC 기준, 리프레이밍 후 화면이 -1..1)
const MASK_RX = Number((process.argv.find((a) => a.startsWith('--maskrx=')) ?? '--maskrx=0.56').slice(9))
const MASK_RY = Number((process.argv.find((a) => a.startsWith('--maskry=')) ?? '--maskry=1.02').slice(9))
const MASK_CY = Number((process.argv.find((a) => a.startsWith('--maskcy=')) ?? '--maskcy=0.06').slice(9))
const PREVIEW_ONLY = process.argv.includes('--preview')
const SIZE = 1024

if (!MODEL || !fs.existsSync(MODEL)) {
  console.error('사용법: node bake-face-textures.mjs <model.glb> [outDir] [--yaw=deg] [--pitch=deg] [--fit=1.72] [--preview]')
  process.exit(1)
}

const PAGE = `<!doctype html><html><head><meta charset="utf-8">
<script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script>
</head><body style="margin:0;background:#000">
<canvas id="c" width="${SIZE}" height="${SIZE}"></canvas>
<script type="module">
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const SIZE = ${SIZE}
const canvas = document.getElementById('c')
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true })
renderer.setPixelRatio(1)
renderer.setSize(SIZE, SIZE, false)
renderer.setClearColor(0x000000, 1)

const scene = new THREE.Scene()
const root = new THREE.Group()
scene.add(root)

const gltf = await new GLTFLoader().loadAsync('/model.glb')
const model = gltf.scene
root.add(model)

// 모델 방향을 먼저 준 뒤 바운딩박스를 잰다 — 회전 후의 실루엣이 화면을 채워야 한다
root.rotation.y = ${YAW} * Math.PI / 180
root.rotation.x = ${PITCH} * Math.PI / 180
root.updateMatrixWorld(true)

let box = new THREE.Box3().setFromObject(root)
const size = box.getSize(new THREE.Vector3())
const center = box.getCenter(new THREE.Vector3())
// 정면 실루엣이 텍스처 정사각형(-1..1)을 채우도록 맞춘다
const scale = ${FIT} / Math.max(size.x, size.y)
root.scale.setScalar(scale)
root.position.set(-center.x * scale, -center.y * scale, -center.z * scale)
root.updateMatrixWorld(true)
box = new THREE.Box3().setFromObject(root)

// 정투영 — 파티클 격자가 uv를 선형으로 훑으므로 베이킹도 평행투영이어야 한다.
// (런타임의 원근은 그 위에 따로 적용된다)
const DIST = 6
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 100)
camera.position.set(0, 0, DIST)
camera.lookAt(0, 0, 0)
camera.updateMatrixWorld(true)

// 뷰 공간 깊이 범위 — 이 구간을 0..1로 정규화해 8비트에 담는다
const nearZ = DIST - box.max.z
const farZ = DIST - box.min.z

const meshes = []
model.traverse((o) => { if (o.isMesh) meshes.push(o) })
const originalMats = meshes.map((m) => m.material)

// 귀·목은 원본 영상에 드러나지 않는다. 세로로 긴 타원 밖을 부드럽게 잘라낸다
// (커버리지 채널에서 지우므로 런타임 마스크가 자동으로 따라간다)
const depthMat = new THREE.ShaderMaterial({
  uniforms: {
    uNear: { value: nearZ },
    uFar: { value: farZ },
    uMaskRX: { value: ${MASK_RX} },
    uMaskRY: { value: ${MASK_RY} },
    uMaskCY: { value: ${MASK_CY} },
    // 자동 프레이밍은 마스크가 꺼진 실루엣을 봐야 한다 — 켜둔 채로 재면
    // 잘린 모양을 기준으로 크롭이 잡혀 얼굴 위치가 틀어진다
    uMaskOn: { value: 0 },
  },
  vertexShader: \`
    varying float vViewZ;
    varying vec2 vNdc;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vViewZ = -mv.z;
      gl_Position = projectionMatrix * mv;
      vNdc = gl_Position.xy / gl_Position.w;
    }\`,
  fragmentShader: \`
    precision highp float;
    uniform float uNear;
    uniform float uFar;
    uniform float uMaskRX;
    uniform float uMaskRY;
    uniform float uMaskCY;
    uniform float uMaskOn;
    varying float vViewZ;
    varying vec2 vNdc;
    void main() {
      // 1 = 카메라에 가까움(코), 0 = 멂. G에는 커버리지를 담는다 —
      // 이러면 런타임이 "얼굴이 있는가"를 albedo 밝기로 추정하지 않아도 된다
      // (밝기 기반 마스크는 어두운 입술을 구멍으로 만들었다)
      float d = clamp((uFar - vViewZ) / max(0.0001, uFar - uNear), 0.0, 1.0);
      vec2 e = vec2(vNdc.x / uMaskRX, (vNdc.y - uMaskCY) / uMaskRY);
      float keep = 1.0 - smoothstep(0.88, 1.04, length(e));
      gl_FragColor = vec4(d, mix(1.0, keep, uMaskOn), 0.0, 1.0);
    }\`,
  side: THREE.DoubleSide,
})

const normalMat = new THREE.ShaderMaterial({
  vertexShader: \`
    varying vec3 vN;
    void main() {
      vN = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }\`,
  fragmentShader: \`
    precision highp float;
    varying vec3 vN;
    void main() {
      // 뷰 공간 법선을 0..1로 인코딩. 배경(0.5,0.5,0.5)은 정면 법선과 같지만
      // 커버리지는 depth.g가 따로 알려주므로 문제되지 않는다
      gl_FragColor = vec4(normalize(vN) * 0.5 + 0.5, 1.0);
    }\`,
  side: THREE.DoubleSide,
})

function useAlbedo() {
  meshes.forEach((m, i) => {
    const src = originalMats[i]
    m.material = new THREE.MeshBasicMaterial({
      color: src && src.color ? src.color.clone() : new THREE.Color(0xffffff),
      vertexColors: !!m.geometry.attributes.color,
      side: THREE.DoubleSide,
    })
  })
}
function useMat(mat) { meshes.forEach((m) => { m.material = mat }) }

function shot(kind) {
  if (kind === 'albedo') useAlbedo()
  else if (kind === 'depth') useMat(depthMat)
  else if (kind === 'normal') useMat(normalMat)
  renderer.render(scene, camera)
  return canvas.toDataURL('image/png')
}

/**
 * 정투영 경계를 다시 잡는다. 모델에는 목·흉상이 붙어 있어 그대로 담으면
 * 얼굴이 화면의 1/3로 줄어든다 — 커버리지를 재서 머리만 잘라낸다.
 */
/** 보이는 표면의 깊이 범위로 다시 정규화 — 8비트를 알뜰히 쓴다 */
window.__setDepthRange = (near, far) => {
  depthMat.uniforms.uNear.value = near
  depthMat.uniforms.uFar.value = far
}
window.__depthRange = () => [depthMat.uniforms.uNear.value, depthMat.uniforms.uFar.value]

window.__setMask = (on) => { depthMat.uniforms.uMaskOn.value = on }

window.__reframe = (cx, cy, half) => {
  camera.left = cx - half
  camera.right = cx + half
  camera.top = cy + half
  camera.bottom = cy - half
  camera.updateProjectionMatrix()
}

window.__bake = shot
window.__info = {
  meshes: meshes.length,
  size: [size.x, size.y, size.z].map((v) => +v.toFixed(3)),
  scale: +scale.toFixed(4),
  nearZ: +nearZ.toFixed(3),
  farZ: +farZ.toFixed(3),
  hasVertexColor: meshes.map((m) => !!m.geometry.attributes.color),
}
window.__ready = true
</script></body></html>`

// --- 정적 서버: three 모듈 + 모델 + 페이지 ---------------------------------
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.glb': 'model/gltf-binary' }
const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0]
  if (url === '/bake.html') {
    res.writeHead(200, { 'content-type': 'text/html' })
    res.end(PAGE)
    return
  }
  const file = url === '/model.glb' ? MODEL : url.startsWith('/three/') ? path.join(ROOT, 'node_modules', url.slice(1)) : null
  if (!file || !fs.existsSync(file)) {
    res.writeHead(404)
    res.end('not found')
    return
  }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' })
  fs.createReadStream(file).pipe(res)
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const port = server.address().port

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader'],
})
const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE } })
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)) })
page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)))

await page.goto(`http://127.0.0.1:${port}/bake.html`)
await page.waitForFunction(() => window.__ready === true, { timeout: 180000 })
console.log('모델 정보:', JSON.stringify(await page.evaluate(() => window.__info)))

fs.mkdirSync(OUT_DIR, { recursive: true })

/** PNG(dataURL) → 행별 커버리지 폭. G채널(커버리지)로 센다 */
async function coverageRows() {
  const dataUrl = await page.evaluate(() => window.__bake('depth'))
  return await page.evaluate((url) => new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const cv = document.createElement('canvas')
      cv.width = img.width; cv.height = img.height
      const ctx = cv.getContext('2d')
      ctx.drawImage(img, 0, 0)
      const d = ctx.getImageData(0, 0, img.width, img.height).data
      const rows = []
      for (let j = 0; j < img.height; j++) {
        let n = 0, l = -1, r = -1
        for (let i = 0; i < img.width; i++) {
          if (d[(j * img.width + i) * 4 + 1] > 128) { n++; if (l < 0) l = i; r = i }
        }
        rows.push([n, l, r])
      }
      resolve(rows)
    }
    img.src = url
  }), dataUrl)
}

// --- 자동 프레이밍: 정수리 ~ 턱만 담는다 ---------------------------------
{
  const rows = await coverageRows()
  const headTop = rows.findIndex((r) => r[0] > SIZE * 0.04)
  let widest = headTop, widestN = 0
  for (let j = headTop; j < SIZE * 0.7; j++) if (rows[j][0] > widestN) { widestN = rows[j][0]; widest = j }
  // 턱: 최대폭(귀 부근) 아래에서 폭이 가장 좁아지는 지점. 그 아래는 목이라 다시 넓어진다
  let chin = widest, chinN = widestN
  for (let j = widest; j < SIZE * 0.9; j++) {
    if (rows[j][0] === 0) break
    if (rows[j][0] < chinN) { chinN = rows[j][0]; chin = j }
  }
  const headH = chin - headTop
  const top = Math.max(0, headTop - headH * 0.04)
  const bottom = Math.min(SIZE - 1, chin + headH * 0.06)
  let minX = SIZE, maxX = 0
  for (let j = Math.round(top); j <= Math.round(bottom); j++) {
    if (rows[j][1] >= 0 && rows[j][1] < minX) minX = rows[j][1]
    if (rows[j][2] > maxX) maxX = rows[j][2]
  }
  // 픽셀 → NDC(카메라가 -1..1을 덮고 있으므로 선형 변환)
  const toNdcX = (i) => (i / SIZE) * 2 - 1
  const toNdcY = (j) => 1 - (j / SIZE) * 2
  const cxN = (toNdcX(minX) + toNdcX(maxX)) / 2
  const cyN = (toNdcY(top) + toNdcY(bottom)) / 2
  // 여백을 조금 남겨 파티클이 잘리지 않게 한다
  const half = Math.max(toNdcX(maxX) - toNdcX(minX), toNdcY(top) - toNdcY(bottom)) / 2 / 0.92
  console.log(`자동 프레이밍: 정수리 j=${headTop}, 최대폭 j=${widest}(${widestN}px), 턱 j=${chin}(${chinN}px) → 중심(${cxN.toFixed(3)}, ${cyN.toFixed(3)}) 반폭 ${half.toFixed(3)}`)
  await page.evaluate(([x, y, h]) => window.__reframe(x, y, h), [cxN, cyN, half])
  // 크롭이 정해진 다음에 귀·목 마스크를 켠다
  await page.evaluate(() => window.__setMask(1))
}

// --- 깊이 재정규화: 보이는 앞면만의 범위로 8비트를 꽉 채운다 ---------------
{
  const dataUrl = await page.evaluate(() => window.__bake('depth'))
  const stat = await page.evaluate((url) => new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const cv = document.createElement('canvas')
      cv.width = img.width; cv.height = img.height
      cv.getContext('2d').drawImage(img, 0, 0)
      const d = cv.getContext('2d').getImageData(0, 0, img.width, img.height).data
      let lo = 255, hi = 0
      for (let o = 0; o < d.length; o += 4) {
        if (d[o + 1] < 200) continue // 커버리지 밖(마스크로 지워진 곳 포함)
        if (d[o] < lo) lo = d[o]
        if (d[o] > hi) hi = d[o]
      }
      resolve([lo, hi])
    }
    img.src = url
  }), dataUrl)
  const [near0, far0] = await page.evaluate(() => window.__depthRange())
  const span = far0 - near0
  // d = (far - viewZ)/span 이므로 d가 [lo,hi]인 구간의 viewZ를 새 near/far로 잡는다
  const newFar = far0 - (stat[0] / 255) * span
  const newNear = far0 - (stat[1] / 255) * span
  await page.evaluate(([n, f]) => window.__setDepthRange(n, f), [newNear, newFar])
  console.log(`깊이 재정규화: 사용 구간 ${stat[0]}~${stat[1]}/255 → near ${newNear.toFixed(3)} far ${newFar.toFixed(3)}`)
}

const kinds = PREVIEW_ONLY ? ['albedo'] : ['albedo', 'depth', 'normal']
for (const kind of kinds) {
  const dataUrl = await page.evaluate((k) => window.__bake(k), kind)
  const buf = Buffer.from(dataUrl.split(',')[1], 'base64')
  const out = path.join(OUT_DIR, `face-${kind}.png`)
  fs.writeFileSync(out, buf)
  console.log(`저장: ${out} (${(buf.length / 1024).toFixed(0)} KB)`)
}

if (errors.length) console.log('errors:', JSON.stringify(errors.slice(0, 4)))
await browser.close()
server.close()
console.log('완료')
