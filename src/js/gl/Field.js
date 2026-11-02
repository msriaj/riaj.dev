import {
  Color,
  HalfFloatType,
  LinearFilter,
  LinearSRGBColorSpace,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderTarget,
  WebGLRenderer,
} from "three";
import { quadVert, trailFrag, fieldFrag } from "./shaders.js";

// Uniform colours are fed straight to gl_FragColor, so keep the raw sRGB
// values instead of letting three convert them to linear.
const hex = (value) => new Color().setStyle(value, LinearSRGBColorSpace);

/*
  A full-bleed shader background bound to one section. It owns its own
  small renderer at a low pixel ratio — the field is soft by nature, so
  rendering it at ~0.6x and letting the browser upscale costs nothing
  visually and keeps the GPU cool.
*/
export default class Field {
  constructor(canvas, { seed = 0, light = [0.6, 0.7], interactive = true } = {}) {
    this.canvas = canvas;
    this.section = canvas.parentElement;
    this.interactive = interactive;
    this.visible = false;
    this.mobile = window.matchMedia("(max-width: 900px)").matches;

    this.renderer = new WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(this.mobile ? 0.5 : 0.6);

    this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.geometry = new PlaneGeometry(2, 2);

    const targetOptions = {
      type: HalfFloatType,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      depthBuffer: false,
    };
    this.read = new WebGLRenderTarget(128, 128, targetOptions);
    this.write = new WebGLRenderTarget(128, 128, targetOptions);

    this.trailMaterial = new ShaderMaterial({
      vertexShader: quadVert,
      fragmentShader: trailFrag,
      uniforms: {
        uPrev: { value: this.read.texture },
        uPointer: { value: new Vector2(0.5, 0.5) },
        uVelocity: { value: new Vector2() },
        uAspect: { value: 1 },
        uRadius: { value: 0.006 },
      },
      depthTest: false,
    });
    this.trailScene = new Scene();
    this.trailScene.add(new Mesh(this.geometry, this.trailMaterial));

    this.material = new ShaderMaterial({
      vertexShader: quadVert,
      fragmentShader: fieldFrag,
      defines: { OCTAVES: 3 },
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new Vector2(1, 1) },
        uTrail: { value: this.write.texture },
        uPointer: { value: new Vector2(0.5, 0.5) },
        uIntro: { value: 0 },
        uSeed: { value: seed },
        uScroll: { value: 0 },
        uBase: { value: hex("#0d0d0c") },
        uMid: { value: hex("#1b1a18") },
        uHigh: { value: hex("#7d766c") },
        uAccent: { value: hex("#ff5b2e") },
        uLight: { value: new Vector2(...light) },
      },
      depthTest: false,
    });
    this.scene = new Scene();
    this.scene.add(new Mesh(this.geometry, this.material));

    this.pointer = {
      target: new Vector2(0.5, 0.5),
      current: new Vector2(0.5, 0.5),
      last: new Vector2(0.5, 0.5),
      velocity: new Vector2(),
    };

    this.resize();
    this.observe();
    if (interactive && !this.mobile) this.bindPointer();
  }

  observe() {
    this.observer = new IntersectionObserver(
      ([entry]) => {
        this.visible = entry.isIntersecting;
      },
      { rootMargin: "10% 0px" }
    );
    this.observer.observe(this.section);
  }

  bindPointer() {
    this.onPointerMove = (e) => {
      if (!this.visible) return;
      const rect = this.canvas.getBoundingClientRect();
      this.pointer.target.set(
        (e.clientX - rect.left) / rect.width,
        1 - (e.clientY - rect.top) / rect.height
      );
    };
    window.addEventListener("pointermove", this.onPointerMove, { passive: true });
  }

  resize() {
    const { clientWidth: w, clientHeight: h } = this.section;
    this.width = w;
    this.height = h;
    this.renderer.setSize(w, h, false);
    this.material.uniforms.uResolution.value.set(w, h);
    this.trailMaterial.uniforms.uAspect.value = w / h;
  }

  render(time, scrollProgress = 0) {
    if (!this.visible) return;

    const p = this.pointer;
    p.current.lerp(p.target, 0.12);
    p.velocity.subVectors(p.current, p.last);
    p.last.copy(p.current);

    const trail = this.trailMaterial.uniforms;
    trail.uPrev.value = this.read.texture;
    trail.uPointer.value.copy(p.current);
    trail.uVelocity.value.copy(p.velocity);

    this.renderer.setRenderTarget(this.write);
    this.renderer.render(this.trailScene, this.camera);
    this.renderer.setRenderTarget(null);
    [this.read, this.write] = [this.write, this.read];

    const u = this.material.uniforms;
    u.uTrail.value = this.read.texture;
    u.uTime.value = time;
    u.uPointer.value.copy(p.current);
    u.uScroll.value = scrollProgress;

    this.renderer.render(this.scene, this.camera);
  }
}
