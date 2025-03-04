import gsap from "gsap";

const ui = {
  pres: document.querySelectorAll(".js-pre"),
  titles: document.querySelectorAll(".js-title"),
  projects: document.querySelectorAll(".js-project-link"),
  contacts: document.querySelectorAll(".js-contact-link"),
  aboutDesktop: document.querySelector(".js-about-desktop"),
  aboutMobile: document.querySelector(".js-about-mobile"),
  aboutLinesDesktop: [],
  aboutLinesMobile: [],
};

const tlTexts = gsap.timeline({ paused: true });

const textsAppear = function () {
  tlTexts
    .fromTo(
      ui.pres,
      {
        y: "101%",
      },
      {
        y: 0,
        stagger: 0.1,
        duration: 0.75,
        ease: "power4.out",
      },
      "texts"
    )
    .fromTo(
      ui.titles,
      {
        y: "101%",
      },
      {
        y: 0,
        stagger: 0.1,
        duration: 0.85,
        ease: "power4.out",
      },
      "texts+=.1"
    )
    .to(
      ui.aboutLinesDesktop,
      {
        y: 0,
        stagger: 0.1,
        duration: 0.75,
        ease: "power4.out",
      },
      "texts+=.2"
    )
    .to(
      ui.aboutLinesMobile,
      {
        y: 0,
        stagger: 0.1,
        duration: 0.75,
        ease: "power4.out",
      },
      "texts+=.2"
    )
    .to(
      ui.projects,
      {
        y: 0,
        stagger: 0.1,
        duration: 0.45,
        ease: "power4.out",
      },
      "texts+=0.3"
    )
    .fromTo(
      ui.contacts,
      {
        y: "101%",
      },
      {
        y: 0,
        stagger: 0.1,
        duration: 0.75,
        ease: "power4.out",
      },
      "texts+=0.4"
    );
};

const aboutCopySplit = function (wrapper, device) {
  const splittedStrings = wrapper.innerHTML.split("<br>");
  let htmlString = "";
  splittedStrings.forEach((el) => {
    htmlString += `<span class="js-about-line"><span>${el}</span></span>`;
  });
  wrapper.innerHTML = htmlString;

  if (device === "desktop") {
    ui.aboutLinesDesktop = document.querySelectorAll(
      ".js-about-desktop > .js-about-line > span"
    );
  } else {
    ui.aboutLinesMobile = document.querySelectorAll(
      ".js-about-mobile > .js-about-line > span"
    );
  }
};

aboutCopySplit(ui.aboutDesktop, "desktop");
aboutCopySplit(ui.aboutMobile, "mobile");
textsAppear();

export { tlTexts };
