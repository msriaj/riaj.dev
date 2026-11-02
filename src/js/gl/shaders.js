const simplex = /* glsl */ `
  vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
`;

const valueNoise = /* glsl */ `
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }
`;

/* Fullscreen pass ------------------------------------------------------ */

export const quadVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/*
  Pointer trail. A tiny ping-pong buffer that stores a decaying velocity
  field (rg) and "ink" amount (b). It advects itself a little each frame
  so strokes drift and curl instead of fading in place.
*/
export const trailFrag = /* glsl */ `
  precision highp float;
  uniform sampler2D uPrev;
  uniform vec2 uPointer;
  uniform vec2 uVelocity;
  uniform float uAspect;
  uniform float uRadius;
  varying vec2 vUv;

  void main() {
    vec2 drift = texture2D(uPrev, vUv).xy;
    vec4 prev = texture2D(uPrev, vUv - drift * 0.008);

    vec2 d = vUv - uPointer;
    d.x *= uAspect;
    float splat = exp(-dot(d, d) / uRadius);
    float speed = clamp(length(uVelocity) * 40.0, 0.0, 1.0);

    vec2 vel = prev.xy * 0.958 + uVelocity * splat * 3.2;
    float ink = prev.z * 0.968 + splat * speed * 0.22;

    gl_FragColor = vec4(vel, clamp(ink, 0.0, 1.0), 1.0);
  }
`;

/*
  The field itself: domain-warped simplex fbm, shaded like satin under a
  soft key light. Monochrome and warm, with a faint ember only where the
  pointer has stirred it.
*/
export const fieldFrag = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform sampler2D uTrail;
  uniform vec2 uPointer;
  uniform float uIntro;
  uniform float uSeed;
  uniform float uScroll;
  uniform vec3 uBase;
  uniform vec3 uMid;
  uniform vec3 uHigh;
  uniform vec3 uAccent;
  uniform vec2 uLight;
  varying vec2 vUv;

  ${simplex}

  float fbm(vec2 p) {
    float f = 0.0;
    float a = 0.5;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < OCTAVES; i++) {
      f += a * snoise(p);
      p = m * p;
      a *= 0.5;
    }
    return f;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

    vec4 trail = texture2D(uTrail, uv);
    float t = uTime * 0.028 + uSeed;

    p += trail.xy * 0.55;
    p += (uPointer - 0.5) * vec2(0.06, 0.04);
    p.y += uScroll * 0.35;

    vec2 q = vec2(
      fbm(p * 0.62 + vec2(0.0, t)),
      fbm(p * 0.62 + vec2(5.2, 1.3) - t * 0.8)
    );
    vec2 r = vec2(
      fbm(p * 0.62 + 1.25 * q + vec2(1.7, 9.2) + t * 0.5),
      fbm(p * 0.62 + 1.25 * q + vec2(8.3, 2.8) - t * 0.35)
    );
    float f = fbm(p * 0.62 + 1.35 * r) * 0.5 + 0.5;

    // Pseudo-normal from the warp vector gives the folds a lit, satin edge.
    vec3 n = normalize(vec3(r * 1.25, 1.0));
    vec3 l = normalize(vec3(uLight, 0.6));
    float diffuse = clamp(dot(n, l), 0.0, 1.0);
    float sheen = pow(diffuse, 5.0);

    float body = smoothstep(0.2, 0.95, f);
    vec3 col = mix(uBase, uMid, body);
    col = mix(col, uHigh, sheen * smoothstep(0.4, 1.0, f) * 0.42);

    // Soft pool of light that follows the pointer.
    vec2 pd = (uv - uPointer) * vec2(aspect, 1.0);
    col += uHigh * 0.045 * exp(-dot(pd, pd) * 3.5);

    // A faint ember only where the trail has ink — warmth, not colour.
    col += uAccent * trail.z * (0.06 + 0.16 * body);
    col += uHigh * trail.z * 0.05;

    // Vignette, weighted towards the top-right light. Never darker than base.
    vec2 vc = (uv - vec2(0.62, 0.58)) * vec2(aspect * 0.62, 1.0);
    col = mix(uBase, col, mix(0.35, 1.0, smoothstep(1.15, 0.12, length(vc))));

    // Feather the bottom and top so the section melts into the page.
    col = mix(uBase, col, smoothstep(0.0, 0.32, uv.y) * smoothstep(1.0, 0.82, uv.y));
    col = mix(uBase, col, uIntro);

    gl_FragColor = vec4(col, 1.0);
  }
`;

/* Gallery planes ------------------------------------------------------- */

export const mediaVert = /* glsl */ `
  uniform float uVelocity;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Bend along the scroll axis — the faster you scroll, the more it bows.
    float bow = sin(uv.x * 3.14159265);
    pos.y -= bow * uVelocity * 0.0007;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const mediaFrag = /* glsl */ `
  precision highp float;
  uniform sampler2D uTexture;
  uniform vec2 uImageSize;
  uniform vec2 uPlaneSize;
  uniform vec2 uMouse;
  uniform float uHover;
  uniform float uReveal;
  uniform float uVelocity;
  uniform float uParallax;
  uniform float uTime;
  varying vec2 vUv;

  ${valueNoise}

  vec2 cover(vec2 uv) {
    float planeRatio = uPlaneSize.x / uPlaneSize.y;
    float imageRatio = uImageSize.x / uImageSize.y;
    vec2 scale = planeRatio > imageRatio
      ? vec2(1.0, imageRatio / planeRatio)
      : vec2(planeRatio / imageRatio, 1.0);
    return (uv - 0.5) * scale + 0.5;
  }

  void main() {
    vec2 uv = vUv;

    // Zoom settles as it reveals; pushes in a touch on hover.
    float zoom = 0.86 - 0.12 * (1.0 - uReveal) - 0.035 * uHover;
    uv = (uv - 0.5) * zoom + 0.5;
    uv.y += uParallax * 0.06;

    // Liquid push away from the pointer.
    vec2 toMouse = vUv - uMouse;
    toMouse.x *= uPlaneSize.x / uPlaneSize.y;
    float lens = smoothstep(0.42, 0.0, length(toMouse)) * uHover;
    float wobble = noise(vUv * 5.0 + uTime * 0.35) - 0.5;
    uv -= normalize(toMouse + 1e-5) * lens * (0.018 + wobble * 0.02);

    vec2 st = cover(uv);

    // Chromatic split driven by scroll speed and hover.
    float split = clamp(abs(uVelocity) * 0.00018, 0.0, 0.012) + lens * 0.0035;
    vec3 color;
    color.r = texture2D(uTexture, st + vec2(0.0, split)).r;
    color.g = texture2D(uTexture, st).g;
    color.b = texture2D(uTexture, st - vec2(0.0, split)).b;

    // Rest state is slightly muted; full colour on hover.
    float luma = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(vec3(luma), color, 0.82 + 0.18 * uHover);
    color *= 0.9 + 0.1 * uHover;

    // Film grain.
    color += (hash(vUv * uPlaneSize + fract(uTime) * 100.0) - 0.5) * 0.045;

    // Organic wipe from the bottom edge.
    float edge = 1.0 - vUv.y + noise(vUv * vec2(3.0, 1.5) + 7.0) * 0.22;
    float threshold = uReveal * 1.3;
    float mask = 1.0 - smoothstep(threshold - 0.06, threshold, edge);

    gl_FragColor = vec4(color, mask);
  }
`;
