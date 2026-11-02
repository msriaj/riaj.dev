import gsap from "gsap";

const finePointer = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/* Per-character roll on hover. The visible copy is aria-hidden; screen
   readers get a plain text twin. */
export function initRoll(root = document) {
  root.querySelectorAll("[data-roll]").forEach((el) => {
    const text = el.textContent.trim();
    const roll = document.createElement("span");
    roll.className = "roll";
    roll.setAttribute("aria-hidden", "true");

    [...text].forEach((ch, i) => {
      const span = document.createElement("span");
      span.className = "roll__ch";
      span.style.setProperty("--i", i);
      span.textContent = ch;
      roll.appendChild(span);
    });

    const label = document.createElement("span");
    label.className = "sr-only";
    label.textContent = text;

    el.textContent = "";
    el.append(roll, label);
  });
}

export function initCursor() {
  if (!finePointer()) return;

  const cursor = document.querySelector(".cursor");
  const label = cursor.querySelector(".js-cursor-label");
  document.documentElement.classList.add("has-cursor");
  cursor.classList.add("is-hidden");

  const xTo = gsap.quickTo(cursor, "x", { duration: 0.55, ease: "power3" });
  const yTo = gsap.quickTo(cursor, "y", { duration: 0.55, ease: "power3" });
  let seen = false;

  window.addEventListener(
    "pointermove",
    (e) => {
      if (!seen) {
        gsap.set(cursor, { x: e.clientX, y: e.clientY });
        cursor.classList.remove("is-hidden");
        seen = true;
      }
      xTo(e.clientX);
      yTo(e.clientY);
    },
    { passive: true }
  );

  document.addEventListener("pointerover", (e) => {
    const target = e.target.closest("[data-cursor], a, button");
    const text = target?.dataset.cursor;
    cursor.classList.toggle("is-label", Boolean(text));
    cursor.classList.toggle("is-link", Boolean(target) && !text);
    if (text) label.textContent = text;
  });

  document.documentElement.addEventListener("pointerleave", () => {
    cursor.classList.add("is-hidden");
    seen = false;
  });
}

export function initMagnetic() {
  if (!finePointer()) return;

  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    const xTo = gsap.quickTo(el, "x", { duration: 1.2, ease: "elastic.out(1, 0.45)" });
    const yTo = gsap.quickTo(el, "y", { duration: 1.2, ease: "elastic.out(1, 0.45)" });

    el.addEventListener("pointermove", (e) => {
      const rect = el.getBoundingClientRect();
      xTo((e.clientX - (rect.left + rect.width / 2)) * 0.18);
      yTo((e.clientY - (rect.top + rect.height / 2)) * 0.32);
    });
    el.addEventListener("pointerleave", () => {
      xTo(0);
      yTo(0);
    });
  });
}

export function initClock() {
  const clocks = document.querySelectorAll(".js-clock");
  const format = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  let last = "";

  const tick = () => {
    const now = format.format(new Date());
    if (now === last) return;
    last = now;
    const [h, m] = now.split(":");
    clocks.forEach((el) => {
      el.innerHTML = `${h}<i>:</i>${m}`;
    });
  };

  tick();
  setInterval(tick, 1000);
}

/* Floating image preview for the "also built" list. */
export function initPreview() {
  if (!finePointer()) return;

  const preview = document.querySelector(".preview");
  const list = document.querySelector(".js-index");
  if (!preview || !list) return;

  const images = [...preview.querySelectorAll("img")];
  const pos = { x: 0, y: 0, tx: 0, ty: 0 };
  let active = false;

  const show = (key) => {
    images.forEach((img) => img.classList.toggle("is-active", img.dataset.preview === key));
    if (!active) {
      pos.x = pos.tx;
      pos.y = pos.ty;
    }
    active = true;
    preview.style.visibility = "visible";
    preview.classList.add("is-active");
  };

  const hide = () => {
    active = false;
    preview.classList.remove("is-active");
  };

  // Track globally: rows can slide under a still pointer while scrolling.
  window.addEventListener(
    "pointermove",
    (e) => {
      pos.tx = e.clientX;
      pos.ty = e.clientY;
    },
    { passive: true }
  );

  list.querySelectorAll(".index__row").forEach((row) => {
    row.addEventListener("pointerenter", () => {
      const key = row.dataset.preview;
      key ? show(key) : hide();
    });
  });
  list.addEventListener("pointerleave", hide);

  gsap.ticker.add(() => {
    const dx = pos.tx - pos.x;
    pos.x += dx * 0.11;
    pos.y += (pos.ty - pos.y) * 0.11;
    const rotate = gsap.utils.clamp(-10, 10, dx * 0.06);
    const w = preview.offsetWidth;
    const h = preview.offsetHeight;
    preview.style.transform = `translate3d(${pos.x + w * 0.18}px, ${pos.y - h / 2}px, 0) rotate(${rotate}deg)`;
  });
}

/* Full-screen menu. Lenis pauses underneath while it's open. */
export function initMenu(lenis) {
  const toggle = document.querySelector(".js-menu-toggle");
  const menu = document.querySelector(".menu");
  if (!toggle || !menu) return;

  const root = document.documentElement;
  let open = false;

  const tl = gsap
    .timeline({ paused: true })
    .set(menu, { visibility: "visible" })
    .to(menu, { clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: "expo.inOut" })
    .from(
      menu.querySelectorAll(".menu__link > span"),
      { yPercent: 110, duration: 1.2, ease: "expo.out", stagger: 0.06 },
      "-=0.5"
    )
    .from(
      menu.querySelectorAll(".menu__foot > *"),
      { opacity: 0, y: 14, duration: 1, ease: "expo.out", stagger: 0.06 },
      "-=1"
    );

  const set = (state) => {
    if (state === open) return;
    open = state;
    toggle.setAttribute("aria-expanded", String(state));
    menu.setAttribute("aria-hidden", String(!state));
    root.classList.toggle("menu-open", state);
    if (state) {
      lenis?.stop();
      tl.timeScale(1).play();
    } else {
      lenis?.start();
      tl.timeScale(1.5).reverse();
    }
  };

  toggle.addEventListener("click", () => set(!open));
  menu.querySelectorAll(".menu__link").forEach((link) => {
    link.addEventListener("click", () => set(false));
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") set(false);
  });
}
