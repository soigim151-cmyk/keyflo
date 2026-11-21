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
- 게시물을 누르면 전체 게시물을 스크롤로 보는 화면 (좋아요, 더블탭 좋아요, 공유, 휴대폰 뒤로가기로 닫힘)
- 하이라이트(ABOUT / SCENT / OBJECT) 스토리 뷰어
- Shop · 링크 → https://floranc.com/

## 게시물 글 고치기

`docs/posts.js`에서 1~9번 게시물의 본문(`caption`)과 게시 시간(`time`)을 고칠 수 있습니다. 줄바꿈은 `\n`, `#해시태그`는 자동으로 파란색이 됩니다.

## 댓글 저장 (Firebase)

- 닉네임은 사이트 전체 댓글 순서대로 `익명1`, `익명2`…가 자동으로 붙습니다(게시물별이 아니라 전체 기준). 삭제해도 다른 댓글의 번호는 바뀌지 않습니다. 접두어는 `docs/script.js`의 `NICK_PREFIX`에서 바꿀 수 있습니다.
- 자기가 쓴 댓글에만 `삭제` 버튼이 보입니다. 같은 기기·브라우저로 판단합니다.
- `docs/firebase-config.js`가 `null`이면 댓글은 각 방문자의 브라우저에만 남습니다.
- Firebase 웹 앱의 `firebaseConfig` 값을 넣으면 모든 방문자에게 공유됩니다. 필요한 설정은 아래와 같습니다.
  - Authentication → 로그인 방법 → **익명** 사용 설정
  - Firestore → 규칙에 `firestore.rules` 붙여넣기
- 저장 구조: `comments/c{번호}` = `{ post, num, text, uid, createdAt }`, `counters/comments` = `{ n }`
- 관리자는 Firebase 콘솔 → Firestore → 데이터에서 어떤 댓글이든 삭제할 수 있습니다.

## 1번 게시물 영상 넣기

`docs/assets/reel-1.mp4` 파일이 있으면 게시물 화면에서 자동 재생됩니다(무음 시작, 🔇 버튼으로 소리 켜기). 파일이 없으면 기존 이미지가 보입니다.

GitHub 웹 업로드는 파일당 25MB까지라서, 큰 영상은 먼저 압축하세요.

```bash
ffmpeg -i 원본.mov -vf "scale=720:-2" -c:v libx264 -crf 28 -preset slow -c:a aac -b:a 96k -movflags +faststart docs/assets/reel-1.mp4
```

## 구조

- `docs/index.html` 페이지 구조
- `docs/style.css` 디자인 수치. 1 디자인 px = `--u`이며, 402px 너비에서 1:1, 최대 520px까지 확대됩니다.
- `docs/script.js` 인터랙션
- `docs/assets/` Figma에서 내려받은 이미지와 아이콘

## 배포 (GitHub Pages)

Settings → Pages → Source: **Deploy from a branch** → Branch: `main` / `/docs` → Save
