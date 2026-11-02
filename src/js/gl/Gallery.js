import {
  LinearFilter,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Texture,
  Vector2,
  WebGLRenderer,
} from "three";
import gsap from "gsap";
import { mediaVert, mediaFrag } from "./shaders.js";

/*
  One fixed, transparent canvas behind the page. Every `.js-media` element
  gets a plane that tracks its DOM box each frame, so layout stays in CSS
  while the pixels go through a shader. The <img> stays in the DOM for
  accessibility and as the texture source; it's just made invisible.
*/
class Plane {
  constructor(el, geometry, scene) {
    this.el = el;
    this.img = el.querySelector("img");
    this.bounds = { top: 0, left: 0, width: 1, height: 1 };
    this.mouse = { target: new Vector2(0.5, 0.5), current: new Vector2(0.5, 0.5) };

    const texture = new Texture(this.img);
    texture.minFilter = LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;

    this.material = new ShaderMaterial({
      vertexShader: mediaVert,
      fragmentShader: mediaFrag,
      transparent: true,
      uniforms: {
        uTexture: { value: texture },
        uImageSize: { value: new Vector2(this.img.naturalWidth, this.img.naturalHeight) },
        uPlaneSize: { value: new Vector2(1, 1) },
        uMouse: { value: this.mouse.current },
        uHover: { value: 0 },
        uReveal: { value: 0 },
        uVelocity: { value: 0 },
        uParallax: { value: 0 },
        uTime: { value: 0 },
      },
    });

    this.mesh = new Mesh(geometry, this.material);
    scene.add(this.mesh);

    this.bindEvents();
    this.reveal();
  }

  bindEvents() {
    const u = this.material.uniforms;
    this.el.addEventListener("pointerenter", () => {
      gsap.to(u.uHover, { value: 1, duration: 1.1, ease: "expo.out", overwrite: true });
    });
    this.el.addEventListener("pointerleave", () => {
      gsap.to(u.uHover, { value: 0, duration: 1.1, ease: "expo.out", overwrite: true });
    });
    this.el.addEventListener("pointermove", (e) => {
      const rect = this.el.getBoundingClientRect();
      this.mouse.target.set(
        (e.clientX - rect.left) / rect.width,
        1 - (e.clientY - rect.top) / rect.height
      );
    });
  }

  reveal() {
    gsap.to(this.material.uniforms.uReveal, {
      value: 1,
      duration: 2.2,
      ease: "power3.out",
      scrollTrigger: { trigger: this.el, start: "top 88%", once: true },
    });
  }

  measure(scrollY) {
    const rect = this.el.getBoundingClientRect();
    this.bounds.top = rect.top + scrollY;
    this.bounds.left = rect.left;
    this.bounds.width = rect.width;
    this.bounds.height = rect.height;
    this.mesh.scale.set(rect.width, rect.height, 1);
    this.material.uniforms.uPlaneSize.value.set(rect.width, rect.height);
  }

  update(scrollY, viewport, velocity, time) {
    const { top, left, width, height } = this.bounds;
    const y = top - scrollY;
    const onScreen = y + height > -100 && y < viewport.height + 100;
    this.mesh.visible = onScreen;
    if (!onScreen) return;

    this.mesh.position.x = left + width / 2 - viewport.width / 2;
    this.mesh.position.y = viewport.height / 2 - y - height / 2;

    this.mouse.current.lerp(this.mouse.target, 0.08);

    const u = this.material.uniforms;
    u.uVelocity.value = velocity;
    u.uTime.value = time;
    u.uParallax.value = gsap.utils.clamp(-1, 1, (y + height / 2 - viewport.height / 2) / viewport.height);
  }
}

export default class Gallery {
  constructor(canvas) {
    this.canvas = canvas;
    this.viewport = { width: window.innerWidth, height: window.innerHeight };
    this.velocity = 0;

    this.renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);

    this.scene = new Scene();
    this.camera = new OrthographicCamera(-1, 1, 1, -1, -1000, 1000);
    this.geometry = new PlaneGeometry(1, 1, 24, 24);

    this.planes = [...document.querySelectorAll(".js-media")].map(
      (el) => new Plane(el, this.geometry, this.scene)
    );

    this.resize();
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.viewport = { width, height };
    this.renderer.setSize(width, height);
    this.camera.left = -width / 2;
    this.camera.right = width / 2;
    this.camera.top = height / 2;
    this.camera.bottom = -height / 2;
    this.camera.updateProjectionMatrix();
    this.measure();
  }

  measure() {
    const scrollY = window.scrollY;
    this.planes.forEach((plane) => plane.measure(scrollY));
  }

  render(time, rawVelocity) {
    this.velocity += (gsap.utils.clamp(-60, 60, rawVelocity) - this.velocity) * 0.12;
    const scrollY = window.scrollY;
    this.planes.forEach((plane) => plane.update(scrollY, this.viewport, this.velocity, time));
    this.renderer.render(this.scene, this.camera);
  }
}
