import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

const show = (el) => gsap.set(el, { visibility: "visible" });

export function initReveals() {
  gsap.utils.toArray('[data-reveal="lines"]').forEach((el) => {
    SplitText.create(el, {
      type: "lines",
      mask: "lines",
      linesClass: "split-line",
      autoSplit: true,
      onSplit(self) {
        show(el);
        return gsap.from(self.lines, {
          yPercent: 112,
          duration: 1.35,
          ease: "expo.out",
          stagger: 0.085,
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      },
    });
  });

  gsap.utils.toArray('[data-reveal="chars"]').forEach((el) => {
    SplitText.create(el, {
      type: "lines,words,chars",
      mask: "lines",
      linesClass: "split-line",
      charsClass: "char",
      autoSplit: true,
      onSplit(self) {
        show(el);
        return gsap.from(self.chars, {
          yPercent: 115,
          duration: 1.2,
          ease: "expo.out",
          stagger: 0.022,
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        });
      },
    });
  });

  gsap.utils.toArray(".js-rule").forEach((el) => {
    gsap.to(el, {
      scaleX: 1,
      duration: 1.8,
      ease: "expo.inOut",
      scrollTrigger: { trigger: el, start: "top 94%", once: true },
    });
  });

  // Statement lights up word by word as you read it.
  const statement = document.querySelector(".js-scrub");
  if (statement) {
    SplitText.create(statement, {
      type: "words",
      wordsClass: "word",
      autoSplit: true,
      onSplit(self) {
        return gsap.fromTo(
          self.words,
          { opacity: 0.13 },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.1,
            scrollTrigger: {
              trigger: statement,
              start: "top 78%",
              end: "bottom 52%",
              scrub: 0.6,
            },
          }
        );
      },
    });
  }

  gsap.utils.toArray("[data-count]").forEach((el) => {
    const end = Number(el.dataset.count);
    const pad = Number(el.dataset.pad || 0);
    const counter = { value: 0 };
    gsap.to(counter, {
      value: end,
      duration: 2.2,
      ease: "expo.out",
      scrollTrigger: { trigger: el, start: "top 92%", once: true },
      onUpdate: () => {
        el.textContent = String(Math.round(counter.value)).padStart(pad, "0");
      },
    });
  });

  // Rows and small parts rise in small staggered batches.
  const batched = ".index__row, .timeline__row, .contact__col, .project__tags li";
  gsap.set(batched, { opacity: 0, y: 28 });
  ScrollTrigger.batch(batched, {
    start: "top 94%",
    once: true,
    onEnter: (els) =>
      gsap.to(els, {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: "expo.out",
        stagger: 0.07,
        overwrite: true,
      }),
  });

  gsap.from(".footer", {
    opacity: 0,
    y: 20,
    duration: 1.2,
    ease: "expo.out",
    scrollTrigger: { trigger: ".footer", start: "top bottom", once: true },
  });

  // The email eases in with the section.
  gsap.from(".contact__email", {
    y: 40,
    opacity: 0,
    duration: 1.4,
    ease: "expo.out",
    scrollTrigger: { trigger: ".contact__email", start: "top 92%", once: true },
  });
}

/* Hero exits with depth: the name's letters lift at slightly different
   rates, the copy rises and fades. */
export function initHeroScroll(chars) {
  const hero = document.querySelector(".hero");
  const trigger = { trigger: hero, start: "top top", end: "bottom top", scrub: true };

  // Uses `y` (px) so it never fights the intro's `yPercent` tween.
  if (chars?.length) {
    gsap.to(chars, {
      y: (i, el) => -el.offsetHeight * (0.1 + ((i * 37) % 5) * 0.06),
      ease: "none",
      scrollTrigger: trigger,
    });
  }

  gsap.to([".hero__top", ".hero__meta"], {
    yPercent: -40,
    opacity: 0,
    ease: "none",
    scrollTrigger: { ...trigger, end: "60% top" },
  });
}
