(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ── Toast ── */
  const toastEl = $("#toast");
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1800);
  }

  /* ── Follow ── */
  const followBtn = $("#followBtn");
  const followerCount = $("#followerCount");
  const BASE_FOLLOWERS = 8059;
  let following = false;
  try { following = localStorage.getItem("keyflo-following") === "1"; } catch {}
  function renderFollow() {
    followBtn.setAttribute("aria-pressed", String(following));
    followBtn.textContent = following ? "팔로잉" : "팔로우";
    followerCount.textContent = String(BASE_FOLLOWERS + (following ? 1 : 0));
  }
  followBtn.addEventListener("click", () => {
    following = !following;
    try { localStorage.setItem("keyflo-following", following ? "1" : "0"); } catch {}
    renderFollow();
    toast(following ? "KEYFLO를 팔로우했어요" : "팔로우를 취소했어요");
  });
  renderFollow();

  $("#messageBtn").addEventListener("click", () => toast("메시지 기능은 준비 중이에요"));
  $(".more").addEventListener("click", () => {
    if (navigator.share) {
      navigator.share({ title: "KEYFLO", url: location.href }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(location.href).then(() => toast("링크를 복사했어요"));
    }
  });

  /* ── Tabs ── */
  const indicatorX = { grid: 48.93, reels: 184.2, tagged: 318.1 };
  const tabs = $$(".tab");
  const posts = $$("#grid .post");
  const empty = $("#grid .empty");
  const indicator = $(".tab-indicator");
  function selectTab(name) {
    tabs.forEach(t => t.setAttribute("aria-selected", String(t.dataset.tab === name)));
    indicator.style.setProperty("--ix", indicatorX[name]);
    let shown = 0;
    posts.forEach(p => {
      const show = name === "grid" || (name === "reels" && p.dataset.type === "reel");
      p.hidden = !show;
      if (show) shown++;
    });
    empty.hidden = shown > 0;
  }
  tabs.forEach(t => t.addEventListener("click", () => selectTab(t.dataset.tab)));

  /* ── Post feed: tap a tile → scrollable list of every post, starting at that one ── */
  const feed = $("#feedView");
  const feedList = $(".feed-list", feed);
  const CAPTION = "Scent holds what time leaves behind.";
  let videoObserver;

  function buildMedia(post) {
    const tile = post.cloneNode(true);
    tile.removeAttribute("tabindex");
    tile.removeAttribute("hidden");
    const src = post.dataset.video;
    if (src) {
      const v = document.createElement("video");
      v.src = src;
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.preload = "metadata";
      v.setAttribute("playsinline", "");
      // No video file uploaded yet → drop the <video> and keep the image tile.
      v.addEventListener("error", () => tile.removeChild(v), { once: true });
      const sound = document.createElement("button");
      sound.type = "button";
      sound.className = "sound";
      sound.textContent = "🔇";
      sound.setAttribute("aria-label", "소리 켜기");
      sound.addEventListener("click", e => {
        e.stopPropagation();
        v.muted = !v.muted;
        sound.textContent = v.muted ? "🔇" : "🔊";
        sound.setAttribute("aria-label", v.muted ? "소리 켜기" : "소리 끄기");
      });
      v.addEventListener("loadeddata", () => tile.appendChild(sound), { once: true });
      // Show the video at its own shape (e.g. 16:9) like Instagram, instead of cropping it to the tile.
      v.addEventListener("loadedmetadata", () => {
        if (v.videoWidth && v.videoHeight) tile.style.aspectRatio = `${v.videoWidth} / ${v.videoHeight}`;
      }, { once: true });
      v.addEventListener("click", () => (v.paused ? v.play() : v.pause()));
      tile.appendChild(v);
    }
    return tile;
  }

  // Outline icons in the Instagram action-bar style (24px, 2px stroke, currentColor).
  const svg = (body, extra = "") =>
    `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${body}</svg>`;
  const ICONS = {
    heart: svg('<path d="M16.8 3.5c-2 0-3.6 1.1-4.8 2.9C10.8 4.6 9.2 3.5 7.2 3.5 4.3 3.5 2 5.9 2 9c0 5.7 8.1 10.7 10 11.5 1.9-.8 10-5.8 10-11.5 0-3.1-2.3-5.5-5.2-5.5Z"/>'),
    comment: svg('<path d="M20.7 16.4A9.5 9.5 0 1 0 17.4 20l3.6 1-1-3.6Z"/>'),
    repost: svg('<path d="M4 11V9a3 3 0 0 1 3-3h12"/><path d="m16 3 3 3-3 3"/><path d="M20 13v2a3 3 0 0 1-3 3H5"/><path d="m8 21-3-3 3-3"/>'),
    send: svg('<path d="M22 3 9.2 10.1"/><path d="M22 3 15 21l-5.8-10.9L2 6.6 22 3Z"/>'),
    bookmark: svg('<path d="M19 21 12 15.5 5 21V3h14v18Z"/>'),
    smile: svg('<circle cx="12" cy="12" r="10"/><path d="M8.5 14.5s1.2 2 3.5 2 3.5-2 3.5-2"/><path d="M9 9.5h.01M15 9.5h.01" stroke-width="2.6"/>'),
  };

  function buildItem(post) {
    const item = document.createElement("article");
    item.className = "feed-item";
    item.innerHTML = `
      <header class="feed-head">
        <span class="mini-avatar"><img src="assets/logo-keyflo.png" alt="" /></span>
        <strong>KEYFLO</strong><span class="dots" aria-hidden="true">···</span>
      </header>
      <div class="feed-media"></div>
      <div class="feed-actions">
        <button class="act like" type="button" aria-pressed="false" aria-label="좋아요">${ICONS.heart}</button>
        <button class="act comment" type="button" aria-label="댓글 달기">${ICONS.comment}</button>
        <button class="act repost" type="button" aria-pressed="false" aria-label="리포스트">${ICONS.repost}</button>
        <button class="act send" type="button" aria-label="공유">${ICONS.send}</button>
        <button class="act save" type="button" aria-pressed="false" aria-label="저장">${ICONS.bookmark}</button>
      </div>
      <p class="feed-likes"><b>여러 명</b>이 좋아합니다</p>
      <div class="feed-caption clamped"><p><strong>KEYFLO</strong> </p><button class="more-btn" type="button">더 보기</button></div>
      <ul class="feed-comments"></ul>
      <p class="feed-time"></p>
      <form class="feed-reply" autocomplete="off" hidden>
        <button class="act emoji" type="button" aria-label="이모티콘">${ICONS.smile}</button>
        <input type="text" name="reply" placeholder="댓글 달기..." aria-label="댓글 달기" maxlength="300" />
        <button class="post-btn" type="submit" disabled>게시</button>
      </form>`;
    const data = (window.KEYFLO_POSTS || [])[posts.indexOf(post)] || {};
    const captionBox = $(".feed-caption", item);
    const captionP = $("p", captionBox);
    // Hashtags become blue spans; everything else is inserted as plain text.
    (data.caption || CAPTION).split(/(#[^\s#]+)/).forEach(part => {
      if (!part) return;
      if (part.startsWith("#")) {
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = part;
        captionP.append(tag);
      } else captionP.append(part);
    });
    $(".more-btn", captionBox).addEventListener("click", () => captionBox.classList.remove("clamped"));
    $(".feed-time", item).textContent = data.time || "1일 전";
    $(".feed-media", item).appendChild(buildMedia(post));

    const toggle = btn => {
      const on = btn.getAttribute("aria-pressed") !== "true";
      btn.setAttribute("aria-pressed", String(on));
      return on;
    };
    const like = $(".like", item), likes = $(".feed-likes", item);
    const toggleLike = () => {
      const on = toggle(like);
      likes.innerHTML = on ? "<b>회원님</b> 외 <b>여러 명</b>이 좋아합니다" : "<b>여러 명</b>이 좋아합니다";
    };
    like.addEventListener("click", toggleLike);
    $(".feed-media", item).addEventListener("dblclick", () => {
      if (like.getAttribute("aria-pressed") !== "true") toggleLike();
    });
    $(".save", item).addEventListener("click", e => toast(toggle(e.currentTarget) ? "저장했어요" : "저장을 취소했어요"));
    $(".repost", item).addEventListener("click", e => toast(toggle(e.currentTarget) ? "리포스트했어요" : "리포스트를 취소했어요"));
    $(".send", item).addEventListener("click", () => {
      if (navigator.share) navigator.share({ title: "KEYFLO", url: location.href }).catch(() => {});
      else navigator.clipboard?.writeText(location.href).then(() => toast("링크를 복사했어요"));
    });

    // Comment box: 게시 lights up once there is text; comments are saved through commentStore
    // (shared via Firebase when configured, otherwise kept in this browser).
    const form = $(".feed-reply", item), input = $("input", form), postBtn = $(".post-btn", form);
    const postId = String(posts.indexOf(post) + 1);
    const list = $(".feed-comments", item);
    unsubscribers.push(commentStore.subscribe(postId, comments => {
      list.replaceChildren(...comments.map(c => {
        const li = document.createElement("li");
        const name = document.createElement("strong");
        name.textContent = NICK_PREFIX + c.num;
        li.append(name, " ", c.text);
        if (commentStore.isMine(c)) {
          const del = document.createElement("button");
          del.type = "button";
          del.className = "del-btn";
          del.textContent = "삭제";
          del.setAttribute("aria-label", `${NICK_PREFIX}${c.num} 댓글 삭제`);
          del.addEventListener("click", async () => {
            if (!window.confirm("이 댓글을 삭제할까요?")) return;
            try { await commentStore.remove(c); }
            catch (err) { console.error(err); toast("삭제하지 못했어요. 잠시 후 다시 시도해 주세요"); }
          });
          li.append(" ", del);
        }
        return li;
      }));
    }));
    input.addEventListener("input", () => { postBtn.disabled = !input.value.trim(); });
    // 💬 opens / closes the comment box.
    const commentBtn = $(".comment", item);
    commentBtn.setAttribute("aria-expanded", "false");
    commentBtn.addEventListener("click", () => {
      form.hidden = !form.hidden;
      commentBtn.setAttribute("aria-expanded", String(!form.hidden));
      if (!form.hidden) input.focus();
    });
    $(".emoji", item).addEventListener("click", () => { input.value += "🤍"; input.dispatchEvent(new Event("input")); input.focus(); });
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const text = input.value.trim().slice(0, 300);
      if (!text) return;
      postBtn.disabled = true;
      try {
        await commentStore.add(postId, text);
        input.value = "";
      } catch (err) {
        console.error(err);
        toast("댓글을 저장하지 못했어요. 잠시 후 다시 시도해 주세요");
        postBtn.disabled = false;
      }
    });
    return item;
  }

  /* ── Comment storage ──
     Every comment gets the next number from ONE site-wide counter (not per post), and is shown
     as NICK_PREFIX + number, e.g. 익명1, 익명2 … Numbers never shift when a comment is deleted.
     Only the browser that wrote a comment can delete it. */
  const NICK_PREFIX = "익명";

  // Shared store — Firebase Firestore + anonymous Auth (uid identifies "my" comments).
  //   comments/c{num}   = { post, num, text, uid, createdAt }
  //   counters/comments = { n }   ← last number handed out
  function firebaseStore(config) {
    const V = "10.12.2";
    let myUid = null;
    const ready = Promise.all([
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`),
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`),
    ]).then(async ([appMod, fs, authMod]) => {
      const app = appMod.initializeApp(config);
      const cred = await authMod.signInAnonymously(authMod.getAuth(app));
      myUid = cred.user.uid;
      return { fs, db: fs.getFirestore(app) };
    });
    return {
      isMine: c => !!myUid && c.uid === myUid,
      subscribe(postId, cb) {
        let stop = () => {}, cancelled = false;
        ready.then(({ fs, db }) => {
          if (cancelled) return;
          const q = fs.query(fs.collection(db, "comments"), fs.where("post", "==", postId));
          stop = fs.onSnapshot(q,
            snap => cb(snap.docs.map(d => d.data()).sort((a, b) => a.num - b.num)),
            err => console.error(err));
        }).catch(err => console.error(err));
        return () => { cancelled = true; stop(); };
      },
      async add(postId, text) {
        const { fs, db } = await ready;
        const counterRef = fs.doc(db, "counters", "comments");
        await fs.runTransaction(db, async tx => {
          const snap = await tx.get(counterRef);
          const num = (snap.exists() ? snap.data().n : 0) + 1;
          tx.set(counterRef, { n: num });
          tx.set(fs.doc(db, "comments", "c" + num), {
            post: postId, num, text, uid: myUid, createdAt: fs.serverTimestamp(),
          });
        });
      },
      async remove(c) {
        const { fs, db } = await ready;
        await fs.deleteDoc(fs.doc(db, "comments", "c" + c.num));
      },
    };
  }

  // Fallback when Firebase is not configured: comments stay in this browser only.
  function localStore() {
    const listeners = new Set();
    const read = () => { try { return JSON.parse(localStorage.getItem("keyflo-comments")) || []; } catch { return []; } };
    const write = all => {
      try { localStorage.setItem("keyflo-comments", JSON.stringify(all)); } catch {}
      listeners.forEach(l => l());
    };
    const nextNum = () => {
      let n = 0;
      try { n = Number(localStorage.getItem("keyflo-comment-seq")) || 0; } catch {}
      n += 1;
      try { localStorage.setItem("keyflo-comment-seq", String(n)); } catch {}
      return n;
    };
    return {
      isMine: () => true,
      subscribe(postId, cb) {
        const l = () => cb(read().filter(c => c.post === postId));
        listeners.add(l);
        l();
        return () => listeners.delete(l);
      },
      async add(postId, text) { write([...read(), { post: postId, num: nextNum(), text }]); },
      async remove(c) { write(read().filter(x => x.num !== c.num)); },
    };
  }

  const commentStore = window.KEYFLO_FIREBASE ? firebaseStore(window.KEYFLO_FIREBASE) : localStore();
  const unsubscribers = [];

  function openFeed(startPost) {
    const visible = posts.filter(p => !p.hidden);
    const items = visible.map(buildItem);
    feedList.replaceChildren(...items);
    feed.hidden = false;
    document.body.classList.add("feed-open");
    feed.scrollTop = 0;
    items[visible.indexOf(startPost)]?.scrollIntoView({ block: "start" });

    videoObserver?.disconnect();
    videoObserver = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) e.target.play().catch(() => {});
      else e.target.pause();
    }), { root: feed, threshold: 0.6 });
    $$("video", feedList).forEach(v => videoObserver.observe(v));

    history.pushState({ feed: true }, "");
    $(".feed-back", feed).focus({ preventScroll: true });
  }
  function closeFeed() {
    if (feed.hidden) return;
    videoObserver?.disconnect();
    $$("video", feedList).forEach(v => v.pause());
    feed.hidden = true;
    unsubscribers.splice(0).forEach(stop => stop());
    feedList.replaceChildren();
    document.body.classList.remove("feed-open");
  }
  const leaveFeed = () => (history.state?.feed ? history.back() : closeFeed());
  $(".feed-back", feed).addEventListener("click", leaveFeed);
  window.addEventListener("popstate", closeFeed);
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !feed.hidden) leaveFeed(); });

  posts.forEach(p => {
    p.addEventListener("click", () => openFeed(p));
    p.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openFeed(p); }
    });
  });

  /* ── Story (highlight) viewer ── */
  const STORIES = {
    about:  { title: "ABOUT",  images: ["card", "assets/post-715.png"] },
    scent:  { title: "SCENT",  images: ["assets/story-725.png", "assets/post-701.png"] },
    object: { title: "OBJECT", images: ["assets/post-720.png", "assets/post-717.png", "assets/post-700.png"] },
  };
  const DURATION = 4000;
  const story = $("#storyViewer");
  const bars = $(".story-bars", story);
  const storyImg = $(".story-img", story);
  const storyBg = $(".story-bg", story);
  const storyCard = $(".story-card", story);
  let current = null, index = 0, timer;

  function showFrame() {
    clearTimeout(timer);
    const frame = current.images[index];
    const isCard = frame === "card";
    storyCard.hidden = !isCard;
    storyImg.hidden = isCard;
    storyBg.hidden = isCard;
    if (!isCard) { storyImg.src = frame; storyBg.src = frame; }
    $$("span", bars).forEach((b, i) => {
      b.className = i < index ? "done" : i === index ? "active" : "";
      const bar = b.firstChild; bar.style.animation = "none"; bar.offsetWidth; bar.style.animation = "";
    });
    timer = setTimeout(next, DURATION);
  }
  function next() { if (index < current.images.length - 1) { index++; showFrame(); } else story.close(); }
  function prev() { if (index > 0) index--; showFrame(); }
  function openStory(key) {
    current = STORIES[key]; index = 0;
    $(".story-title", story).textContent = current.title;
    bars.style.setProperty("--dur", DURATION + "ms");
    bars.replaceChildren(...current.images.map(() => {
      const s = document.createElement("span"); s.appendChild(document.createElement("i")); return s;
    }));
    story.showModal();
    showFrame();
  }
  $$(".hl").forEach(b => b.addEventListener("click", () => openStory(b.dataset.story)));
  $(".story-nav.next", story).addEventListener("click", next);
  $(".story-nav.prev", story).addEventListener("click", prev);
  story.addEventListener("close", () => clearTimeout(timer));

  /* ── Shared dialog behaviour: close button + backdrop click ── */
  [story].forEach(d => {
    $(".close", d).addEventListener("click", () => d.close());
    d.addEventListener("click", e => { if (e.target === d) d.close(); });
  });
})();
