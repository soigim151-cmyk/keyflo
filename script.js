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

  /* ── Post viewer ── */
  const viewer = $("#postViewer");
  const media = $(".viewer-media", viewer);
  const likeBtn = $(".like", viewer);
  function openPost(post) {
    media.replaceChildren(post.cloneNode(true));
    media.firstChild.removeAttribute("tabindex");
    likeBtn.setAttribute("aria-pressed", "false");
    likeBtn.textContent = "♡";
    viewer.showModal();
  }
  posts.forEach(p => {
    p.addEventListener("click", () => openPost(p));
    p.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPost(p); } });
  });
  likeBtn.addEventListener("click", () => {
    const on = likeBtn.getAttribute("aria-pressed") !== "true";
    likeBtn.setAttribute("aria-pressed", String(on));
    likeBtn.textContent = on ? "♥" : "♡";
  });

  /* ── Story (highlight) viewer ── */
  const STORIES = {
    about:  { title: "ABOUT",  images: ["assets/post-694.png", "assets/post-715.png"] },
    scent:  { title: "SCENT",  images: ["assets/story-725.png", "assets/post-701.png"] },
    object: { title: "OBJECT", images: ["assets/post-720.png", "assets/post-717.png", "assets/post-700.png"] },
  };
  const DURATION = 4000;
  const story = $("#storyViewer");
  const bars = $(".story-bars", story);
  const storyImg = $(".story-img", story);
  let current = null, index = 0, timer;

  function showFrame() {
    clearTimeout(timer);
    const frames = current.images;
    storyImg.src = frames[index];
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
  [viewer, story].forEach(d => {
    $(".close", d).addEventListener("click", () => d.close());
    d.addEventListener("click", e => { if (e.target === d) d.close(); });
  });
})();
