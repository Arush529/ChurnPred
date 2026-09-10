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
            constructor(containerId) {
                this.container = document.getElementById(containerId);
                if (!this.container) return;
                
                // EDIT: Removed the \n here to force the text into one long horizontal line
                this.props = { 
                    text: "Telco Customer Churn Predictor", 
                    color: "#ffffff", 
                    warpStrength: 0.08, warpScale: 1.7, speed: 0.55, pointerInfluence: 0.42, pointerStrength: 0.38, refraction: 0.018, ripple: true, fontWeight: 800, fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif', letterSpacing: -0.04, lineHeight: 0.95 
                };
                this.pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, active: 0, activeTarget: 0 };
                this.startTime = performance.now();
                this.raf = 0;
                this.initWebGL();
            }
            measureLine(ctx, line, lsPx) { const chars = Array.from(line); const textWidth = chars.reduce((w, c) => w + ctx.measureText(c).width, 0); return textWidth + Math.max(0, chars.length - 1) * lsPx; }
            drawLine(ctx, line, x, y, lsPx, isGreen) {
                const chars = Array.from(line); let cursor = x - this.measureLine(ctx, line, lsPx) / 2;
                ctx.fillStyle = isGreen ? "#a4f275" : this.props.color; 
                ctx.shadowColor = isGreen ? "rgba(164,242,117,0.5)" : "rgba(255,255,255,0.25)";
                ctx.shadowBlur = 30;
                chars.forEach((char, index) => { ctx.fillText(char, cursor, y); cursor += ctx.measureText(char).width + (index === chars.length - 1 ? 0 : lsPx); });
                ctx.shadowBlur = 0; 
            }
            buildTextCanvas(width, height, dpr) {
                const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.floor(width * dpr)); canvas.height = Math.max(1, Math.floor(height * dpr));
                const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, width, height); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
                let currentFontSize = Math.max(40, Math.min(width * 0.12, 150)); 
                let lhPx = currentFontSize * this.props.lineHeight; let lsPx = currentFontSize * this.props.letterSpacing;
                ctx.font = `${this.props.fontWeight} ${currentFontSize}px ${this.props.fontFamily}`;
                const lines = this.props.text.split('\n');
                const maxWidth = width * 0.95; const maxHeight = height * 0.9;
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
            loop() { const elapsed = (performance.now() - this.startTime) * 0.001; const idleX = 0.5 + Math.sin(elapsed * 0.33) * 0.12; const idleY = 0.5 + Math.cos(elapsed * 0.27) * 0.1; const targetX = this.pointer.activeTarget > 0 ? this.pointer.tx : idleX; const targetY = this.pointer.activeTarget > 0 ? this.pointer.ty : idleY; const damping = this.pointer.activeTarget > 0 ? 0.12 : 0.035; this.pointer.x += (targetX - this.pointer.x) * damping; this.pointer.y += (targetY - this.pointer.y) * damping; this.pointer.active += ((this.pointer.activeTarget > 0 ? 1 : 0.18) - this.pointer.active) * 0.06; this.program.uniforms.uPointer.value[0] = this.pointer.x; this.program.uniforms.uPointer.value[1] = this.pointer.y; this.program.uniforms.uPointerActive.value = this.pointer.active; this.program.uniforms.uTime.value = elapsed; this.renderer.render({ scene: this.mesh }); this.raf = requestAnimationFrame(() => this.loop()); }
        }
        new VanillaWarpText('warp-title-container');
    } else {
        // Fallback if OGL fails to load
        document.querySelector('#warp-title-container h1').style.position = 'relative'; document.querySelector('#warp-title-container h1').style.width = 'auto'; document.querySelector('#warp-title-container h1').style.height = 'auto'; document.querySelector('#warp-title-container h1').style.clip = 'auto';
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
    new ClickSpark({ sparkColor: "#a4f275", sparkSize: 10, sparkRadius: 15, sparkCount: 8, duration: 400 });
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
const RISK_STYLES = { 
    "High Risk": { hex: "#f02e65", glow: "rgba(240,46,101,0.5)" }, 
    "Medium Risk": { hex: "#ff8a00", glow: "rgba(255,138,0,0.5)" }, 
    "Low Risk": { hex: "#a4f275", glow: "rgba(164,242,117,0.5)" } 
};

// Controls the sliding popup notifications in the bottom right corner
function toast({ title, description, variant = 'default' }) {
    const el = document.createElement('div'); el.className = `toast ${variant === 'destructive' ? 'destructive' : ''}`;
    el.innerHTML = `<div class="toast-title">${title}</div>${description ? `<div class="toast-desc">${description}</div>` : ''}`; toastViewport.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show'))); setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 4000);
}


// ==========================================
// 6. XGBOOST PREDICTION LOGIC
// ==========================================
function runPrediction(e) {
    if(e) e.preventDefault();
    
    // Trigger the morphing load state
    submitBtn.querySelector('.text').textContent = 'Predicting...'; submitBtn.disabled = true;
    emptyState.style.display = 'none'; resultState.style.display = 'none'; dashboardPanel.style.display = 'none'; loadingState.style.display = 'flex';
    
    // Fake timeout to allow the loading animation to play before calculating
    setTimeout(() => {
        try {
            // A. Capture Form Inputs
            const gender = document.getElementById('gender').value;
            const senior = document.getElementById('SeniorCitizen').value;
            const partner = document.getElementById('Partner').value;
            const deps = document.getElementById('Dependents').value;
            const tenure = parseInt(document.getElementById('tenure').value) || 0;
            const phone = document.getElementById('PhoneService').value;
            const paperless = document.getElementById('PaperlessBilling').value;
            const mc = parseFloat(document.getElementById('MonthlyCharges').value) || 0;
            const tc = parseFloat(document.getElementById('TotalCharges').value) || 0;
            
            const multiLines = document.getElementById('MultipleLines').value;
            const internet = document.getElementById('InternetService').value;
            const security = document.getElementById('OnlineSecurity').value;
            const backup = document.getElementById('OnlineBackup').value;
            const protection = document.getElementById('DeviceProtection').value;
            const support = document.getElementById('TechSupport').value;
            const tv = document.getElementById('StreamingTV').value;
            const movies = document.getElementById('StreamingMovies').value;
            const contract = document.getElementById('Contract').value;
            const payment = document.getElementById('PaymentMethod').value;

            // B. Feature Engineering (Creates new data points based on inputs)
            const avgSpend = tc / (tenure === 0 ? 1 : tenure);
            const isNew = tenure <= 3 ? 1 : 0;
            const hasMulti = (security === 'Yes' ? 1 : 0) + (backup === 'Yes' ? 1 : 0) + (protection === 'Yes' ? 1 : 0) + (support === 'Yes' ? 1 : 0);

            // C. Build the 33-Item Array expected by churn_model.js
            const features = [
                gender === 'Male' ? 1 : 0, senior === 'Yes' ? 1 : 0, partner === 'Yes' ? 1 : 0, deps === 'Yes' ? 1 : 0, tenure, phone === 'Yes' ? 1 : 0, paperless === 'Yes' ? 1 : 0, mc, tc, avgSpend, isNew, hasMulti,
                multiLines === 'No phone service' ? 1 : 0, multiLines === 'Yes' ? 1 : 0, internet === 'Fiber optic' ? 1 : 0, internet === 'No' ? 1 : 0,
                security === 'No internet service' ? 1 : 0, security === 'Yes' ? 1 : 0, backup === 'No internet service' ? 1 : 0, backup === 'Yes' ? 1 : 0,
                protection === 'No internet service' ? 1 : 0, protection === 'Yes' ? 1 : 0, support === 'No internet service' ? 1 : 0, support === 'Yes' ? 1 : 0,
                tv === 'No internet service' ? 1 : 0, tv === 'Yes' ? 1 : 0, movies === 'No internet service' ? 1 : 0, movies === 'Yes' ? 1 : 0,
                contract === 'One year' ? 1 : 0, contract === 'Two year' ? 1 : 0,
                payment === 'Credit card (automatic)' ? 1 : 0, payment === 'Electronic check' ? 1 : 0, payment === 'Mailed check' ? 1 : 0
            ];

            // D. Run Model & Sigmoid Conversion
            if (typeof scoreProfile !== "function") throw new Error("Model file not loaded. Make sure churn_model.js is included.");
            
            let rawScore = scoreProfile(features);
            if (Array.isArray(rawScore)) { rawScore = rawScore.length > 1 ? rawScore[1] : rawScore[0]; }
            
            const probability = 1 / (1 + Math.exp(-rawScore));
            const pct = Math.round(probability * 100);

            // E. Categorize Risk
            let riskLevel = "Low Risk";
            if (probability >= 0.60) riskLevel = "High Risk";
            else if (probability >= 0.35) riskLevel = "Medium Risk";

            // ==========================================
            // 7. DASHBOARD & NBA RENDER LOGIC
            // ==========================================
            const heuristicFactors = [
                { feature: "Contract", value: contract, weight: contract === 'Month-to-month' ? 1.5 : -1.2 },
                { feature: "Tech Services", value: `${hasMulti}/4 Ecosystem`, weight: hasMulti === 0 ? 0.9 : (hasMulti * -0.5) },
                { feature: "Internet", value: internet, weight: internet === 'Fiber optic' ? 0.8 : (internet === 'No' ? -0.7 : 0.1) },
                { feature: "Tenure", value: `${tenure} mo`, weight: tenure <= 12 ? 0.8 : (tenure > 48 ? -1.0 : -0.2) },
                { feature: "Payment Method", value: payment, weight: payment === 'Electronic check' ? 0.6 : -0.4 }
            ];

            const style = RISK_STYLES[riskLevel];
            const offset = (2 * Math.PI * 70) * (1 - pct / 100);
            
            // Render SVG Gauge
            churnPercentDisplay.textContent = `${pct}%`; 
            churnPercentDisplay.style.color = style.hex; 
            churnPercentDisplay.style.textShadow = `0 0 20px ${style.glow}`;
            gaugePath.style.stroke = style.hex; 
            gaugePath.style.filter = `drop-shadow(0 0 10px ${style.glow})`; 
            setTimeout(() => { gaugePath.style.strokeDashoffset = offset; }, 50);
            
            // Render Risk Text
            riskStatusText.textContent = `${riskLevel} of churning`; 
            riskStatusText.style.color = style.hex; 
            riskStatusText.style.textShadow = `0 0 16px ${style.glow}`;
            
            // Render Factors List (Right Panel)
            factorsList.innerHTML = heuristicFactors.map(f => `<div class="factor-item"><span>${f.feature}: ${f.value}</span><span style="color: ${f.weight > 0 ? 'var(--risk-high)' : 'var(--fx-green)'}">${f.weight > 0 ? '↗ risk' : '↘ retention'}</span></div>`).join('');
            
            // Render Horizontal Bar Chart (Bottom Panel)
            const maxAbs = Math.max(...heuristicFactors.map(f => Math.abs(f.weight)));
            barChartContainer.innerHTML = '<div class="zero-line"></div>' + heuristicFactors.map(f => {
                const isRisk = f.weight > 0;
                const width = (Math.abs(f.weight) / maxAbs) * 40; 
                const displayWeight = isRisk ? `+${f.weight.toFixed(2)}` : f.weight.toFixed(2);
                
                return `<div class="chart-row">
                    <div class="chart-label">${f.feature}<br>(${f.value})</div>
                    <div class="chart-area">
                        <div class="bar ${isRisk ? 'risk' : 'retention'}" style="width: ${width}%;">
                            <span class="bar-value">${displayWeight}</span>
                        </div>
                    </div>
                </div>`;
            }).join('');

            // Render Next Best Action (NBA) Recommendation
            const nbaContainer = document.getElementById('nba-container');
            const nbaText = document.getElementById('nba-text');
            const topRisk = [...heuristicFactors].sort((a, b) => b.weight - a.weight)[0];

            if (riskLevel === "Low Risk" || topRisk.weight <= 0) {
                nbaContainer.style.borderLeftColor = "var(--fx-green)";
                nbaText.innerHTML = "<strong>Monitor Account:</strong> Customer is highly stabilized. No immediate retention action required at this time.";
            } else {
                nbaContainer.style.borderLeftColor = "var(--risk-high)";
                
                switch (topRisk.feature) {
                    case "Contract": nbaText.innerHTML = "<strong>Retention Offer:</strong> High flight risk due to month-to-month status. Offer a 10% monthly discount to lock into a 1-Year Contract."; break;
                    case "Tech Services": nbaText.innerHTML = "<strong>Ecosystem Upsell:</strong> Weak service integration. Offer a free 3-month trial of Premium Tech Support or Cloud Backup."; break;
                    case "Payment Method": nbaText.innerHTML = "<strong>Billing Shift:</strong> Manual check payments increase churn friction. Offer a one-time $10 statement credit to enroll in AutoPay."; break;
                    case "Internet": nbaText.innerHTML = "<strong>Price Check:</strong> Fiber optic users are highly price-sensitive to competitors. Check for local outages and offer a $15 loyalty credit."; break;
                    case "Tenure": nbaText.innerHTML = "<strong>Onboarding Risk:</strong> Customer is still in the critical early phase. Trigger a personalized check-in call from Customer Success."; break;
                    default: nbaText.innerHTML = "<strong>Direct Outreach:</strong> Flag account for immediate manual review by the retention team.";
                }
            }
            nbaContainer.style.display = "block";
            
            // Switch UI States
            loadingState.style.display = 'none'; 
            resultState.style.display = 'flex'; 
            dashboardPanel.style.display = 'block';
            toast({ title: "Prediction Complete", description: "XGBoost model scored profile successfully." });
            
        } catch (error) {
            loadingState.style.display = 'none';
            emptyState.style.display = 'block';
            toast({ title: "Prediction Failed", description: error.message, variant: "destructive" });
        } finally {
            submitBtn.querySelector('.text').textContent = 'Run Prediction'; 
            submitBtn.disabled = false;
        }
    }, 1200); 
}

form.addEventListener('submit', runPrediction);

// ==========================================
// 8. APP RESET LOGIC
// ==========================================
document.getElementById('reset-btn').addEventListener('click', () => { 
    form.reset(); 
    document.querySelectorAll('.custom-select').forEach(wrapper => { 
        const select = wrapper.querySelector('select'); 
        wrapper.querySelector('.value-text').textContent = select.options[select.selectedIndex].text; 
        wrapper.querySelectorAll('.select-item').forEach((item, index) => { 
            if (index === select.selectedIndex) item.classList.add('selected'); 
            else item.classList.remove('selected'); 
        }); 
    }); 
    resultState.style.display = 'none'; 
    dashboardPanel.style.display = 'none'; 
    loadingState.style.display = 'none';
    emptyState.style.display = 'block'; 
    gaugePath.style.strokeDashoffset = 439.8; 
    
    const nbaContainer = document.getElementById('nba-container');
    if (nbaContainer) nbaContainer.style.display = 'none';
    
    toast({ title: "Calculator Reset", description: "Form cleared to default values." }); 
});

document.getElementById('nav-reset-btn').addEventListener('click', () => document.getElementById('reset-btn').click());