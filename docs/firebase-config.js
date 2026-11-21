/* 댓글을 모든 방문자에게 공유하기 위한 Firebase 설정.
   Firebase 콘솔 → 프로젝트 설정 → 내 앱(웹)에 나오는 firebaseConfig 값을 아래 null 자리에 붙여넣으세요.
   이 값은 공개되어도 되는 웹 앱 식별 정보이며, 접근 제한은 firestore.rules가 담당합니다.
   null로 두면 댓글은 각 방문자의 브라우저에만 저장됩니다. */
window.KEYFLO_FIREBASE = null;
