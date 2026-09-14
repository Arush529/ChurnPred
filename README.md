# ✦ ChurnPred &bull; Enterprise AI Customer Churn Intelligence Platform

[![React](https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![XGBoost](https://img.shields.io/badge/ML_Model-100--Tree_XGBoost-1572B6?style=for-the-badge&logo=python&logoColor=white)](https://xgboost.readthedocs.io/)
[![Express](https://img.shields.io/badge/Backend-Node.js_%2B_Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS_%2B_Cyber_Glass-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

A full-stack, enterprise-grade customer retention intelligence platform that predicts and prevents subscriber churn in real time. Powered by a client-side compiled **100-tree XGBoost (Extreme Gradient Boosting)** ensemble for instant 0ms inference, interactive **Explainable AI (XAI) Analytics**, and an in-app **AI Retention Strategist Chatbot** (`✦ Ask Churn AI`).

---

## ⚡ Core Platform Features

### 1. 🔍 Single Account Analyzer
* **Instant 0ms In-Browser Scoring**: Evaluates 19 behavioral, demographic, and billing features simultaneously across 100 decision trees with zero network latency.
* **Calibrated Probability Spectrum**: Full dynamic range from **4.1%** (Loyal Veterans) to **93.1%** (Severe Flight Hazards) around a 27% baseline population mean.
* **Dynamic SHAP Waterfall Attribution**: Step-by-step additive risk factors showing exactly which parameters push an account towards churn or retention.
* **6-Axis Account Health Radar**: Holistic polygon diagnosis across *Contract Stability, Tenure & Loyalty, Tech & Security, Cloud & Device Care, Media Engagement, and Payment Hygiene*.
* **What-If Countermeasure Simulator**: Interactive policy levers (contract extension, security add-ons, auto-pay discounts) that calculate real-time projected risk reduction and **preserved annual recurring revenue (ARR)**.

### 2. 📊 Batch CSV Cohort Intelligence
* **High-Throughput Scoring**: Drag-and-drop raw Telco CSV datasets to score hundreds or thousands of customer accounts in milliseconds.
* **Cohort Risk Distribution & Deciles**: 10-decile histogram stratification and multi-segment risk tier donut chart with 1-click table filtering.
* **Portfolio Revenue at Risk Scatter Matrix**: 2D interactive scatter mapping Tenure vs Monthly Charges across 4 Strategic Quadrants:
  - 🚨 **Critical Danger Zone**: Short tenure (&le;24m) + High Bill (>$70) &rarr; Immediate flight hazard.
  - 👑 **High-Value VIPs**: Seasoned tenure (>24m) + High Bill (>$70) &rarr; Priority accounts to proactively lock in.
  - 🌱 **Onboarding Phase**: Short tenure (&le;24m) + Low Bill (&le;$70) &rarr; Needs proactive adoption check-ins.
  - 🛡️ **Stable Utility Core**: Seasoned tenure (>24m) + Low Bill (&le;$70) &rarr; High loyalty utility base.
* **Segment Risk Drivers**: Operational breakdown across contract terms, internet techs, and payment channels with calculated ROI opportunities.
* **1-Click Seamless Transfer**: Inspect any batch record to immediately load all 19 attributes into the Single Profile Analyzer.

### 3. ✦ In-App AI Retention Strategist Chatbot (`✦ Ask Churn AI`)
* **Dual-Engine Dispatcher**: Powered by Google GenAI (`gemini-2.5-flash`) via the official `@google/genai` SDK when `GEMINI_API_KEY` is provided, with a zero-config built-in diagnostic knowledge engine fallback so it works 100% out of the box.
* **Live Telemetry & Screen Awareness**: Dynamically detects the active viewport, inspecting on-screen customer profiles, probability scores, and batch cohort statistics.
* **Prescriptive Retention Playbooks**: Delivers actionable retention tactics with exact dollar preservation estimates.
* **Floating Cyber-Glass Console**: Slide-out drawer with quick starter prompt chips, live status beacons, and rich markdown rendering.

### 4. 🎨 Next-Gen Cyber-Glass UI & Graphics
* **Interactive 3D WebGL Liquid Warp Title**: GPU-accelerated fluid distortion and chromatic refraction text engine powered by `ogl`.
* **3D Animated ShaderGradient Canvas**: Background fluid wave simulation built on Three.js.
* **Specular Cursor Tracking**: Dark cyber glassmorphism with dynamic light sheen and accessible custom dropdowns.

### 5. 🔐 Dual-Engine Authentication
* **Enterprise Security**: Password hashing with bcrypt, JWT token authentication, and session persistence.
* **Zero-Setup Database Architecture**: Automatically connects to MongoDB when available; seamlessly falls back to a persistent JSON store with a pre-seeded demo user (`arush.masih29@gmail.com` / `securePassword123!`).

---

## 📂 Project Directory Structure

```text
ChurnPred/
├── archive/
│   └── legacy_vanilla_site/    # Preserved legacy static HTML/JS application files
├── dist/                       # Optimized production build assets
├── server/                     # Express REST API & Authentication Backend
│   ├── config/
│   │   └── db.js               # MongoDB connection with automatic fallback handling
│   ├── data/
│   │   └── users.json          # Persistent fallback storage for offline user accounts
│   ├── models/
│   │   └── User.js             # Mongoose user schema
│   ├── routes/
│   │   ├── auth.js             # Sign up, sign in, and token verification routes
│   │   └── chat.js             # AI Advisor /api/chat route with context telemetry
│   └── index.js                # Express server entry point (Port 5000)
├── src/                        # React 18 + Vite Modern Single Page Application
│   ├── components/
│   │   ├── Chatbot/
│   │   │   └── ChurnAdvisorChat.jsx  # Floating AI Retention Strategist console
│   │   ├── visualizations/           # Interactive Visual Analytics Suite
│   │   │   ├── BatchRiskDistribution.jsx  # 10-decile histogram & risk donut
│   │   │   ├── BatchRiskMatrix.jsx        # 4-quadrant portfolio scatter matrix
│   │   │   ├── BatchSegmentDrivers.jsx    # Segment ARR risk & ROI opportunities
│   │   │   ├── HealthRadar.jsx            # 6-axis account health diagnosis radar
│   │   │   ├── WaterfallChart.jsx         # Dynamic SHAP waterfall attribution
│   │   │   └── WhatIfSimulator.jsx        # Policy countermeasure ARR simulator
│   │   ├── AuthModal.jsx             # Cyber-glass login & registration modal
│   │   ├── BatchPredictor.jsx        # Batch CSV upload, scoring & cohort explorer
│   │   ├── CircularGauge.jsx         # Dynamic SVG circular risk gauge
│   │   ├── LandingView.jsx           # Hero landing view & intelligence selector
│   │   ├── LiquidWarpTitle.jsx       # 3D WebGL liquid warp text engine (OGL)
│   │   ├── Navbar.jsx                # Responsive header with view switcher & user state
│   │   ├── ShaderBg.jsx              # 3D animated ShaderGradient canvas background
│   │   └── SinglePredictor.jsx       # 19-feature single customer analyzer
│   ├── lib/
│   │   ├── authDb.js                 # Unified authentication client (API + offline sync)
│   │   ├── churnKnowledgeBase.js     # XGBoost domain knowledge & diagnostic engine
│   │   └── mlEngine.js               # Feature encoding, normalization & inference helpers
│   ├── model/
│   │   └── churn_model.js            # 100-tree compiled XGBoost decision tree ensemble
│   ├── styles/
│   │   └── style.css                 # Cyber-glass styles, specular lighting & tokens
│   ├── App.jsx                       # Root application orchestrator & telemetry router
│   ├── index.css                     # Tailwind CSS entry & custom scrollbars
│   └── main.jsx                      # React DOM mounting entry point
├── tests/
│   └── e2e/                          # Automated headless browser verification test suites
│       ├── verify_chatbot.cjs        # E2E test for AI chatbot & telemetry awareness
│       └── verify_liquid_warp.cjs    # E2E test for WebGL liquid warp rendering
├── .env.example                      # Environment variables template
├── .gitignore                        # Comprehensive ignore rules for fullstack repo
├── index.html                        # Vite HTML entry point
├── package.json                      # Project scripts and dependencies
├── tailwind.config.js                # Tailwind theme extensions & cyber palette
└── vite.config.js                    # Vite dev server & API proxy configuration
```

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (version 18+ recommended)
- Modern web browser with WebGL enabled (Chrome, Edge, Firefox, Safari)

### 2. Installation
Clone the repository and install all dependencies:
```bash
git clone https://github.com/Arush529/ChurnPred.git
cd ChurnPred
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Inside `.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/churnpred?retryWrites=true&w=majority
JWT_SECRET=churnpred_super_secret_jwt_key_2026_prod

# Optional: Unlocks Google Gemini 2.5 Flash for the Churn AI chatbot
# If omitted, the chatbot runs on its built-in zero-config diagnostic engine
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Running Locally
Run both the Express backend API and the Vite frontend dev server with a single command:
```bash
npm run dev:all
```
- **Frontend App**: `http://localhost:8000/`
- **Backend API**: `http://localhost:5000/`

Alternatively, you can run them individually in separate terminals:
```bash
# Terminal 1: Backend Server
npm run server

# Terminal 2: Frontend Dev Server
npm run dev
```

### 5. Production Build
To create an optimized, minified production build:
```bash
npm run build
```
Preview the production build locally:
```bash
npm run preview
```

### 6. Automated Testing
Run the automated end-to-end headless browser verification suite:
```bash
npm run test:e2e
```

---

## 🧠 Machine Learning Engine Architecture

* **Model**: XGBoost (Extreme Gradient Boosting)
* **Training Dataset**: IBM Telco Customer Churn
* **Ensemble Size**: 100 Gradient-Boosted Decision Trees
* **Inference Speed**: Under 1 millisecond (in-browser client-side execution)
* **Objective Function**: `binary:logistic`
* **Probability Transformation**:
  $$\text{Probability} = \frac{1}{1 + e^{-\text{margin}}}$$
  Where $\text{margin} = \sum_{t=1}^{100} \text{LeafValue}_t(X)$

---

## 📄 License
This project is private and proprietary. Designed and engineered for high-performance retention analytics.
