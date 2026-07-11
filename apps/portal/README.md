# Portal — Scroll Study Library 메인 페이지

라이브러리들의 썸네일·활용 기술을 소개하는 블로그형 포털입니다. 배포 시 사이트 루트를 차지합니다.

- **데이터 단일 소스**: `data/libraries.ts` — 카드와 상세 페이지가 모두 여기서 생성됩니다.
  새 라이브러리를 추가하면 이 파일에 항목을 추가하고 `public/thumbs/<slug>.png` 썸네일을 넣으세요.
- 상세 페이지: `pages/library/[slug].vue` (기법 설명 + 라이브 데모/원본 링크)

## 실행

```bash
npm run dev --workspace apps/portal   # http://localhost:3002
```
