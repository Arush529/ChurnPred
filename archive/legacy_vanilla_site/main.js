// ==========================================
// 1. 3D WEBGL TITLE ENGINE
// ==========================================
// Renders the interactive "Telco Customer Churn Predictor" liquid text effect using the OGL library.
window.addEventListener('load', () => {
    if (window.ogl) {
        const { Renderer, Program, Mesh, Triangle, Texture } = window.ogl;
        
        // WebGL Shaders (Handles the mathematical distortion, ripple, and refraction of the text)
        const vertex = `#version 300 es\nin vec2 position;\nin vec2 uv;\nout vec2 vUv;\nvoid main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }`;
        const fragment = `#version 300 es\nprecision highp float;\nuniform sampler2D uTextTexture;\nuniform vec2 uResolution;\nuniform vec2 uPointer;\nuniform float uPointerActive;\nuniform float uTime;\nuniform float uWarpStrength;\nuniform float uWarpScale;\nuniform float uSpeed;\nuniform float uPointerInfluence;\nuniform float uPointerStrength;\nuniform float uRefraction;\nuniform float uRipple;\nuniform float uMotion;\nin vec2 vUv;\nout vec4 fragColor;\nfloat hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }\nfloat noise(vec2 p) {\nvec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);\nfloat a = hash(i); float b = hash(i + vec2(1.0, 0.0)); float c = hash(i + vec2(0.0, 1.0)); float d = hash(i + vec2(1.0, 1.0));\nreturn mix(mix(a, b, u.x), mix(c, d, u.x), u.y);\n}\nfloat fbm(vec2 p) {\nfloat value = 0.0; float amplitude = 0.5;\nfor (int i = 0; i < 4; i++) { value += amplitude * noise(p); p *= 2.02; amplitude *= 0.5; }\nreturn value;\n}\nvec4 sampleText(vec2 uv) {\nif (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec4(0.0);\nreturn texture(uTextTexture, uv);\n}\nvoid main() {\nvec2 uv = vUv;\nfloat aspect = uResolution.x / max(uResolution.y, 1.0);\nfloat time = uTime * uSpeed;\nfloat scale = max(uWarpScale, 0.001);\nvec2 drift = vec2(time * 0.055, -time * 0.045);\nfloat n1 = fbm(uv * scale * 3.1 + drift);\nfloat n2 = fbm((uv + 19.17) * scale * 3.4 - drift.yx);\nvec2 ambient = (vec2(n1, n2) - 0.5) * uWarpStrength * 0.045 * uMotion;\nvec2 pointerDelta = uv - uPointer;\nvec2 aspectDelta = vec2(pointerDelta.x * aspect, pointerDelta.y);\nfloat dist = length(aspectDelta);\nfloat radius = max(uPointerInfluence, 0.001);\nfloat t = clamp(dist / radius, 0.0, 1.0);\nfloat lens = smoothstep(radius, 0.0, dist) * uPointerActive;\nfloat bulge = t * (1.0 - t) * (1.0 - t) * 6.75 * uPointerActive;\nvec2 dir = dist > 0.0001 ? vec2(aspectDelta.x / aspect, aspectDelta.y) / dist : vec2(0.0);\nfloat rippleWave = sin(dist * 28.0 - time * 4.2) * 0.5 + 0.5;\nfloat rippleRing = (rippleWave - 0.5) * uRipple;\nvec2 pointerWarp = -dir * bulge * uPointerStrength * 0.045;\npointerWarp += dir * rippleRing * bulge * uPointerStrength * 0.016;\nvec2 displaced = uv + ambient + pointerWarp;\nvec2 splitDir = ambient + pointerWarp;\nfloat splitLen = length(splitDir);\nsplitDir = splitLen > 0.00001 ? splitDir / splitLen : vec2(0.7071, 0.7071);\nvec2 split = splitDir * uRefraction * 0.16 * (0.35 + lens * 1.65);\nvec4 base = sampleText(displaced);\nfloat r = sampleText(displaced + split).r;\nfloat g = base.g;\nfloat b = sampleText(displaced - split).b;\nfloat a = max(max(sampleText(displaced + split).a, base.a), sampleText(displaced - split).a);\nvec3 color = vec3(r, g, b) + lens * base.a * 0.055;\nfragColor = vec4(color, a);\n}`;
        
        class VanillaWarpText {
            constructor(containerId, customText) {
                this.container = document.getElementById(containerId);
                if (!this.container) return;
                
                this.props = { 
                    text: customText || "Telco Customer\nChurn Predictor", 
                    color: "#ffffff", 
                    warpStrength: 0.08, warpScale: 1.7, speed: 0.55, pointerInfluence: 0.42, pointerStrength: 0.38, refraction: 0.018, ripple: true, fontWeight: 800, fontFamily: '"Plus Jakarta Sans", "Inter", ui-sans-serif, system-ui, sans-serif', letterSpacing: -0.04, lineHeight: 0.95 
                };
                this.pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, active: 0, activeTarget: 0 };
                this.startTime = performance.now();
                this.raf = 0;
                this.initWebGL();
            }
            measureLine(ctx, line, lsPx) { const chars = Array.from(line); const textWidth = chars.reduce((w, c) => w + ctx.measureText(c).width, 0); return textWidth + Math.max(0, chars.length - 1) * lsPx; }
            drawLine(ctx, line, x, y, lsPx, isGreen) {
                const chars = Array.from(line); let cursor = x - this.measureLine(ctx, line, lsPx) / 2;
                ctx.fillStyle = isGreen ? "#00f298" : this.props.color; 
                ctx.shadowColor = isGreen ? "rgba(0,242,152,0.5)" : "rgba(255,255,255,0.25)";
                ctx.shadowBlur = 30;
                chars.forEach((char, index) => { ctx.fillText(char, cursor, y); cursor += ctx.measureText(char).width + (index === chars.length - 1 ? 0 : lsPx); });
                ctx.shadowBlur = 0; 
            }
            buildTextCanvas(width, height, dpr) {
                const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.floor(width * dpr)); canvas.height = Math.max(1, Math.floor(height * dpr));
                const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, width, height); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
                let currentFontSize = Math.max(38, Math.min(width * 0.09, 125)); 
                let lhPx = currentFontSize * this.props.lineHeight; let lsPx = currentFontSize * this.props.letterSpacing;
                ctx.font = `${this.props.fontWeight} ${currentFontSize}px ${this.props.fontFamily}`;
                const lines = this.props.text.split('\n');
                const maxWidth = width * 0.96; const maxHeight = height * 0.92;
                const widest = Math.max(...lines.map(line => this.measureLine(ctx, line, lsPx)), 1);
                const blockHeight = lhPx * lines.length; const fit = Math.min(1, maxWidth / widest, maxHeight / blockHeight);
                if (fit < 1) { currentFontSize *= fit; lhPx *= fit; lsPx *= fit; ctx.font = `${this.props.fontWeight} ${currentFontSize}px ${this.props.fontFamily}`; }
                const startY = height / 2 - (lhPx * (lines.length - 1)) / 2;
                lines.forEach((line, index) => { this.drawLine(ctx, line, width / 2, startY + index * lhPx, lsPx, index === 1); });
                return canvas;
            }
            initWebGL() {
                try { this.renderer = new Renderer({ webgl: 2, alpha: true, antialias: true, dpr: Math.min(window.devicePixelRatio || 1, 2) }); this.gl = this.renderer.gl; } catch (e) { return; }
                this.gl.clearColor(0, 0, 0, 0); this.gl.canvas.style.position = 'absolute'; this.gl.canvas.style.inset = '0'; this.gl.canvas.style.width = '100%'; this.gl.canvas.style.height = '100%'; this.container.appendChild(this.gl.canvas);
                this.texture = new Texture(this.gl, { generateMipmaps: false, minFilter: this.gl.LINEAR, magFilter: this.gl.LINEAR, wrapS: this.gl.CLAMP_TO_EDGE, wrapT: this.gl.CLAMP_TO_EDGE });
                this.geometry = new Triangle(this.gl);
                this.program = new Program(this.gl, { vertex, fragment, transparent: true, depthTest: false, depthWrite: false, uniforms: { uTextTexture: { value: this.texture }, uResolution: { value: new Float32Array([1, 1]) }, uPointer: { value: new Float32Array([0.5, 0.5]) }, uPointerActive: { value: 0 }, uTime: { value: 0 }, uWarpStrength: { value: this.props.warpStrength }, uWarpScale: { value: this.props.warpScale }, uSpeed: { value: this.props.speed }, uPointerInfluence: { value: this.props.pointerInfluence }, uPointerStrength: { value: this.props.pointerStrength }, uRefraction: { value: this.props.refraction }, uRipple: { value: 1 }, uMotion: { value: 1 } } });
                this.mesh = new Mesh(this.gl, { geometry: this.geometry, program: this.program });
                this.resize(); window.addEventListener('resize', () => this.resize());
                this.gl.canvas.addEventListener('mousemove', (e) => this.onPointerMove(e)); this.gl.canvas.addEventListener('mouseleave', () => { this.pointer.activeTarget = 0; });
                this.loop();
            }
            resize() { const rect = this.container.getBoundingClientRect(); if (rect.width <= 0 || rect.height <= 0) return; const dpr = Math.min(window.devicePixelRatio || 1, 2); this.renderer.setSize(rect.width, rect.height); this.program.uniforms.uResolution.value[0] = this.gl.drawingBufferWidth; this.program.uniforms.uResolution.value[1] = this.gl.drawingBufferHeight; this.texture.image = this.buildTextCanvas(rect.width, rect.height, dpr); this.texture.needsUpdate = true; }
            onPointerMove(e) { const rect = this.gl.canvas.getBoundingClientRect(); this.pointer.tx = (e.clientX - rect.left) / rect.width; this.pointer.ty = 1 - (e.clientY - rect.top) / rect.height; this.pointer.activeTarget = 1; }
            loop() {
                if (!this.container || this.container.offsetParent === null) {
                    this.raf = requestAnimationFrame(() => this.loop());
                    return;
                }
                const elapsed = (performance.now() - this.startTime) * 0.001; const idleX = 0.5 + Math.sin(elapsed * 0.33) * 0.12; const idleY = 0.5 + Math.cos(elapsed * 0.27) * 0.1; const targetX = this.pointer.activeTarget > 0 ? this.pointer.tx : idleX; const targetY = this.pointer.activeTarget > 0 ? this.pointer.ty : idleY; const damping = this.pointer.activeTarget > 0 ? 0.12 : 0.035; this.pointer.x += (targetX - this.pointer.x) * damping; this.pointer.y += (targetY - this.pointer.y) * damping; this.pointer.active += ((this.pointer.activeTarget > 0 ? 1 : 0.18) - this.pointer.active) * 0.06; this.program.uniforms.uPointer.value[0] = this.pointer.x; this.program.uniforms.uPointer.value[1] = this.pointer.y; this.program.uniforms.uPointerActive.value = this.pointer.active; this.program.uniforms.uTime.value = elapsed; this.renderer.render({ scene: this.mesh }); this.raf = requestAnimationFrame(() => this.loop());
            }
        }
        window.warpInstances = {
            landing: new VanillaWarpText('landing-warp-title-container', "Stop Customer Churn\nBefore It Happens"),
            single: new VanillaWarpText('warp-title-container', "Telco Customer\nChurn Predictor"),
            batch: new VanillaWarpText('batch-warp-title-container', "Batch Customer\nChurn Predictor")
        };
    } else {
        // Fallback if OGL fails to load
        ['landing-warp-title-container', 'warp-title-container', 'batch-warp-title-container'].forEach(id => {
            const h1 = document.querySelector(`#${id} h1`);
            if (h1) {
                h1.style.position = 'relative';
                h1.style.width = 'auto';
                h1.style.height = 'auto';
                h1.style.clip = 'auto';
            }
        });
    }
});


// ==========================================
// 2. CLICKSPARK GLOBAL ENGINE
// ==========================================
// Renders the green explosion particle effect whenever the user clicks anywhere on the body.
window.addEventListener('load', () => {
    class ClickSpark {
        constructor(options = {}) {
            this.target = document.body;
            this.sparkColor = options.sparkColor || '#a4f275';
            this.sparkSize = options.sparkSize || 10;
            this.sparkRadius = options.sparkRadius || 15;
            this.sparkCount = options.sparkCount || 8;
            this.duration = options.duration || 400;
            this.easing = options.easing || 'ease-out';
            this.extraScale = options.extraScale || 1.0;
            this.sparks = [];
            this.canvas = document.createElement('canvas');
            this.ctx = this.canvas.getContext('2d');
            this.init();
        }
        init() {
            this.canvas.style.position = 'fixed'; this.canvas.style.top = '0'; this.canvas.style.left = '0'; this.canvas.style.width = '100vw'; this.canvas.style.height = '100vh'; this.canvas.style.pointerEvents = 'none'; this.canvas.style.zIndex = '9999'; this.target.appendChild(this.canvas);
            this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(this.target); this.resize();
            
            this.target.addEventListener('click', (e) => this.handleClick(e), { capture: true }); 
            requestAnimationFrame((t) => this.draw(t));
        }
        resize() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; }
        ease(t) { switch (this.easing) { case 'linear': return t; case 'ease-in': return t * t; case 'ease-in-out': return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; default: return t * (2 - t); } }
        handleClick(e) {
            const now = performance.now();
            for (let i = 0; i < this.sparkCount; i++) { this.sparks.push({ x: e.clientX, y: e.clientY, angle: (2 * Math.PI * i) / this.sparkCount, startTime: now }); }
        }
        draw(timestamp) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.sparks = this.sparks.filter(spark => {
                const elapsed = timestamp - spark.startTime; if (elapsed >= this.duration) return false;
                const progress = elapsed / this.duration; const eased = this.ease(progress);
                const distance = eased * this.sparkRadius * this.extraScale; const lineLength = this.sparkSize * (1 - eased);
                const x1 = spark.x + distance * Math.cos(spark.angle); const y1 = spark.y + distance * Math.sin(spark.angle);
                const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle); const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);
                this.ctx.strokeStyle = this.sparkColor; this.ctx.lineWidth = 2; this.ctx.beginPath(); this.ctx.moveTo(x1, y1); this.ctx.lineTo(x2, y2); this.ctx.stroke();
                return true;
            });
            requestAnimationFrame((t) => this.draw(t));
        }
    }
    new ClickSpark({ sparkColor: "#00f298", sparkSize: 10, sparkRadius: 15, sparkCount: 8, duration: 400 });
});


// ==========================================
// 3. PURE CSS SPECULAR HOVER ENGINE
// ==========================================
// Tracks mouse movement across the document and dynamically updates the --mouse-x and --mouse-y CSS variables.
// This allows the radial gradient borders on the form inputs to "follow" the cursor.
document.addEventListener('mousemove', (e) => {
    const wrapper = e.target.closest('.css-specular-wrapper');
    if (wrapper) {
        const rect = wrapper.getBoundingClientRect();
        wrapper.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        wrapper.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    }
});


// ==========================================
// 4. CUSTOM UI BUILDER (DROPDOWNS & INPUTS)
// ==========================================
// Finds all standard HTML <select> tags and rebuilds them into custom styled DIVs with SVG icons.
document.addEventListener('DOMContentLoaded', () => {
    const SVGs = { chevron: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`, check: `<svg class="check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>` };
    
    document.querySelectorAll('select').forEach(select => {
        select.style.display = 'none';
        const wrapper = document.createElement('div'); wrapper.className = 'custom-select';
        select.parentNode.insertBefore(wrapper, select); wrapper.appendChild(select); 
        
        const specularWrap = document.createElement('div');
        specularWrap.className = 'css-specular-wrapper';
        wrapper.appendChild(specularWrap);

        const trigger = document.createElement('div'); trigger.className = 'select-trigger'; trigger.tabIndex = 0;
        
        const valueText = document.createElement('span'); valueText.className = 'value-text'; valueText.textContent = select.options[select.selectedIndex].text;
        trigger.appendChild(valueText); trigger.innerHTML += SVGs.chevron;
        
        specularWrap.appendChild(trigger);
        
        const content = document.createElement('div'); content.className = 'select-content';
        Array.from(select.options).forEach((opt, index) => {
            const item = document.createElement('div'); item.className = 'select-item' + (select.selectedIndex === index ? ' selected' : ''); item.dataset.value = opt.value; item.innerHTML = `${SVGs.check}<span>${opt.text}</span>`;
            item.addEventListener('click', (e) => {
                e.stopPropagation(); select.value = opt.value; wrapper.querySelector('.value-text').textContent = opt.text;
                content.querySelectorAll('.select-item').forEach(i => i.classList.remove('selected')); item.classList.add('selected'); wrapper.classList.remove('open');
                select.dispatchEvent(new Event('change', { bubbles: true }));
            });
            content.appendChild(item);
        });
        wrapper.appendChild(content);
        trigger.addEventListener('click', (e) => { e.stopPropagation(); document.querySelectorAll('.custom-select').forEach(cs => { if (cs !== wrapper) cs.classList.remove('open'); }); wrapper.classList.toggle('open'); });
    });
    
    document.addEventListener('click', () => { document.querySelectorAll('.custom-select').forEach(cs => cs.classList.remove('open')); });
    
    document.querySelectorAll('input[type="number"]').forEach(input => {
        const wrapper = document.createElement('div');
        wrapper.className = 'css-specular-wrapper';
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);
    });
});


// ==========================================
// 5. GLOBAL STATE & UTILITIES
// ==========================================
const form = document.getElementById('prediction-form');
const emptyState = document.getElementById('empty-state');
const loadingState = document.getElementById('loading-state');
const resultState = document.getElementById('result-state');
const dashboardPanel = document.getElementById('dashboard-panel');
const submitBtn = document.getElementById('submit-btn');
const toastViewport = document.getElementById('toast-viewport');
const churnPercentDisplay = document.getElementById('churn-percent');
const gaugePath = document.getElementById('gauge-path');
const riskStatusText = document.getElementById('risk-status-text');
const factorsList = document.getElementById('factors-list');
const barChartContainer = document.getElementById('bar-chart-container');

// Defines the colors based on prediction thresholds
// Defines the colors based on prediction thresholds
const RISK_STYLES = { 
    "High Risk": { hex: "#ff3366", glow: "rgba(255,51,102,0.45)" }, 
    "Medium Risk": { hex: "#ffac52", glow: "rgba(255,172,82,0.45)" }, 
    "Low Risk": { hex: "#00f298", glow: "rgba(0,242,152,0.45)" } 
};

// Persona Presets for 1-Click Evaluation
const PERSONA_PRESETS = {
    risk: {
        gender: 'Female', SeniorCitizen: 'Yes', Partner: 'No', Dependents: 'No',
        tenure: 2, PhoneService: 'Yes', MultipleLines: 'No', InternetService: 'Fiber optic',
        OnlineSecurity: 'No', OnlineBackup: 'No', DeviceProtection: 'No', TechSupport: 'No',
        StreamingTV: 'Yes', StreamingMovies: 'Yes', Contract: 'Month-to-month',
        PaperlessBilling: 'Yes', PaymentMethod: 'Electronic check', MonthlyCharges: 89.85, TotalCharges: 179.70
    },
    loyal: {
        gender: 'Male', SeniorCitizen: 'No', Partner: 'Yes', Dependents: 'Yes',
        tenure: 64, PhoneService: 'Yes', MultipleLines: 'Yes', InternetService: 'DSL',
        OnlineSecurity: 'Yes', OnlineBackup: 'Yes', DeviceProtection: 'Yes', TechSupport: 'Yes',
        StreamingTV: 'Yes', StreamingMovies: 'Yes', Contract: 'Two year',
        PaperlessBilling: 'No', PaymentMethod: 'Bank transfer (automatic)', MonthlyCharges: 78.40, TotalCharges: 5017.60
    },
    borderline: {
        gender: 'Female', SeniorCitizen: 'No', Partner: 'Yes', Dependents: 'No',
        tenure: 14, PhoneService: 'Yes', MultipleLines: 'No', InternetService: 'Fiber optic',
        OnlineSecurity: 'No', OnlineBackup: 'Yes', DeviceProtection: 'No', TechSupport: 'No',
        StreamingTV: 'No', StreamingMovies: 'No', Contract: 'Month-to-month',
        PaperlessBilling: 'Yes', PaymentMethod: 'Credit card (automatic)', MonthlyCharges: 68.50, TotalCharges: 959.00
    }
};

// Controls the sliding popup notifications in the bottom right corner
function toast({ title, description, variant = 'default' }) {
    const el = document.createElement('div'); el.className = `toast ${variant === 'destructive' ? 'destructive' : ''}`;
    el.innerHTML = `<div class="toast-title">${title}</div>${description ? `<div class="toast-desc">${description}</div>` : ''}`; toastViewport.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show'))); setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 4000);
}

// ==========================================
// 6. PROFILE & MODEL MATHEMATICAL HELPERS
// ==========================================
function getCurrentProfile() {
    return {
        gender: document.getElementById('gender').value,
        SeniorCitizen: document.getElementById('SeniorCitizen').value,
        Partner: document.getElementById('Partner').value,
        Dependents: document.getElementById('Dependents').value,
        tenure: parseInt(document.getElementById('tenure').value) || 0,
        PhoneService: document.getElementById('PhoneService').value,
        PaperlessBilling: document.getElementById('PaperlessBilling').value,
        MonthlyCharges: parseFloat(document.getElementById('MonthlyCharges').value) || 0,
        TotalCharges: parseFloat(document.getElementById('TotalCharges').value) || 0,
        MultipleLines: document.getElementById('MultipleLines').value,
        InternetService: document.getElementById('InternetService').value,
        OnlineSecurity: document.getElementById('OnlineSecurity').value,
        OnlineBackup: document.getElementById('OnlineBackup').value,
        DeviceProtection: document.getElementById('DeviceProtection').value,
        TechSupport: document.getElementById('TechSupport').value,
        StreamingTV: document.getElementById('StreamingTV').value,
        StreamingMovies: document.getElementById('StreamingMovies').value,
        Contract: document.getElementById('Contract').value,
        PaymentMethod: document.getElementById('PaymentMethod').value
    };
}

function applyPreset(p) {
    Object.keys(p).forEach(key => {
        const el = document.getElementById(key);
        if (!el) return;
        el.value = p[key];
        if (el.tagName.toLowerCase() === 'select') {
            const wrapper = el.closest('.custom-select');
            if (wrapper) {
                const opt = Array.from(el.options).find(o => o.value === String(p[key]) || o.text === String(p[key]));
                if (opt) {
                    el.value = opt.value;
                    const valText = wrapper.querySelector('.value-text');
                    if (valText) valText.textContent = opt.text;
                    wrapper.querySelectorAll('.select-item').forEach(item => {
                        if (item.dataset.value === opt.value) item.classList.add('selected');
                        else item.classList.remove('selected');
                    });
                }
            }
        }
    });
}

function buildFeatureVector(p) {
    const avgSpend = p.TotalCharges / (p.tenure === 0 ? 1 : p.tenure);
    const isNew = p.tenure <= 3 ? 1 : 0;
    const hasMulti = (p.OnlineSecurity === 'Yes' ? 1 : 0) + (p.OnlineBackup === 'Yes' ? 1 : 0) + (p.DeviceProtection === 'Yes' ? 1 : 0) + (p.TechSupport === 'Yes' ? 1 : 0);

    return [
        p.gender === 'Male' ? 1 : 0, p.SeniorCitizen === 'Yes' ? 1 : 0, p.Partner === 'Yes' ? 1 : 0, p.Dependents === 'Yes' ? 1 : 0, p.tenure, p.PhoneService === 'Yes' ? 1 : 0, p.PaperlessBilling === 'Yes' ? 1 : 0, p.MonthlyCharges, p.TotalCharges, avgSpend, isNew, hasMulti,
        p.MultipleLines === 'No phone service' ? 1 : 0, p.MultipleLines === 'Yes' ? 1 : 0, p.InternetService === 'Fiber optic' ? 1 : 0, p.InternetService === 'No' ? 1 : 0,
        p.OnlineSecurity === 'No internet service' ? 1 : 0, p.OnlineSecurity === 'Yes' ? 1 : 0, p.OnlineBackup === 'No internet service' ? 1 : 0, p.OnlineBackup === 'Yes' ? 1 : 0,
        p.DeviceProtection === 'No internet service' ? 1 : 0, p.DeviceProtection === 'Yes' ? 1 : 0, p.TechSupport === 'No internet service' ? 1 : 0, p.TechSupport === 'Yes' ? 1 : 0,
        p.StreamingTV === 'No internet service' ? 1 : 0, p.StreamingTV === 'Yes' ? 1 : 0, p.StreamingMovies === 'No internet service' ? 1 : 0, p.StreamingMovies === 'Yes' ? 1 : 0,
        p.Contract === 'One year' ? 1 : 0, p.Contract === 'Two year' ? 1 : 0,
        p.PaymentMethod === 'Credit card (automatic)' ? 1 : 0, p.PaymentMethod === 'Electronic check' ? 1 : 0, p.PaymentMethod === 'Mailed check' ? 1 : 0
    ];
}

function calcProbability(p) {
    if (typeof scoreProfile !== "function") throw new Error("Model file not loaded. Make sure churn_model.js is included.");
    const features = buildFeatureVector(p);
    let rawScore = scoreProfile(features);
    if (Array.isArray(rawScore)) { rawScore = rawScore.length > 1 ? rawScore[1] : rawScore[0]; }
    return 1 / (1 + Math.exp(-rawScore));
}

// True XGBoost Sensitivity / Attribution:
// Measures the direct delta probability between current profile and counterfactual baselines
function computeModelAttribution(baseProfile, baseProb) {
    const pContractRef = calcProbability({ ...baseProfile, Contract: 'Two year' });
    const contractDelta = (baseProb - pContractRef) * 100;

    const pEcoRef = calcProbability({ ...baseProfile, OnlineSecurity: 'Yes', OnlineBackup: 'Yes', DeviceProtection: 'Yes', TechSupport: 'Yes' });
    const ecoDelta = (baseProb - pEcoRef) * 100;

    const pNetRef = calcProbability({ ...baseProfile, InternetService: 'DSL' });
    const netDelta = (baseProb - pNetRef) * 100;

    const pTenureRef = calcProbability({ ...baseProfile, tenure: 48, TotalCharges: baseProfile.MonthlyCharges * 48 });
    const tenureDelta = (baseProb - pTenureRef) * 100;

    const pPayRef = calcProbability({ ...baseProfile, PaymentMethod: 'Bank transfer (automatic)' });
    const payDelta = (baseProb - pPayRef) * 100;

    const pBillRef = calcProbability({ ...baseProfile, PaperlessBilling: 'No' });
    const billDelta = (baseProb - pBillRef) * 100;

    const ecoCount = (baseProfile.OnlineSecurity === 'Yes' ? 1 : 0) + (baseProfile.OnlineBackup === 'Yes' ? 1 : 0) + (baseProfile.DeviceProtection === 'Yes' ? 1 : 0) + (baseProfile.TechSupport === 'Yes' ? 1 : 0);

    const factors = [
        { feature: "Contract", value: baseProfile.Contract, weight: contractDelta },
        { feature: "Tech Ecosystem", value: `${ecoCount}/4 Services`, weight: ecoDelta },
        { feature: "Internet Service", value: baseProfile.InternetService, weight: netDelta },
        { feature: "Customer Tenure", value: `${baseProfile.tenure} mo`, weight: tenureDelta },
        { feature: "Payment Method", value: baseProfile.PaymentMethod, weight: payDelta },
        { feature: "Paperless Billing", value: baseProfile.PaperlessBilling, weight: billDelta }
    ];

    return factors.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)).slice(0, 5);
}

// Next Best Action (NBA) Recommendation Engine with Exact % Reduction
function computeNextBestAction(profile, baseProb, riskLevel) {
    if (riskLevel === "Low Risk" || baseProb < 0.35) {
        return {
            header: "⚡ ACCOUNT STABILIZED",
            text: "<strong>Account in Good Standing:</strong> Very low risk of churning. Maintain standard loyalty engagement and periodic satisfaction surveys.",
            color: "var(--fx-green)"
        };
    }

    const candidates = [];

    if (profile.Contract !== 'Two year') {
        const pOneYr = calcProbability({ ...profile, Contract: 'One year' });
        const pTwoYr = calcProbability({ ...profile, Contract: 'Two year' });
        const bestP = Math.min(pOneYr, pTwoYr);
        const targetContract = pTwoYr < pOneYr ? 'Two year' : 'One year';
        const reduction = (baseProb - bestP) * 100;
        candidates.push({
            type: 'Contract Retention Lock',
            reduction: reduction,
            text: `<strong>Contract Retention Lock:</strong> High flight risk due to month-to-month agreement. Upgrading customer to a ${targetContract} Contract reduces churn probability from <strong>${Math.round(baseProb * 100)}% → ${Math.round(bestP * 100)}%</strong>.`
        });
    }

    if (profile.TechSupport !== 'Yes' || profile.OnlineSecurity !== 'Yes') {
        const pSupport = calcProbability({ ...profile, TechSupport: 'Yes', OnlineSecurity: 'Yes' });
        const reduction = (baseProb - pSupport) * 100;
        candidates.push({
            type: 'Tech Support & Security',
            reduction: reduction,
            text: `<strong>Tech Ecosystem Trial:</strong> Low service integration increases churn risk. Offering a 3-month free trial of Premium Tech Support & Online Security drops churn from <strong>${Math.round(baseProb * 100)}% → ${Math.round(pSupport * 100)}%</strong>.`
        });
    }

    if (profile.PaymentMethod === 'Electronic check' || profile.PaymentMethod === 'Mailed check') {
        const pAuto = calcProbability({ ...profile, PaymentMethod: 'Bank transfer (automatic)' });
        const reduction = (baseProb - pAuto) * 100;
        candidates.push({
            type: 'AutoPay Incentive',
            reduction: reduction,
            text: `<strong>AutoPay Enrollment:</strong> Manual check payments create monthly friction. A $10 statement credit to enroll in Automatic Bank Transfer reduces churn from <strong>${Math.round(baseProb * 100)}% → ${Math.round(pAuto * 100)}%</strong>.`
        });
    }

    candidates.sort((a, b) => b.reduction - a.reduction);

    if (candidates.length > 0 && candidates[0].reduction >= 1) {
        const best = candidates[0];
        return {
            header: `⚡ RECOMMENDED ACTION: ${best.type.toUpperCase()}`,
            text: `${best.text} <span class="nba-impact-badge">-${Math.round(best.reduction)}% Risk</span>`,
            color: "var(--risk-high)"
        };
    }

    return {
        header: "⚡ CUSTOMER SUCCESS CHECK-IN",
        text: "<strong>Dedicated CS Review:</strong> Multiple subtle risk indicators detected. Schedule a proactive check-in call from Customer Success to resolve service issues.",
        color: "var(--risk-high)"
    };
}

// ==========================================
// 7. XGBOOST PREDICTION RUNNER
// ==========================================
function executePrediction(isLive = false) {
    try {
        const profile = getCurrentProfile();
        const probability = calcProbability(profile);
        const pct = Math.round(probability * 100);

        let riskLevel = "Low Risk";
        if (probability >= 0.60) riskLevel = "High Risk";
        else if (probability >= 0.35) riskLevel = "Medium Risk";

        const factors = computeModelAttribution(profile, probability);
        const style = RISK_STYLES[riskLevel];
        const offset = (2 * Math.PI * 70) * (1 - pct / 100);

        // Render Gauge
        const churnPercentDisplay = document.getElementById('churn-percent');
        if (churnPercentDisplay) {
            churnPercentDisplay.textContent = `${pct}%`;
            churnPercentDisplay.style.color = style.hex;
            churnPercentDisplay.style.textShadow = `0 0 20px ${style.glow}`;
        }

        const gaugePath = document.getElementById('gauge-path');
        if (gaugePath) {
            gaugePath.style.stroke = style.hex;
            gaugePath.style.filter = `drop-shadow(0 0 10px ${style.glow})`;
            gaugePath.style.strokeDashoffset = `${offset}`;
            gaugePath.setAttribute('stroke', style.hex);
            gaugePath.setAttribute('stroke-dashoffset', offset);
        }

        // Render Risk Badge
        const riskBadgeEl = document.getElementById('risk-badge');
        if (riskBadgeEl) {
            riskBadgeEl.textContent = riskLevel.toUpperCase();
            riskBadgeEl.className = `risk-badge ${riskLevel === 'High Risk' ? 'high' : (riskLevel === 'Medium Risk' ? 'medium' : 'low')}`;
        }

        // Render Risk Status Text
        const riskStatusEl = document.getElementById('risk-status-text');
        if (riskStatusEl) {
            riskStatusEl.textContent = `${riskLevel} of churning`;
            riskStatusEl.style.color = style.hex;
            riskStatusEl.style.textShadow = `0 0 16px ${style.glow}`;
        }

        // Render Revenue at Risk
        const annualLoss = probability * profile.MonthlyCharges * 12;
        const revLossEl = document.getElementById('revenue-loss');
        const revCalcEl = document.getElementById('revenue-calc');
        if (revLossEl) {
            revLossEl.textContent = `$${annualLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / yr`;
            revLossEl.style.color = style.hex;
        }
        if (revCalcEl) {
            revCalcEl.textContent = `${pct}% risk on $${profile.MonthlyCharges.toFixed(2)}/mo bill`;
        }

        // Render Factors List (Right Panel)
        const factorsListEl = document.getElementById('factors-list');
        if (factorsListEl) {
            factorsListEl.innerHTML = factors.map(f => {
                const isRisk = f.weight > 0;
                const sign = isRisk ? '+' : '';
                return `<div class="factor-item">
                    <span>${f.feature}: <span style="color:var(--fx-muted);">${f.value}</span></span>
                    <span style="font-family:var(--font-mono); font-weight:600; color: ${isRisk ? 'var(--risk-high)' : 'var(--fx-green)'}">
                        ${sign}${f.weight.toFixed(1)}%
                    </span>
                </div>`;
            }).join('');
        }

        // Render Horizontal Bar Chart (Bottom Panel)
        const barChartEl = document.getElementById('bar-chart-container');
        if (barChartEl) {
            const maxAbs = Math.max(...factors.map(f => Math.abs(f.weight)), 1);
            barChartEl.innerHTML = '<div class="zero-line"></div>' + factors.map(f => {
                const isRisk = f.weight > 0;
                const width = Math.min((Math.abs(f.weight) / maxAbs) * 44, 46);
                const displayWeight = isRisk ? `+${f.weight.toFixed(1)}%` : `${f.weight.toFixed(1)}%`;

                return `<div class="chart-row">
                    <div class="chart-label">${f.feature}<br><span style="font-size:0.72rem; opacity:0.8;">(${f.value})</span></div>
                    <div class="chart-area">
                        <div class="bar ${isRisk ? 'risk' : 'retention'}" style="width: ${width}%;">
                            <span class="bar-value">${displayWeight}</span>
                        </div>
                    </div>
                </div>`;
            }).join('');
        }

        // Render Next Best Action (NBA) Recommendation
        const nbaContainer = document.getElementById('nba-container');
        const nbaText = document.getElementById('nba-text');
        const nbaHeader = nbaContainer ? nbaContainer.querySelector('.nba-header') : null;
        const nbaData = computeNextBestAction(profile, probability, riskLevel);

        if (nbaContainer && nbaText) {
            nbaContainer.style.borderLeftColor = nbaData.color;
            if (nbaHeader) nbaHeader.textContent = nbaData.header;
            nbaText.innerHTML = nbaData.text;
            nbaContainer.style.display = "block";
        }

        // Ensure Results and Dashboard are visible immediately
        const emptyStateEl = document.getElementById('empty-state');
        const loadingStateEl = document.getElementById('loading-state');
        const resultStateEl = document.getElementById('result-state');
        const dashboardPanelEl = document.getElementById('dashboard-panel');
        if (emptyStateEl) emptyStateEl.style.display = 'none';
        if (loadingStateEl) loadingStateEl.style.display = 'none';
        if (resultStateEl) resultStateEl.style.display = 'flex';
        if (dashboardPanelEl) dashboardPanelEl.style.display = 'block';

    } catch (error) {
        console.error("Prediction error:", error);
    }
}

// Global runPrediction alias for direct live execution
function runPrediction(e) {
    if (e) e.preventDefault();
    executePrediction(true);
}

if (form) {
    form.addEventListener('submit', runPrediction);
}

// ==========================================
// 8. PRESETS & REAL-TIME LIVE LISTENERS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Initial live calculation on load if single profile predictor is present
    if (document.getElementById('prediction-form')) {
        executePrediction(true);
    }

    // Presets: instant live recalculation
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const presetKey = btn.dataset.preset;
            if (PERSONA_PRESETS[presetKey]) {
                applyPreset(PERSONA_PRESETS[presetKey]);
                executePrediction(true);
            }
        });
    });

    // Real-time live input tracking on all inputs & selects
    if (form) {
        form.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('input', () => executePrediction(true));
            input.addEventListener('change', () => executePrediction(true));
        });
    }
});

// ==========================================
// 9. APP RESET LOGIC
// ==========================================
document.getElementById('reset-btn')?.addEventListener('click', () => { 
    const formEl = document.getElementById('prediction-form');
    if (formEl) formEl.reset(); 
    document.querySelectorAll('.custom-select').forEach(wrapper => { 
        const select = wrapper.querySelector('select'); 
        if (select) {
            const valText = wrapper.querySelector('.value-text');
            if (valText && select.options[select.selectedIndex]) {
                valText.textContent = select.options[select.selectedIndex].text; 
            }
            wrapper.querySelectorAll('.select-item').forEach((item, index) => { 
                if (index === select.selectedIndex) item.classList.add('selected'); 
                else item.classList.remove('selected'); 
            }); 
        }
    }); 
    // Immediately score default baseline in live mode
    executePrediction(true);
    toast({ title: "Form Reset", description: "Values restored to defaults and scored live." }); 
});

document.getElementById('nav-reset-btn')?.addEventListener('click', () => document.getElementById('reset-btn')?.click());

// ==========================================
// 10. BATCH CSV SCORING ENGINE & WORKSPACE
// ==========================================
let batchCustomers = [];
let filteredCustomers = [];
let batchCurrentPage = 1;
const BATCH_PAGE_SIZE = 15;

// ==========================================
// Central Unified View Routing Controller (Landing, Single Profile, Batch CSV)
// ==========================================
function switchView(viewName, updateHash = true) {
    const landingView = document.getElementById('landing-view');
    const workspaceView = document.getElementById('workspace-view');
    const singleView = document.getElementById('single-view');
    const batchView = document.getElementById('batch-view');
    const liveToggleContainer = document.getElementById('live-toggle-container');
    const navResetBtn = document.getElementById('nav-reset-btn');
    const navLaunchBtn = document.getElementById('nav-launch-btn');

    // Update active tab styling if tabs exist on current page
    document.querySelectorAll('.view-tab').forEach(t => {
        if (t.dataset.view) {
            t.classList.toggle('active', t.dataset.view === viewName);
        }
    });

    if (viewName === 'single') {
        if (!singleView) {
            window.location.href = 'single.html';
            return;
        }
        if (landingView) landingView.style.display = 'none';
        if (workspaceView) workspaceView.style.display = 'block';
        singleView.style.display = 'block';
        if (batchView) batchView.style.display = 'none';

        if (liveToggleContainer) liveToggleContainer.style.display = 'inline-flex';
        if (navResetBtn) navResetBtn.style.display = 'inline-block';
        if (navLaunchBtn) navLaunchBtn.style.display = 'none';

        if (updateHash && !window.location.pathname.endsWith('single.html')) history.pushState(null, '', '#single');
        window.scrollTo(0, 0);
        setTimeout(() => window.dispatchEvent(new Event('resize')), 60);
    } else if (viewName === 'batch') {
        if (!batchView) {
            window.location.href = 'batch.html';
            return;
        }
        if (landingView) landingView.style.display = 'none';
        if (workspaceView) workspaceView.style.display = 'block';
        if (singleView) singleView.style.display = 'none';
        batchView.style.display = 'block';

        if (liveToggleContainer) liveToggleContainer.style.display = 'none';
        if (navResetBtn) navResetBtn.style.display = 'none';
        if (navLaunchBtn) navLaunchBtn.style.display = 'none';

        // Auto-populate 100-customer cohort if not yet loaded so the user sees a complete, rich interface immediately
        if (!batchCustomers || batchCustomers.length === 0) {
            const sample = generateSampleCohort();
            processBatchData(sample, false);
        }

        if (updateHash && !window.location.pathname.endsWith('batch.html')) history.pushState(null, '', '#batch');
        window.scrollTo(0, 0);
    } else {
        // Default to 'landing'
        if (!landingView) {
            window.location.href = 'index.html';
            return;
        }
        landingView.style.display = 'block';
        if (workspaceView) workspaceView.style.display = 'none';

        if (liveToggleContainer) liveToggleContainer.style.display = 'none';
        if (navResetBtn) navResetBtn.style.display = 'none';
        if (navLaunchBtn) navLaunchBtn.style.display = 'inline-flex';

        if (updateHash) {
            if (window.location.hash) history.pushState(null, '', window.location.pathname + window.location.search);
        }
        window.scrollTo(0, 0);
    }

    if (window.warpInstances) {
        setTimeout(() => {
            Object.values(window.warpInstances).forEach(inst => {
                if (inst && inst.container && inst.container.offsetParent !== null) {
                    inst.resize();
                }
            });
        }, 40);
    }
}

// Attach Tab Switcher Event Listeners
document.querySelectorAll('.view-tab').forEach(tab => {
    if (tab.dataset.view) {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            switchView(tab.dataset.view);
        });
    }
});

// Attach Landing Page Action Gateway Buttons
document.getElementById('landing-launch-single')?.addEventListener('click', () => {
    switchView('single');
});

document.getElementById('landing-launch-batch')?.addEventListener('click', () => {
    switchView('batch');
});

// Nav Bar Brand, Home & Launch Actions
document.getElementById('nav-brand')?.addEventListener('click', () => {
    switchView('landing');
});

document.getElementById('nav-launch-btn')?.addEventListener('click', () => {
    switchView('single');
});

document.getElementById('back-home-btn')?.addEventListener('click', () => {
    switchView('landing');
});

// Browser History & Hash Routing Handling
function handleInitialRouting() {
    const hash = window.location.hash.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();
    const isIndex = pathname.endsWith('index.html') || pathname.endsWith('/') || !pathname.includes('.html');

    if (isIndex) {
        if (hash === '#single' || hash === '#single-view') {
            window.location.href = 'single.html';
            return;
        } else if (hash === '#batch' || hash === '#batch-view') {
            window.location.href = 'batch.html';
            return;
        }
    }

    // Auto-load inspect customer transferred from batch view into Single Profile form
    const savedCust = sessionStorage.getItem('inspectCustomer');
    if (savedCust && document.getElementById('prediction-form')) {
        sessionStorage.removeItem('inspectCustomer');
        try {
            const cust = JSON.parse(savedCust);
            applyPreset(cust);
            setTimeout(() => {
                const form = document.getElementById('prediction-form');
                if (form) form.dispatchEvent(new Event('submit'));
                toast({ title: `Loaded ${cust.id}`, description: `Customer profile loaded from batch cohort (${cust.riskTier || 'Scored'}).` });
            }, 180);
        } catch (e) {
            console.error("Error loading transferred customer:", e);
        }
    }

    // Auto-populate 100-customer cohort on batch page if empty
    if (document.getElementById('csv-dropzone') && (!batchCustomers || batchCustomers.length === 0)) {
        const sample = generateSampleCohort();
        processBatchData(sample, false);
    }
}

window.addEventListener('hashchange', handleInitialRouting);

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleInitialRouting);
} else {
    handleInitialRouting();
}

// Normalize an uploaded or generated raw CSV row into the model's profile format
function normalizeCustomerRow(row, idx) {
    const getVal = (keys, defaultVal) => {
        for (const k of keys) {
            for (const rowKey of Object.keys(row)) {
                if (rowKey.trim().toLowerCase() === k.toLowerCase() && row[rowKey] !== undefined && row[rowKey] !== null && String(row[rowKey]).trim() !== '') {
                    return String(row[rowKey]).trim();
                }
            }
        }
        return defaultVal;
    };

    const id = getVal(['customerID', 'customerId', 'id', 'user_id', 'client_id'], `CUST-${1001 + idx}`);
    const gender = getVal(['gender', 'sex'], 'Male');
    const SeniorCitizen = getVal(['SeniorCitizen', 'senior'], '0') === '1' || getVal(['SeniorCitizen', 'senior'], 'No').toLowerCase() === 'yes' ? 'Yes' : 'No';
    const Partner = getVal(['Partner', 'partner'], 'No');
    const Dependents = getVal(['Dependents', 'dependents'], 'No');
    const tenure = parseInt(getVal(['tenure', 'months', 'tenure_months'], '12')) || 0;
    const PhoneService = getVal(['PhoneService', 'phone'], 'Yes');
    const MultipleLines = getVal(['MultipleLines', 'multiple_lines'], 'No');
    const InternetService = getVal(['InternetService', 'internet'], 'Fiber optic');
    const OnlineSecurity = getVal(['OnlineSecurity', 'security'], 'No');
    const OnlineBackup = getVal(['OnlineBackup', 'backup'], 'No');
    const DeviceProtection = getVal(['DeviceProtection', 'protection'], 'No');
    const TechSupport = getVal(['TechSupport', 'support'], 'No');
    const StreamingTV = getVal(['StreamingTV', 'tv'], 'No');
    const StreamingMovies = getVal(['StreamingMovies', 'movies'], 'No');
    const Contract = getVal(['Contract', 'contract_type'], 'Month-to-month');
    const PaperlessBilling = getVal(['PaperlessBilling', 'paperless'], 'Yes');
    const PaymentMethod = getVal(['PaymentMethod', 'payment'], 'Electronic check');
    const MonthlyCharges = parseFloat(getVal(['MonthlyCharges', 'monthly_charges', 'charges'], '70.00')) || 70.00;
    const TotalCharges = parseFloat(getVal(['TotalCharges', 'total_charges'], String(MonthlyCharges * Math.max(1, tenure)))) || (MonthlyCharges * Math.max(1, tenure));

    const profile = {
        gender, SeniorCitizen, Partner, Dependents, tenure, PhoneService, MultipleLines, InternetService,
        OnlineSecurity, OnlineBackup, DeviceProtection, TechSupport, StreamingTV, StreamingMovies,
        Contract, PaperlessBilling, PaymentMethod, MonthlyCharges, TotalCharges
    };

    const prob = calcProbability(profile);
    const pct = Math.round(prob * 100);
    let riskTier = 'Low Risk';
    let riskClass = 'low';
    if (prob >= 0.60) {
        riskTier = 'High Risk';
        riskClass = 'high';
    } else if (prob >= 0.35) {
        riskTier = 'Medium Risk';
        riskClass = 'medium';
    }

    const annualLoss = prob * MonthlyCharges * 12;

    // Determine top risk contributor or action
    let topAction = 'Standard Account Monitor';
    if (Contract === 'Month-to-month') topAction = 'Offer 1-Yr Contract Lock (-36% Risk)';
    else if (TechSupport !== 'Yes' && OnlineSecurity !== 'Yes') topAction = 'Upsell Tech Support Bundle (-18% Risk)';
    else if (PaymentMethod === 'Electronic check') topAction = 'Enroll in Frictionless AutoPay (-9% Risk)';
    else if (InternetService === 'Fiber optic' && MonthlyCharges > 80) topAction = 'Apply Loyalty Price Credit (-12% Risk)';

    return {
        id,
        ...profile,
        prob,
        pct,
        riskTier,
        riskClass,
        annualLoss,
        topAction
    };
}

// Process an array of raw objects
function processBatchData(rawRows, showToast = true) {
    if (!Array.isArray(rawRows) || rawRows.length === 0) {
        toast({ title: "Empty Data", description: "The provided CSV file contains no valid customer records.", variant: "destructive" });
        return;
    }

    batchCustomers = rawRows.map((row, idx) => normalizeCustomerRow(row, idx));
    filteredCustomers = [...batchCustomers];
    batchCurrentPage = 1;

    updateBatchKPIs();
    renderBatchTable();

    const kpiGrid = document.getElementById('batch-kpi-grid');
    const tablePanel = document.getElementById('batch-table-panel');
    if (kpiGrid) kpiGrid.style.display = 'grid';
    if (tablePanel) tablePanel.style.display = 'block';

    if (showToast) {
        toast({ title: "Batch Scoring Complete", description: `Successfully scored ${batchCustomers.length} customer profiles in < 20ms.` });
    }
}

// Update KPI Metrics Cards
function updateBatchKPIs() {
    const total = batchCustomers.length;
    if (total === 0) return;

    const highRiskCount = batchCustomers.filter(c => c.riskTier === 'High Risk').length;
    const highRiskPct = Math.round((highRiskCount / total) * 100);
    const avgRate = Math.round((batchCustomers.reduce((acc, c) => acc + c.prob, 0) / total) * 100);
    const totalRevenueLoss = batchCustomers.reduce((acc, c) => acc + c.annualLoss, 0);

    const totalEl = document.getElementById('kpi-total');
    const highRiskEl = document.getElementById('kpi-high-risk');
    const highRiskPctEl = document.getElementById('kpi-high-pct');
    const avgRateEl = document.getElementById('kpi-avg-rate');
    const revenueLossEl = document.getElementById('kpi-revenue-loss');

    if (totalEl) totalEl.textContent = total.toLocaleString();
    if (highRiskEl) highRiskEl.textContent = highRiskCount.toLocaleString();
    if (highRiskPctEl) highRiskPctEl.textContent = `${highRiskPct}% of cohort`;
    if (avgRateEl) avgRateEl.textContent = `${avgRate}%`;
    if (revenueLossEl) revenueLossEl.textContent = `$${totalRevenueLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Render Table with Pagination
function renderBatchTable() {
    const tbody = document.getElementById('batch-table-body');
    if (!tbody) return;

    const totalFiltered = filteredCustomers.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / BATCH_PAGE_SIZE));
    if (batchCurrentPage > totalPages) batchCurrentPage = totalPages;

    const start = (batchCurrentPage - 1) * BATCH_PAGE_SIZE;
    const end = Math.min(start + BATCH_PAGE_SIZE, totalFiltered);
    const pageRows = filteredCustomers.slice(start, end);

    if (pageRows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 30px; color: var(--fx-muted);">No customers match your search and filter criteria.</td></tr>`;
    } else {
        tbody.innerHTML = pageRows.map(c => `
            <tr>
                <td style="font-family:var(--font-mono); font-weight:600; color:#fff;">${c.id}</td>
                <td>${c.tenure} mo</td>
                <td><span style="font-size:0.82rem; color: ${c.Contract === 'Month-to-month' ? 'var(--risk-high)' : 'var(--text-main)'}">${c.Contract}</span></td>
                <td style="font-family:var(--font-mono);">$${c.MonthlyCharges.toFixed(2)}</td>
                <td>
                    <span style="font-family:var(--font-mono); font-weight:700; color:${c.riskClass === 'high' ? 'var(--risk-high)' : (c.riskClass === 'medium' ? 'var(--risk-medium)' : 'var(--fx-green)')}">
                        ${c.pct}%
                    </span>
                </td>
                <td>
                    <span class="risk-badge ${c.riskClass}">${c.riskTier}</span>
                </td>
                <td style="font-family:var(--font-mono); color:${c.riskClass === 'high' ? 'var(--risk-high)' : 'var(--text-main)'}">
                    $${c.annualLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td style="font-size:0.8rem; color:#cbd5e1;">${c.topAction}</td>
                <td style="text-align: right;">
                    <button type="button" class="table-inspect-btn" onclick="inspectCustomer('${c.id}')" title="Inspect and simulate this account in Single Profile view">
                        Analyze &rarr;
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Pagination controls state
    const infoEl = document.getElementById('pagination-info');
    const pageNumEl = document.getElementById('page-current-num');
    const prevBtn = document.getElementById('page-prev-btn');
    const nextBtn = document.getElementById('page-next-btn');

    if (infoEl) infoEl.textContent = `Showing ${totalFiltered === 0 ? 0 : start + 1}–${end} of ${totalFiltered} customers`;
    if (pageNumEl) pageNumEl.textContent = `Page ${batchCurrentPage} of ${totalPages}`;
    if (prevBtn) prevBtn.disabled = batchCurrentPage <= 1;
    if (nextBtn) nextBtn.disabled = batchCurrentPage >= totalPages;
}

// Search and Risk Filter Handlers
function applyBatchFilters() {
    const query = (document.getElementById('batch-search-input')?.value || '').toLowerCase().trim();
    const filter = document.getElementById('batch-risk-filter')?.value || 'ALL';

    filteredCustomers = batchCustomers.filter(c => {
        const matchesQuery = !query || 
            c.id.toLowerCase().includes(query) || 
            c.Contract.toLowerCase().includes(query) || 
            c.InternetService.toLowerCase().includes(query) ||
            c.PaymentMethod.toLowerCase().includes(query);

        let matchesFilter = true;
        if (filter === 'HIGH') matchesFilter = c.riskTier === 'High Risk';
        else if (filter === 'MEDIUM') matchesFilter = c.riskTier === 'Medium Risk';
        else if (filter === 'LOW') matchesFilter = c.riskTier === 'Low Risk';

        return matchesQuery && matchesFilter;
    });

    batchCurrentPage = 1;
    renderBatchTable();
}

// Pagination Button Handlers
document.getElementById('page-prev-btn')?.addEventListener('click', () => {
    if (batchCurrentPage > 1) {
        batchCurrentPage--;
        renderBatchTable();
    }
});

document.getElementById('page-next-btn')?.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredCustomers.length / BATCH_PAGE_SIZE);
    if (batchCurrentPage < totalPages) {
        batchCurrentPage++;
        renderBatchTable();
    }
});

document.getElementById('batch-search-input')?.addEventListener('input', applyBatchFilters);
document.getElementById('batch-risk-filter')?.addEventListener('change', applyBatchFilters);

// CSV File Dropzone & Browsing
const dropzone = document.getElementById('csv-dropzone');
const fileInput = document.getElementById('csv-file-input');

if (dropzone && fileInput) {
    dropzone.addEventListener('click', (e) => {
        if (e.target.id !== 'load-sample-csv-btn') {
            fileInput.click();
        }
    });

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            parseCSVFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            parseCSVFile(e.target.files[0]);
        }
    });

    document.getElementById('browse-csv-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });
}

function parseCSVFile(file) {
    if (!file.name.toLowerCase().endsWith('.csv')) {
        toast({ title: "Invalid File Format", description: "Please upload a valid .csv file.", variant: "destructive" });
        return;
    }

    if (typeof Papa === 'undefined') {
        toast({ title: "Parser Loading", description: "PapaParse CSV parser is still initializing. Please try again.", variant: "destructive" });
        return;
    }

    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
            if (results.data && results.data.length > 0) {
                processBatchData(results.data);
            } else {
                toast({ title: "Parsing Error", description: "Unable to read rows from CSV file.", variant: "destructive" });
            }
        },
        error: (err) => {
            toast({ title: "File Error", description: err.message, variant: "destructive" });
        }
    });
}

// 1-Click Sample Cohort Generator (100 Realistic Customers)
function generateSampleCohort() {
    const contracts = ['Month-to-month', 'One year', 'Two year'];
    const internets = ['Fiber optic', 'DSL', 'No'];
    const payments = ['Electronic check', 'Mailed check', 'Bank transfer (automatic)', 'Credit card (automatic)'];
    const yesNo = ['Yes', 'No'];

    const sample = [];
    for (let i = 1; i <= 100; i++) {
        const id = `CUST-${1000 + i}`;
        const isHighRiskArchetype = i % 3 === 0;
        const isLoyalArchetype = i % 4 === 0;

        let tenure, contract, internet, payment, monthly, paperless, security, techSupport;

        if (isHighRiskArchetype) {
            tenure = Math.floor(Math.random() * 6) + 1;
            contract = 'Month-to-month';
            internet = 'Fiber optic';
            payment = 'Electronic check';
            monthly = +(75 + Math.random() * 35).toFixed(2);
            paperless = 'Yes';
            security = 'No';
            techSupport = 'No';
        } else if (isLoyalArchetype) {
            tenure = Math.floor(Math.random() * 30) + 40;
            contract = 'Two year';
            internet = Math.random() > 0.4 ? 'DSL' : 'Fiber optic';
            payment = 'Bank transfer (automatic)';
            monthly = +(55 + Math.random() * 30).toFixed(2);
            paperless = 'No';
            security = 'Yes';
            techSupport = 'Yes';
        } else {
            tenure = Math.floor(Math.random() * 40) + 8;
            contract = contracts[Math.floor(Math.random() * contracts.length)];
            internet = internets[Math.floor(Math.random() * internets.length)];
            payment = payments[Math.floor(Math.random() * payments.length)];
            monthly = +(45 + Math.random() * 50).toFixed(2);
            paperless = yesNo[Math.floor(Math.random() * yesNo.length)];
            security = yesNo[Math.floor(Math.random() * yesNo.length)];
            techSupport = yesNo[Math.floor(Math.random() * yesNo.length)];
        }

        const totalCharges = +(monthly * tenure).toFixed(2);

        sample.push({
            customerID: id,
            gender: Math.random() > 0.5 ? 'Male' : 'Female',
            SeniorCitizen: Math.random() > 0.8 ? '1' : '0',
            Partner: Math.random() > 0.5 ? 'Yes' : 'No',
            Dependents: Math.random() > 0.6 ? 'Yes' : 'No',
            tenure: tenure,
            PhoneService: 'Yes',
            MultipleLines: Math.random() > 0.5 ? 'Yes' : 'No',
            InternetService: internet,
            OnlineSecurity: security,
            OnlineBackup: Math.random() > 0.5 ? 'Yes' : 'No',
            DeviceProtection: Math.random() > 0.5 ? 'Yes' : 'No',
            TechSupport: techSupport,
            StreamingTV: Math.random() > 0.5 ? 'Yes' : 'No',
            StreamingMovies: Math.random() > 0.5 ? 'Yes' : 'No',
            Contract: contract,
            PaperlessBilling: paperless,
            PaymentMethod: payment,
            MonthlyCharges: monthly,
            TotalCharges: totalCharges
        });
    }
    return sample;
}

document.getElementById('load-sample-csv-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const sampleRows = generateSampleCohort();
    processBatchData(sampleRows);
});

// Enriched CSV Export Generator
document.getElementById('export-csv-btn')?.addEventListener('click', () => {
    if (!batchCustomers || batchCustomers.length === 0) {
        toast({ title: "No Data", description: "Score a cohort first before exporting.", variant: "destructive" });
        return;
    }

    if (typeof Papa === 'undefined') {
        toast({ title: "Parser Loading", description: "CSV exporter initializing. Please try again.", variant: "destructive" });
        return;
    }

    const exportRows = batchCustomers.map(c => ({
        CustomerID: c.id,
        Gender: c.gender,
        SeniorCitizen: c.SeniorCitizen,
        Partner: c.Partner,
        Dependents: c.Dependents,
        Tenure_Months: c.tenure,
        PhoneService: c.PhoneService,
        MultipleLines: c.MultipleLines,
        InternetService: c.InternetService,
        OnlineSecurity: c.OnlineSecurity,
        OnlineBackup: c.OnlineBackup,
        DeviceProtection: c.DeviceProtection,
        TechSupport: c.TechSupport,
        StreamingTV: c.StreamingTV,
        StreamingMovies: c.StreamingMovies,
        Contract: c.Contract,
        PaperlessBilling: c.PaperlessBilling,
        PaymentMethod: c.PaymentMethod,
        MonthlyCharges: c.MonthlyCharges,
        TotalCharges: c.TotalCharges,
        Predicted_Churn_Probability: `${c.pct}%`,
        Risk_Tier: c.riskTier,
        Annual_Revenue_at_Risk_USD: `$${c.annualLoss.toFixed(2)}`,
        Recommended_Retention_Action: c.topAction
    }));

    const csvContent = Papa.unparse(exportRows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `telco_churn_scored_cohort_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({ title: "CSV Exported", description: `Exported ${exportRows.length} scored customer records.` });
});

// Inspect and load individual customer from batch table into Single Profile analyzer
window.inspectCustomer = function(id) {
    if (!batchCustomers || batchCustomers.length === 0) return;
    const cust = batchCustomers.find(c => c.id === id);
    if (!cust) return;

    const form = document.getElementById('prediction-form');
    if (form) {
        applyPreset(cust);
        setTimeout(() => {
            form.dispatchEvent(new Event('submit'));
        }, 100);
        toast({ title: `Loaded ${cust.id}`, description: `Customer profile loaded into Single Profile analyzer (${cust.riskTier}).` });
    } else {
        // Save to sessionStorage and navigate to dedicated Single Profile page
        sessionStorage.setItem('inspectCustomer', JSON.stringify(cust));
        window.location.href = 'single.html';
    }
};

// Download Sample Template CSV
document.getElementById('download-template-csv-btn')?.addEventListener('click', () => {
    const templateRows = [
        {
            customerID: "DEMO-7001",
            gender: "Female",
            SeniorCitizen: "0",
            Partner: "Yes",
            Dependents: "No",
            tenure: 1,
            PhoneService: "No",
            MultipleLines: "No phone service",
            InternetService: "DSL",
            OnlineSecurity: "No",
            OnlineBackup: "Yes",
            DeviceProtection: "No",
            TechSupport: "No",
            StreamingTV: "No",
            StreamingMovies: "No",
            Contract: "Month-to-month",
            PaperlessBilling: "Yes",
            PaymentMethod: "Electronic check",
            MonthlyCharges: 29.85,
            TotalCharges: 29.85
        },
        {
            customerID: "DEMO-7002",
            gender: "Male",
            SeniorCitizen: "0",
            Partner: "No",
            Dependents: "No",
            tenure: 34,
            PhoneService: "Yes",
            MultipleLines: "No",
            InternetService: "DSL",
            OnlineSecurity: "Yes",
            OnlineBackup: "No",
            DeviceProtection: "Yes",
            TechSupport: "No",
            StreamingTV: "No",
            StreamingMovies: "No",
            Contract: "One year",
            PaperlessBilling: "No",
            PaymentMethod: "Mailed check",
            MonthlyCharges: 56.95,
            TotalCharges: 1889.50
        },
        {
            customerID: "DEMO-7003",
            gender: "Male",
            SeniorCitizen: "1",
            Partner: "No",
            Dependents: "No",
            tenure: 2,
            PhoneService: "Yes",
            MultipleLines: "No",
            InternetService: "Fiber optic",
            OnlineSecurity: "No",
            OnlineBackup: "No",
            DeviceProtection: "No",
            TechSupport: "No",
            StreamingTV: "Yes",
            StreamingMovies: "Yes",
            Contract: "Month-to-month",
            PaperlessBilling: "Yes",
            PaymentMethod: "Electronic check",
            MonthlyCharges: 89.85,
            TotalCharges: 179.70
        },
        {
            customerID: "DEMO-7004",
            gender: "Female",
            SeniorCitizen: "0",
            Partner: "Yes",
            Dependents: "Yes",
            tenure: 62,
            PhoneService: "Yes",
            MultipleLines: "Yes",
            InternetService: "Fiber optic",
            OnlineSecurity: "Yes",
            OnlineBackup: "Yes",
            DeviceProtection: "Yes",
            TechSupport: "Yes",
            StreamingTV: "Yes",
            StreamingMovies: "Yes",
            Contract: "Two year",
            PaperlessBilling: "No",
            PaymentMethod: "Bank transfer (automatic)",
            MonthlyCharges: 104.20,
            TotalCharges: 6460.40
        }
    ];

    if (typeof Papa !== 'undefined') {
        const csvContent = Papa.unparse(templateRows);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'telco_churn_sample_template.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({ title: "Template Downloaded", description: "Sample template downloaded. You can modify or re-upload it." });
    }
});