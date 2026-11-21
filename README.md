# KEYFLO

KEYFLO 향수 브랜드의 인스타그램 스타일 프로필 페이지입니다. Figma 디자인(`iPhone 18 Pro - 2`, node 505:410)을 HTML/CSS/JS로 구현했습니다.

## 실행

빌드 과정이 없는 정적 사이트입니다. `docs/index.html`을 브라우저로 열면 됩니다.

```bash
python3 -m http.server 8000 -d docs
```

## 기능

- 팔로우 / 팔로잉 토글 (팔로워 수 반영, 브라우저에 저장)
- 게시물 · 릴스 · 태그됨 탭 전환
- 게시물 크게 보기, 좋아요
- 하이라이트(ABOUT / SCENT / OBJECT) 스토리 뷰어
- Shop · 링크 → keyflo.com

## 구조

- `docs/index.html` 페이지 구조
- `docs/style.css` 디자인 수치. 1 디자인 px = `--u`이며, 402px 너비에서 1:1, 최대 520px까지 확대됩니다.
- `docs/script.js` 인터랙션
- `docs/assets/` Figma에서 내려받은 이미지와 아이콘

## 배포 (GitHub Pages)

Settings → Pages → Source: **Deploy from a branch** → Branch: `main` / `/docs` → Save
