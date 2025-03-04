import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { tlYear } from "./BackgroundYear";
import { tlTexts } from "./TextAppear";
gsap.registerPlugin(CustomEase);

CustomEase.create(
  "_nInOut",
  "M0,0 C0.31,0.1 0.189,0.531 0.404,0.786 0.576,0.99 0.832,1 1,1"
);

const lerp = (start, end, amt) => {
  return (1 - amt) * start + amt * end;
};

const ui = {
  app: document.getElementById("app"),
  projectContainer: document.querySelector(".js-projects-container"),
  projects: document.querySelectorAll(".js-project"),
  thumbnailContainer: document.querySelector(".js-thumbnails-container"),
  thumbnails: document.querySelectorAll(".js-thumbnail"),
};

let userIsFocusing = false;
let currentProjectHovered = null;
const containerSizes = {
  width: 0,
  right: 0,
  bottom: 0,
  height: 0,
};
const thumbnailPos = {
  current: { x: 0, y: 0 },
  target: { x: 0, y: 0 },
  ease: 0.05,
};

const init = function () {
  handleResize();
  setupEventListeners();
};

const animateClipIn = function () {
  gsap.killTweensOf(ui.thumbnailContainer);
  gsap.set(ui.thumbnailContainer, { "--clipEnd": "0%" });
  gsap.set(ui.thumbnailContainer, { "--clipStart": "0%" });

  gsap.to(ui.thumbnailContainer, {
    "--clipStart": "100%",
    duration: 0.3,
    ease: "_nInOut",
  });
};

const animateClipOut = function () {
  gsap.to(ui.thumbnailContainer, {
    "--clipEnd": "100%",
    duration: 0.3,
    ease: "_nInOut",
  });
};

const setupEventListeners = function () {
  window.addEventListener("resize", handleResize);
  ui.projects.forEach((el) => {
    el.addEventListener("mouseenter", handleProjectMouseEnter);
    el.addEventListener("mouseleave", handleProjectMouseLeave);
  });
  ui.projectContainer.addEventListener("mouseenter", handleContainerMouseEnter);
  ui.projectContainer.addEventListener("mouseleave", handleContainerMouseLeave);
  ui.projectContainer.addEventListener("mousemove", handleContainerMouseMove);

  gsap.ticker.add(handleTick);

  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("keyup", handleDocumentKeyUp);

  window.addEventListener("load", handleWindowLoad);
};

const handleContainerMouseEnter = () => {
  ui.projectContainer.classList.add("is-hovering");
  animateClipIn();
};

const handleContainerMouseLeave = () => {
  ui.projectContainer.classList.remove("is-hovering");
  animateClipOut();
};

const handleProjectMouseEnter = (e) => {
  const { currentTarget } = e;
  currentTarget.classList.add("is-active");

  const oldHovered = currentProjectHovered;
  ui.thumbnails[oldHovered]?.classList.remove("is-active");

  currentProjectHovered = [...ui.projects].indexOf(currentTarget);
  ui.thumbnails[currentProjectHovered].classList.add("is-active");
};

const handleProjectMouseLeave = (e) => {
  const { currentTarget } = e;
  currentTarget.classList.remove("is-active");
};

const handleContainerMouseMove = (e) => {
  const { clientX, clientY } = e;
  const { right, width, height, bottom } = containerSizes;

  const posX = gsap.utils.clamp(0, 1, Math.max(0.001, right - clientX) / width);
  const posY = gsap.utils.clamp(
    -1,
    1,
    (Math.max(0.001, bottom - clientY) / height - 0.5) * 2
  );

  thumbnailPos.target.x = posX;
  thumbnailPos.target.y = posY;
};

const handleTick = () => {
  thumbnailPos.current.x = lerp(
    thumbnailPos.current.x,
    thumbnailPos.target.x,
    thumbnailPos.ease
  );
  thumbnailPos.current.y = lerp(
    thumbnailPos.current.y,
    thumbnailPos.target.y,
    thumbnailPos.ease
  );

  ui.thumbnailContainer.style.setProperty("--posX", thumbnailPos.current.x);
  ui.thumbnailContainer.style.setProperty("--posY", thumbnailPos.current.y);
};

const handleResize = () => {
  const { innerHeight } = window;

  document.documentElement.style.setProperty("--vh", `${innerHeight * 0.01}px`);

  const { right, width, bottom, height } =
    ui.projectContainer.getBoundingClientRect();
  containerSizes.width = width;
  containerSizes.right = right;
  containerSizes.bottom = bottom;
  containerSizes.height = height;
};

const handleDocumentClick = () => {
  if (!userIsFocusing) return;

  userIsFocusing = false;
  document.body.classList.remove("is-focusing");
};

const handleDocumentKeyUp = (e) => {
  if (userIsFocusing) return;

  if (e.code === "Tab") {
    userIsFocusing = true;
    document.body.classList.add("is-focusing");
  }
};

const handleWindowLoad = () => {
  gsap.to(ui.app, {
    opacity: 1,
    duration: 0.25,
    onComplete: () => {
      tlYear.play();
      gsap.delayedCall(0.5, () => {
        tlTexts.play();
      });
    },
  });
};

init();
