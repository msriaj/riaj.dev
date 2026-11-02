import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "lenis/dist/lenis.css";
import "./styles/main.css";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

import Field from "./js/gl/Field.js";
import Gallery from "./js/gl/Gallery.js";
import { preload, liftCurtain, fitName, splitHero, playHero } from "./js/intro.js";
import { initReveals, initHeroScroll } from "./js/ui/reveals.js";
import {
  initRoll,
  initCursor,
  initMagnetic,
  initClock,
  initPreview,
  initMenu,
} from "./js/ui/interactions.js";

gsap.registerPlugin(ScrollTrigger, SplitText);

const root = document.documentElement;
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (!reduced) root.classList.add("js-motion");
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.scrollTo(0, 0);

/* Smooth scroll ------------------------------------------------------- */

let lenis = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
}

// Menu first: its close handler must run (and restart Lenis) before any
// scroll-to handler on the same link.
initMenu(lenis);

document.querySelectorAll("[data-scroll-to]").forEach((link) => {
  link.addEventListener("click", (e) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    if (lenis) {
      lenis.scrollTo(target, { duration: 1.8, force: true, easing: (t) => 1 - Math.pow(1 - t, 4) });
    } else {
      target.scrollIntoView();
    }
  });
});

/* Static UI ----------------------------------------------------------- */

initRoll();
initClock();
initCursor();
initMagnetic();


/* WebGL --------------------------------------------------------------- */

let heroField = null;
let contactField = null;
let gallery = null;

try {
  heroField = new Field(document.querySelector(".js-field-hero"), { seed: 0, light: [0.65, 0.75] });
  contactField = new Field(document.querySelector(".js-field-contact"), { seed: 17.3, light: [-0.55, 0.8] });
  contactField.material.uniforms.uIntro.value = 1;
  if (reduced) heroField.material.uniforms.uIntro.value = 1;
} catch (error) {
  console.warn("WebGL unavailable, falling back to static backgrounds.", error);
}

const hero = document.querySelector(".hero");
let staticFrames = 2;

gsap.ticker.add((time) => {
  const t = reduced ? 12 : time;
  if (reduced && staticFrames-- <= 0) return;
  const heroProgress = Math.min(window.scrollY / (hero.offsetHeight || 1), 1);
  heroField?.render(t, heroProgress);
  contactField?.render(t + 40, 0);
  gallery?.render(t, lenis ? lenis.velocity : 0);
});

/* Resize -------------------------------------------------------------- */

const onResize = () => {
  fitName();
  heroField?.resize();
  contactField?.resize();
  gallery?.resize();
  staticFrames = 2;
  ScrollTrigger.refresh();
};
window.addEventListener("resize", debounce(onResize, 150));

function debounce(fn, ms) {
  let id;
  return (...args) => {
    clearTimeout(id);
    id = setTimeout(() => fn(...args), ms);
  };
}

/* Boot ---------------------------------------------------------------- */

(async () => {
  await preload({ reduced });

  fitName();
  const heroSplit = splitHero();

  try {
    gallery = new Gallery(document.querySelector(".gl-gallery"));
    root.classList.add("has-gl");
    new ResizeObserver(() => gallery.measure()).observe(document.body);
  } catch (error) {
    console.warn("Gallery WebGL failed, showing plain images.", error);
  }

  initReveals();
  initPreview();

  if (reduced) {
    gsap.set([".hero__name", ".hero__lede", "[data-reveal]"], { visibility: "visible" });
  } else {
    await liftCurtain();
    playHero(heroSplit, heroField);
    initHeroScroll(heroSplit.chars);
  }

  root.classList.remove("is-loading");
  lenis?.start();
  ScrollTrigger.refresh();
})();
