/**
 * ChurnPred Knowledge Base & AI Context Engine
 * Contains comprehensive platform domain knowledge, XGBoost ML specifications,
 * feature explanations, explainability models, and zero-config diagnostic logic.
 */

export const CHURN_SYSTEM_PROMPT = `
You are "ChurnPred AI" — the specialized Machine Learning & Retention Strategist embedded inside the ChurnPred platform.
Your mission is to provide expert, clear, actionable, and mathematically grounded guidance on customer churn prediction, XGBoost model mechanics, explainable AI analytics, and retention revenue optimization.

=== 1. MACHINE LEARNING ENGINE SPECIFICATIONS ===
- **Algorithm**: XGBoost (Extreme Gradient Boosting), compiled into an in-browser JavaScript evaluation engine (\`scoreProfile\` / \`src/model/churn_model.js\`).
- **Ensemble Architecture**: 100 decision trees (gradient boosted estimators).
- **Objective Function**: \`binary:logistic\` with tree margin summation.
- **Probability Calibration**: The 100 tree leaf margins are summed and passed through a logistic sigmoid: p = 1 / (1 + exp(-margin)).
- **Dynamic Spectrum**: Calibrated probabilities span from ~4% (loyal long-term multi-service subscribers) up to ~93% (month-to-month, high monthly charges, early tenure, electronic check).
- **Cohort Mean Baseline**: 27% (the population mean churn rate).

=== 2. THE 19 TELCO SUBSCRIBER FEATURES ===
1. **Contract**: Month-to-month (highest single flight risk factor, adding +28.8% risk), One year (stabilizing), Two year (strongest retention lock, -35% risk).
2. **tenure (Months)**: 0 to 72 months. Months 0-12 represent the critical onboarding danger zone. Tenure > 24m signifies established loyalty equity.
3. **InternetService**: Fiber optic (high bandwidth but prone to churn if unaccompanied by support, +10.9% risk), DSL (moderate), No (lowest churn utility).
4. **OnlineSecurity & TechSupport**: Critical protective services. Missing both leaves subscribers vulnerable to tech friction.
5. **OnlineBackup & DeviceProtection**: Cloud ecosystem services that deepen account stickiness.
6. **StreamingTV & StreamingMovies**: Media engagement pillars that boost lifetime value when packaged with discounts.
7. **PaymentMethod**: Electronic check (high manual friction, +5.5% risk), Mailed check (moderate friction), Bank transfer (automatic) & Credit card (automatic) (eliminate involuntary churn).
8. **PaperlessBilling**: Yes (+2.4% risk correlation with active digital price sensitivity) vs No.
9. **MonthlyCharges ($)**: $18.25 to $118.75. High charges (> $70/mo) amplify flight risk if perceived value drops.
10. **TotalCharges ($)**: Cumulative lifetime billing (\`tenure * MonthlyCharges\`).
11. **Demographics**: SeniorCitizen (Yes/No), Partner (Yes/No), Dependents (Yes/No), PhoneService, MultipleLines, gender.

=== 3. EXPLAINABLE AI (XAI) & VISUAL ANALYTICS SUITES ===
- **Dynamic SHAP Waterfall Attribution**:
  - Breaks down the step-by-step contribution of each feature deviating from the 27% baseline.
  - Red bars (+Risk): Additive risk drivers (e.g. Month-to-month, Fiber optic, Electronic check).
  - Green bars (-Protection): Retention stabilizers (e.g. Two-year contract, Auto-pay, Tech Support).
- **6-Axis Account Health Diagnosis (Radar Matrix)**:
  - Six standardized pillars (0-100 scale): Contract Stability (target: 85), Tenure & Loyalty (target: 70), Security & Support (target: 80), Cloud & Device Care (target: 75), Media Engagement (target: 65), Payment Hygiene (target: 90).
- **Countermeasure "What-If" Simulator & Prescriptive ROI**:
  - Lets operators simulate retention offers before contacting the customer.
  - Interactive levers: Contract upgrade (1-Yr / 2-Yr lock), Security + Tech Support bundle, Auto-pay direct debit switch, Retention credit discount ($0, -$5, -$10, -$15/mo).
  - Preserved ARR Formula: \`ARR Preserved = (MonthlyCharges - Credit) * 12 * (Original Risk - Simulated Risk)\`.
- **Batch Cohort Visualizations**:
  - 10-Decile Histogram: Stratifies cohorts into 10% risk bands (Low < 35%, Medium 35-60%, High ≥ 60%).
  - Portfolio Revenue Scatter Matrix: Plots Tenure (0-72m) vs Monthly Bill ($18-$120) across 4 quadrants:
    1. 🚨 Critical Danger Zone: Tenure ≤ 24m & Monthly Bill > $70 (immediate revenue flight hazard).
    2. 👑 High-Value VIPs: Tenure > 24m & Monthly Bill > $70 (high lifetime value accounts).
    3. 🌱 Onboarding Phase: Tenure ≤ 24m & Monthly Bill ≤ $70.
    4. 🛡️ Stable Utility Core: Tenure > 24m & Monthly Bill ≤ $70.
  - Segment Drivers: Identifies highest ARR loss concentration across Contract, Tech, and Payment segments.

=== 4. LIVE CONTEXT AWARENESS ===
When answering, always reference the user's active page and any live customer or cohort metrics provided in the system context. Give concise, confident, executive-ready advice with markdown formatting.
`;

/**
 * Intelligent built-in knowledge retrieval & diagnostic engine.
 * Operates zero-config in-browser or on server without requiring external API keys.
 */
export function generateDiagnosticResponse(query, context = {}) {
  const q = (query || '').toLowerCase();
  const { page = 'single', profile = null, prob = null, cohortStats = null } = context;

  // 1. Live Customer Diagnostics ("Why is this customer at X%?", "How to retain?", etc.)
  if (
    (q.includes('this customer') || q.includes('active profile') || q.includes('current customer') || q.includes('why') || q.includes('retain') || q.includes('save') || q.includes('reduce')) &&
    profile &&
    prob !== null
  ) {
    const riskPct = Math.round(prob * 100);
    const contract = profile.Contract || 'Month-to-month';
    const tenure = Number(profile.tenure) || 0;
    const bill = Number(profile.MonthlyCharges) || 0;
    const tech = profile.TechSupport === 'Yes';
    const security = profile.OnlineSecurity === 'Yes';
    const autopay = profile.PaymentMethod?.includes('automatic');

    let keyDrivers = [];
    let interventions = [];
    let potentialReduction = 0;

    if (contract === 'Month-to-month') {
      keyDrivers.push('**Month-to-month agreement**: Lacks contractual commitment, driving +28.8% flight exposure in the XGBoost trees.');
      interventions.push('**Upgrade to a 2-Year Contract**: Eliminates commitment friction and slashes churn risk by ~35%.');
      potentialReduction += 35;
    }
    if (tenure <= 12) {
      keyDrivers.push(`**Early lifecycle tenure (${tenure} mo)**: Customer is in the high-volatility onboarding window.`);
      interventions.push('**Proactive Onboarding Check-in**: Connect via Customer Success within the first 90 days.');
      potentialReduction += 10;
    }
    if (!tech || !security) {
      keyDrivers.push('**Zero Cyber/Tech Support attachment**: Vulnerable to unresolved technical glitches.');
      interventions.push('**Attach Tech Support & Online Security bundle**: Increases account stickiness by ~15%.');
      potentialReduction += 15;
    }
    if (!autopay) {
      keyDrivers.push(`**Manual Payment (${profile.PaymentMethod || 'Electronic check'})**: Creates recurring monthly billing friction.`);
      interventions.push('**Enroll in Auto-Pay Direct Debit**: Removes friction and saves an estimated 10% in risk.');
      potentialReduction += 10;
    }

    const targetRisk = Math.max(5, riskPct - potentialReduction);
    const arrSaved = Math.round((bill * 12) * ((riskPct - targetRisk) / 100));

    return `### 🔍 Live Diagnostic: Customer Risk Profile (${riskPct}% Churn Risk)

Based on the active XGBoost feature evaluation:

${keyDrivers.map(d => `- ${d}`).join('\n')}

---

### 🛡️ Recommended Retention Playbook
${interventions.map((item, idx) => `${idx + 1}. ${item}`).join('\n')}

**Projected Financial Yield**:
- Current Predicted Risk: **${riskPct}%**
- Projected Risk after Countermeasures: **${targetRisk}%**
- Estimated Annual Revenue Preserved: **+$${arrSaved.toLocaleString()} / year**

*Tip: You can simulate these exact interventions live using the **⚡ What-If Simulator** tab.*`;
  }

  // 2. Questions about the Machine Learning Model / XGBoost
  if (q.includes('xgboost') || q.includes('model') || q.includes('algorithm') || q.includes('machine learning') || q.includes('tree') || q.includes('predict') || q.includes('accuracy')) {
    return `### 🤖 ChurnPred XGBoost ML Engine Architecture

ChurnPred is powered by a high-performance **XGBoost (Extreme Gradient Boosting)** ensemble:

1. **Ensemble Architecture**:
   - **100 Gradient-Boosted Decision Trees** compiled into direct JavaScript evaluation (\`src/model/churn_model.js\`).
   - Every tree performs hierarchical binary splits across the 19 subscriber features (evaluating split thresholds like Contract type, MonthlyCharges > $70, and tenure < 12m).

2. **Inference & Scoring Pipeline**:
   - For every customer input vector, the engine traverses all 100 trees simultaneously and sums the leaf log-odds margins.
   - The raw margin is converted into a calibrated probability via logistic sigmoid:
     $$\\text{Probability} = \\frac{1}{1 + e^{-\\text{margin}}}$$
   - Predictions span the full dynamic spectrum from **4.1%** (Loyal Veterans) to **93.1%** (Severe Flight Hazards), with a population baseline of **27%**.

3. **Client-Side Speed**:
   - The model executes in under **1 millisecond** completely in-browser, delivering instant reactive scoring with zero network latency.`;
  }

  // 3. Questions about Visual Analytics / Explainable AI (XAI)
  if (q.includes('waterfall') || q.includes('shap') || q.includes('radar') || q.includes('what-if') || q.includes('simulator') || q.includes('visual')) {
    return `### 📊 Visual Analytics & Explainable AI (XAI) Suite

ChurnPred includes 3 visual intelligence modules for individual subscriber analysis:

1. **Dynamic SHAP Waterfall Attribution (\`WaterfallChart.jsx\`)**:
   - Demonstrates *why* the XGBoost model made its decision.
   - Starts at the **27% Population Baseline** and visualizes step-by-step risk additions (+Risk in crimson) and protective factors (-Risk in emerald) leading to the final score.

2. **6-Axis Account Health Radar (\`HealthRadar.jsx\`)**:
   - Diagnoses account health across 6 strategic operational pillars:
     - **Contract Stability** (Benchmark Target: 85)
     - **Tenure & Loyalty** (Benchmark Target: 70)
     - **Cyber Security & Support** (Benchmark Target: 80)
     - **Cloud & Device Care** (Benchmark Target: 75)
     - **Media Engagement** (Benchmark Target: 65)
     - **Payment Hygiene** (Benchmark Target: 90)
   - Directly overlays the subscriber's polygon against the target benchmark.

3. **What-If Countermeasure Simulator (\`WhatIfSimulator.jsx\`)**:
   - An interactive sandbox to test policy changes (Contract migration, Tech bundles, Auto-pay switch, Retention credit).
   - Projects live ARR preserved before rolling out retention campaigns!`;
  }

  // 4. Questions about Batch Scoring & Cohort Intelligence
  if (q.includes('batch') || q.includes('csv') || q.includes('cohort') || q.includes('scatter') || q.includes('matrix') || q.includes('danger zone') || q.includes('vip')) {
    const statsText = cohortStats && cohortStats.totalCount > 0
      ? `\n**Currently Scored Cohort**: ${cohortStats.totalCount} accounts | ${cohortStats.highRiskCount} High Risk (${cohortStats.highRiskPct}%) | $${cohortStats.totalLoss?.toLocaleString()} ARR at Risk.`
      : '';

    return `### 📂 Batch CSV Cohort Analytics Suite
${statsText}

The Batch scoring workspace provides portfolio-wide risk segmentation:

1. **10-Decile Risk Histogram**:
   - Groups accounts into 10% risk bands to highlight risk concentration.
   - Click any decile bar or tier card to instantly filter the customer table below.

2. **Portfolio Revenue Scatter Matrix (Tenure vs Monthly Spend)**:
   - Maps accounts across 4 strategic quadrants:
     - 🚨 **Critical Danger Zone**: Short Tenure (≤24m) & High Monthly Bill (>$70) — immediate flight risk.
     - 👑 **High-Value VIPs**: Seasoned Tenure (>24m) & High Monthly Bill (>$70) — accounts to lock in proactively.
     - 🌱 **Onboarding Phase**: Short Tenure (≤24m) & Low Monthly Bill (≤$70).
     - 🛡️ **Stable Utility Core**: Seasoned Tenure (>24m) & Low Monthly Bill (≤$70).

3. **Segment Risk Drivers**:
   - Pinpoints which contracts, internet techs, or payment types generate the highest aggregate ARR flight losses.`;
  }

  // 5. Default Comprehensive Help & Navigation Overview
  return `### ✦ Hello! I'm ChurnPred AI, your Retention Intelligence Guide.

I have complete architectural and diagnostic expertise across the ChurnPred platform:

- **XGBoost Machine Learning**: Ask me about model training, feature split logic, probability calibration (4%–93%), or inference speed.
- **Explainable AI (XAI)**: Ask about SHAP Waterfall attributions, 6-Axis Health Radar benchmarks, or the What-If Simulator.
- **Live Profile Diagnostics**: On the Single Profile page, ask *"Why is this customer at high risk?"* or *"What retention plan should I offer?"*
- **Cohort Analysis**: Ask about the Portfolio Scatter Matrix, Danger Zone identification, or Batch CSV scoring.

*Try tapping one of the quick starter prompts below or ask any question!*`;
}
