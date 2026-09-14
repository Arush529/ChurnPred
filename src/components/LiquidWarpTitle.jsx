import React, { useEffect, useRef, useState } from 'react';
import { Renderer, Program, Mesh, Triangle, Texture } from 'ogl';

// WebGL Shaders (Handles mathematical distortion, ripple, ambient fluid drift, and chromatic refraction)
const VERTEX_SHADER = `#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform sampler2D uTextTexture;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uPointerActive;
uniform float uTime;
uniform float uWarpStrength;
uniform float uWarpScale;
uniform float uSpeed;
uniform float uPointerInfluence;
uniform float uPointerStrength;
uniform float uRefraction;
uniform float uRipple;
uniform float uMotion;
in vec2 vUv;
out vec4 fragColor;

float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
        value += amplitude * noise(p);
        p *= 2.02;
        amplitude *= 0.5;
    }
    return value;
}

vec4 sampleText(vec2 uv) {
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec4(0.0);
    return texture(uTextTexture, uv);
}

void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    float time = uTime * uSpeed;
    float scale = max(uWarpScale, 0.001);
    vec2 drift = vec2(time * 0.055, -time * 0.045);
    float n1 = fbm(uv * scale * 3.1 + drift);
    float n2 = fbm((uv + 19.17) * scale * 3.4 - drift.yx);
    vec2 ambient = (vec2(n1, n2) - 0.5) * uWarpStrength * 0.045 * uMotion;
    vec2 pointerDelta = uv - uPointer;
    vec2 aspectDelta = vec2(pointerDelta.x * aspect, pointerDelta.y);
    float dist = length(aspectDelta);
    float radius = max(uPointerInfluence, 0.001);
    float t = clamp(dist / radius, 0.0, 1.0);
    float lens = smoothstep(radius, 0.0, dist) * uPointerActive;
    float bulge = t * (1.0 - t) * (1.0 - t) * 6.75 * uPointerActive;
    vec2 dir = dist > 0.0001 ? vec2(aspectDelta.x / aspect, aspectDelta.y) / dist : vec2(0.0);
    float rippleWave = sin(dist * 28.0 - time * 4.2) * 0.5 + 0.5;
    float rippleRing = (rippleWave - 0.5) * uRipple;
    vec2 pointerWarp = -dir * bulge * uPointerStrength * 0.045;
    pointerWarp += dir * rippleRing * bulge * uPointerStrength * 0.016;
    vec2 displaced = uv + ambient + pointerWarp;
    vec2 splitDir = ambient + pointerWarp;
    float splitLen = length(splitDir);
    splitDir = splitLen > 0.00001 ? splitDir / splitLen : vec2(0.7071, 0.7071);
    vec2 split = splitDir * uRefraction * 0.16 * (0.35 + lens * 1.65);
    vec4 base = sampleText(displaced);
    float r = sampleText(displaced + split).r;
    float g = base.g;
    float b = sampleText(displaced - split).b;
    float a = max(max(sampleText(displaced + split).a, base.a), sampleText(displaced - split).a);
    vec3 color = vec3(r, g, b) + lens * base.a * 0.055;
    fragColor = vec4(color, a);
}`;

export default function LiquidWarpTitle({
  id = 'landing-warp-title-container',
  text = "Stop Customer Churn\nBefore It Happens",
  className = ""
}) {
  const containerRef = useRef(null);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer, gl, program, texture, mesh, geometry;
    let rafId = 0;
    let isDisposed = false;

    const props = {
      text,
      color: "#ffffff",
      warpStrength: 0.08,
      warpScale: 1.7,
      speed: 0.55,
      pointerInfluence: 0.42,
      pointerStrength: 0.38,
      refraction: 0.018,
      ripple: true,
      fontWeight: 800,
      fontFamily: '"Plus Jakarta Sans", "Inter", ui-sans-serif, system-ui, sans-serif',
      letterSpacing: -0.04,
      lineHeight: 0.98
    };

    const pointer = {
      x: 0.5,
      y: 0.5,
      tx: 0.5,
      ty: 0.5,
      active: 0,
      activeTarget: 0
    };

    const startTime = performance.now();

    const measureLine = (ctx, line, lsPx) => {
      const chars = Array.from(line);
      const textWidth = chars.reduce((w, c) => w + ctx.measureText(c).width, 0);
      return textWidth + Math.max(0, chars.length - 1) * lsPx;
    };

    const drawLine = (ctx, line, x, y, lsPx, isAccent) => {
      const chars = Array.from(line);
      const totalLineWidth = measureLine(ctx, line, lsPx);
      let cursor = x - totalLineWidth / 2;

      if (isAccent) {
        const grad = ctx.createLinearGradient(x - totalLineWidth / 2, y, x + totalLineWidth / 2, y);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.35, '#00f298');
        grad.addColorStop(1, '#38bdf8');
        ctx.fillStyle = grad;
        ctx.shadowColor = "rgba(0, 242, 152, 0.55)";
        ctx.shadowBlur = 35;
      } else {
        ctx.fillStyle = props.color;
        ctx.shadowColor = "rgba(255, 255, 255, 0.25)";
        ctx.shadowBlur = 25;
      }

      chars.forEach((char, index) => {
        ctx.fillText(char, cursor, y);
        cursor += ctx.measureText(char).width + (index === chars.length - 1 ? 0 : lsPx);
      });
      ctx.shadowBlur = 0;
    };

    const buildTextCanvas = (width, height, dpr) => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      const ctx = canvas.getContext('2d');
      if (!ctx) return canvas;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Responsive font sizing
      let currentFontSize = Math.max(38, Math.min(width * 0.088, 105));
      let lhPx = currentFontSize * props.lineHeight;
      let lsPx = currentFontSize * props.letterSpacing;
      ctx.font = `${props.fontWeight} ${currentFontSize}px ${props.fontFamily}`;

      const lines = props.text.split('\n');
      const maxWidth = width * 0.94;
      const maxHeight = height * 0.90;
      const widest = Math.max(...lines.map(line => measureLine(ctx, line, lsPx)), 1);
      const blockHeight = lhPx * lines.length;
      const fit = Math.min(1, maxWidth / widest, maxHeight / blockHeight);

      if (fit < 1) {
        currentFontSize *= fit;
        lhPx *= fit;
        lsPx *= fit;
        ctx.font = `${props.fontWeight} ${currentFontSize}px ${props.fontFamily}`;
      }

      const startY = height / 2 - (lhPx * (lines.length - 1)) / 2;
      lines.forEach((line, index) => {
        drawLine(ctx, line, width / 2, startY + index * lhPx, lsPx, index === 1);
      });

      return canvas;
    };

    try {
      renderer = new Renderer({
        webgl: 2,
        alpha: true,
        antialias: true,
        dpr: Math.min(window.devicePixelRatio || 1, 2)
      });
      gl = renderer.gl;
    } catch (e) {
      console.warn("LiquidWarpTitle: WebGL2 not supported, falling back to CSS", e);
      setWebglFailed(true);
      return;
    }

    gl.clearColor(0, 0, 0, 0);
    gl.canvas.style.position = 'absolute';
    gl.canvas.style.inset = '0';
    gl.canvas.style.width = '100%';
    gl.canvas.style.height = '100%';
    gl.canvas.style.display = 'block';
    gl.canvas.style.cursor = 'crosshair';
    container.appendChild(gl.canvas);

    texture = new Texture(gl, {
      generateMipmaps: false,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE
    });

    geometry = new Triangle(gl);
    program = new Program(gl, {
      vertex: VERTEX_SHADER,
      fragment: FRAGMENT_SHADER,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uTextTexture: { value: texture },
        uResolution: { value: new Float32Array([1, 1]) },
        uPointer: { value: new Float32Array([0.5, 0.5]) },
        uPointerActive: { value: 0 },
        uTime: { value: 0 },
        uWarpStrength: { value: props.warpStrength },
        uWarpScale: { value: props.warpScale },
        uSpeed: { value: props.speed },
        uPointerInfluence: { value: props.pointerInfluence },
        uPointerStrength: { value: props.pointerStrength },
        uRefraction: { value: props.refraction },
        uRipple: { value: 1 },
        uMotion: { value: 1 }
      }
    });

    mesh = new Mesh(gl, { geometry, program });

    const handleResize = () => {
      if (isDisposed || !container) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setSize(rect.width, rect.height);
      program.uniforms.uResolution.value[0] = gl.drawingBufferWidth;
      program.uniforms.uResolution.value[1] = gl.drawingBufferHeight;
      texture.image = buildTextCanvas(rect.width, rect.height, dpr);
      texture.needsUpdate = true;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const onPointerMove = (e) => {
      const rect = gl.canvas.getBoundingClientRect();
      pointer.tx = (e.clientX - rect.left) / rect.width;
      pointer.ty = 1 - (e.clientY - rect.top) / rect.height;
      pointer.activeTarget = 1;
    };

    const onPointerLeave = () => {
      pointer.activeTarget = 0;
    };

    gl.canvas.addEventListener('mousemove', onPointerMove);
    gl.canvas.addEventListener('mouseleave', onPointerLeave);

    const loop = () => {
      if (isDisposed) return;
      if (!container || container.offsetParent === null) {
        rafId = requestAnimationFrame(loop);
        return;
      }

      const elapsed = (performance.now() - startTime) * 0.001;
      const idleX = 0.5 + Math.sin(elapsed * 0.33) * 0.12;
      const idleY = 0.5 + Math.cos(elapsed * 0.27) * 0.1;
      const targetX = pointer.activeTarget > 0 ? pointer.tx : idleX;
      const targetY = pointer.activeTarget > 0 ? pointer.ty : idleY;
      const damping = pointer.activeTarget > 0 ? 0.12 : 0.035;

      pointer.x += (targetX - pointer.x) * damping;
      pointer.y += (targetY - pointer.y) * damping;
      pointer.active += ((pointer.activeTarget > 0 ? 1 : 0.18) - pointer.active) * 0.06;

      program.uniforms.uPointer.value[0] = pointer.x;
      program.uniforms.uPointer.value[1] = pointer.y;
      program.uniforms.uPointerActive.value = pointer.active;
      program.uniforms.uTime.value = elapsed;

      renderer.render({ scene: mesh });
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      if (gl && gl.canvas) {
        gl.canvas.removeEventListener('mousemove', onPointerMove);
        gl.canvas.removeEventListener('mouseleave', onPointerLeave);
        if (gl.canvas.parentNode) {
          gl.canvas.parentNode.removeChild(gl.canvas);
        }
      }
    };
  }, [text]);

  const lines = text.split('\n');

  return (
    <div 
      id={id} 
      ref={containerRef}
      className={`warp-container ${className}`}
      style={{
        position: 'relative',
        display: 'block',
        width: '100%',
        minHeight: '260px',
        maxHeight: '340px',
        overflow: 'hidden',
        isolation: 'isolate',
        marginBottom: '16px'
      }}
    >
      {/* Semantic Accessible Heading */}
      <h1 
        className={`landing-headline ${webglFailed ? '' : 'sr-only'}`}
        style={webglFailed ? { position: 'relative', margin: 0 } : {}}
      >
        {lines[0]}
        {lines.length > 1 && (
          <>
            <br />
            <span className="gradient-text">{lines.slice(1).join(' ')}</span>
          </>
        )}
      </h1>
    </div>
  );
}
