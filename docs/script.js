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
      v.addEventListener("click", () => (v.paused ? v.play() : v.pause()));
      tile.appendChild(v);
    }
    return tile;
  }

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
        <button class="like" type="button" aria-pressed="false" aria-label="좋아요">♡</button>
        <button class="share" type="button" aria-label="공유">↗</button>
      </div>
      <p class="feed-likes">좋아요 <span>0</span>개</p>
      <p class="feed-caption"><strong>KEYFLO</strong> </p>`;
    $(".feed-caption", item).append(post.dataset.caption || CAPTION);
    $(".feed-media", item).appendChild(buildMedia(post));
    const like = $(".like", item), count = $(".feed-likes span", item);
    const toggleLike = () => {
      const on = like.getAttribute("aria-pressed") !== "true";
      like.setAttribute("aria-pressed", String(on));
      like.textContent = on ? "♥" : "♡";
      count.textContent = on ? "1" : "0";
    };
    like.addEventListener("click", toggleLike);
    $(".feed-media", item).addEventListener("dblclick", () => {
      if (like.getAttribute("aria-pressed") !== "true") toggleLike();
    });
    $(".share", item).addEventListener("click", () => {
      if (navigator.share) navigator.share({ title: "KEYFLO", url: location.href }).catch(() => {});
      else navigator.clipboard?.writeText(location.href).then(() => toast("링크를 복사했어요"));
    });
    return item;
  }

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
