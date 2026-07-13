export interface Stage {
  eyebrow: string
  title: string
  body: string
}

/** 히어로 로그 티커에 흐르는 가짜 보안 이벤트 — noise(원시) → signal(정제) 교차 */
export const logLines: { text: string; kind: 'noise' | 'signal' }[] = [
  { text: '[04:12:07] edr-7 ▸ process_creation cmd.exe … dedup', kind: 'noise' },
  { text: '[04:12:08] fw-edge ▸ conn_denied 10.2.4.1:445 … drop', kind: 'noise' },
  { text: '[04:12:08] okta ▸ auth_success j.park … normalized', kind: 'signal' },
  { text: '[04:12:09] cloudtrail ▸ PutObject s3://logs … routed → lake', kind: 'signal' },
  { text: '[04:12:10] edr-3 ▸ dns_query telemetry.up… … filtered', kind: 'noise' },
  { text: '[04:12:11] gw-mail ▸ attachment_scan clean … dedup', kind: 'noise' },
  { text: '[04:12:12] crowdstrike ▸ detect T1059.001 … routed → siem', kind: 'signal' },
  { text: '[04:12:13] vpc-flow ▸ 172.16.0.9→8.8.8.8 udp/53 … sampled', kind: 'noise' },
  { text: '[04:12:14] okta ▸ mfa_challenge k.lee … normalized', kind: 'signal' },
  { text: '[04:12:15] fw-edge ▸ conn_allowed 443 outbound … drop(dup)', kind: 'noise' },
  { text: '[04:12:16] guardduty ▸ Recon:EC2 PortProbe … routed → siem', kind: 'signal' },
  { text: '[04:12:17] edr-7 ▸ file_write %TEMP%\\a.tmp … filtered', kind: 'noise' },
  { text: '[04:12:18] azuread ▸ signin_risk medium … enriched(geo)', kind: 'signal' },
  { text: '[04:12:19] nginx ▸ 200 GET /health … drop(noise)', kind: 'noise' },
  { text: '[04:12:20] wazuh ▸ integrity_change /etc/passwd … routed → siem', kind: 'signal' },
  { text: '[04:12:21] edr-2 ▸ registry_read HKLM\\SOFTWARE … dedup', kind: 'noise' },
  { text: '[04:12:22] cloudtrail ▸ AssumeRole ops-runner … normalized', kind: 'signal' },
  { text: '[04:12:23] fw-core ▸ nat_translation … sampled', kind: 'noise' },
  { text: '[04:12:24] snyk ▸ vuln_found CVE-2026-1187 … routed → jira', kind: 'signal' },
  { text: '[04:12:25] edr-5 ▸ heartbeat ok … drop', kind: 'noise' },
]

/** 가상의 보안 데이터 파이프라인 플랫폼 "CONDUIT" — Monad를 학습용으로 재해석한 자체 제작 콘텐츠 */
export const stages: Stage[] = [
  {
    eyebrow: 'Collect',
    title: '50개 툴의 로그를\n한 곳으로',
    body: '방화벽, EDR, 클라우드 감사 로그까지 — 형식도 속도도 제각각인 보안 데이터를 하나의 입구로 모읍니다.',
  },
  {
    eyebrow: 'Normalize',
    title: '형식을 하나로\n맞춥니다',
    body: '툴마다 다른 스키마를 공통 포맷으로 변환해, 어떤 소스에서 왔든 같은 방식으로 질의할 수 있게 합니다.',
  },
  {
    eyebrow: 'Filter',
    title: '노이즈는 걷어내고\n신호만 남깁니다',
    body: '중복·저가치 이벤트를 걸러내 SIEM으로 들어가는 볼륨을 줄이고, 탐지에 필요한 신호만 통과시킵니다.',
  },
  {
    eyebrow: 'Route',
    title: '목적지까지\n정확하게',
    body: '정제된 데이터를 SIEM, 데이터 레이크, 알림 채널 등 팀이 실제로 쓰는 곳으로 라우팅합니다.',
  },
]
