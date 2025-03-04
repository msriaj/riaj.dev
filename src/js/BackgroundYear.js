import gsap from "gsap";

const ui = {
  yearLight: document.querySelector(".js-year-light"),
  yearDark: document.querySelector(".js-year-dark"),
};

const tlYear = gsap.timeline({ paused: true });

const animateYear = function () {
  const numberPath = ui.yearLight.querySelector("path");
  const length = numberPath.getTotalLength();
  ui.yearLight.style.strokeDasharray = length;
  ui.yearLight.style.strokeDashoffset = length;
  ui.yearDark.style.strokeDasharray = length;
  ui.yearDark.style.strokeDashoffset = length;

  tlYear
    .to(
      ui.yearDark,
      {
        strokeDashoffset: length * 2,
        duration: 3,
        ease: "circ.out",
      },
      "svg"
    )
    .fromTo(
      ui.yearDark,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.5,
        ease: "sine.inOut",
      },
      "svg"
    )
    .to(
      ui.yearLight,
      {
        strokeDashoffset: length * 2,
        duration: 3,
        ease: "circ.out",
      },
      "svg+=.3"
    )
    .fromTo(
      ui.yearLight,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.5,
        ease: "sine.inOut",
      },
      "svg+=.3"
    );
};
animateYear();

export { tlYear };
