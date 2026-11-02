import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

const wait = (tween) => new Promise((resolve) => tween.eventCallback("onComplete", resolve));

function whenImagesReady() {
  const images = [...document.images];
  return Promise.all(
    images.map((img) =>
      img.complete && img.naturalWidth
        ? Promise.resolve()
        : img.decode().catch(() => new Promise((r) => img.addEventListener("load", r, { once: true })))
    )
  );
}

/* Draw the hairline while fonts and images load, then lift the curtain. */
export async function preload({ reduced }) {
  const root = document.querySelector(".preloader");
  const bar = root.querySelector(".js-bar");
  const assets = Promise.all([document.fonts.ready, whenImagesReady()]);

  if (reduced) {
    await assets;
    root.remove();
    return;
  }

  gsap.from(root.querySelectorAll(".preloader__mark span > span"), {
    yPercent: 110,
    duration: 1.4,
    ease: "expo.out",
    stagger: 0.08,
  });

  await Promise.all([
    assets,
    wait(gsap.to(bar, { scaleX: 0.72, duration: 1.4, ease: "power2.out" })),
  ]);
  await wait(gsap.to(bar, { scaleX: 1, duration: 0.6, ease: "power2.inOut" }));
}

export function liftCurtain() {
  const root = document.querySelector(".preloader");
  if (!root) return Promise.resolve();

  const tl = gsap.timeline({ onComplete: () => root.remove() });
  tl.to(root.querySelectorAll(".preloader__mark span > span"), {
    yPercent: -110,
    duration: 0.8,
    ease: "expo.in",
    stagger: 0.05,
  }).to(
    root,
    {
      clipPath: "inset(0% 0% 100% 0%)",
      duration: 1.25,
      ease: "expo.inOut",
    },
    "-=0.2"
  );

  // Resolve slightly before the curtain finishes so the hero overlaps it.
  return new Promise((resolve) => tl.call(resolve, null, "-=0.75"));
}

/* Fit the giant name to the hero width. */
export function fitName() {
  const name = document.querySelector(".hero__name");
  const text = name.querySelector(".js-hero-name");
  const available = name.clientWidth;
  name.style.fontSize = "100px";
  // Negative tracking trims the last advance but not the glyph, so add it back.
  const tracking = parseFloat(getComputedStyle(name).letterSpacing) || 0;
  const measured = text.getBoundingClientRect().width - tracking;
  name.style.fontSize = `${(100 * available) / measured}px`;
}

export function splitHero() {
  const name = SplitText.create(".js-hero-name", { type: "chars", charsClass: "char" });
  const lede = SplitText.create(".js-hero-lede", {
    type: "lines",
    mask: "lines",
    linesClass: "split-line",
  });
  return { chars: name.chars, lines: lede.lines };
}

export function playHero({ chars, lines }, field) {
  const tl = gsap.timeline();
  gsap.set([".hero__name", ".hero__lede"], { visibility: "visible" });

  tl.from(chars, {
    yPercent: 125,
    duration: 1.8,
    ease: "expo.out",
    stagger: 0.055,
  })
    .from(
      lines,
      { yPercent: 110, duration: 1.4, ease: "expo.out", stagger: 0.08 },
      0.25
    )
    .to(
      ".js-hero-fade",
      { opacity: 1, duration: 1.2, ease: "power2.out", stagger: 0.08 },
      0.5
    )
    .from(".js-hero-fade", { y: 14, duration: 1.4, ease: "expo.out", stagger: 0.08 }, 0.5)
    .from(".nav > *", { yPercent: -120, opacity: 0, duration: 1.2, ease: "expo.out", stagger: 0.05 }, 0.3);

  if (field) {
    tl.to(field.material.uniforms.uIntro, { value: 1, duration: 2.6, ease: "power2.inOut" }, 0);
  }
  return tl;
}
