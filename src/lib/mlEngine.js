import { scoreProfile } from '../model/churn_model.js';

export const RISK_STYLES = { 
  "High Risk": { hex: "#ff3366", glow: "rgba(255,51,102,0.45)", badgeBg: "bg-red-500/15", badgeText: "text-red-400", border: "border-red-500/30" }, 
  "Medium Risk": { hex: "#ffac52", glow: "rgba(255,172,82,0.45)", badgeBg: "bg-amber-500/15", badgeText: "text-amber-400", border: "border-amber-500/30" }, 
  "Low Risk": { hex: "#00f298", glow: "rgba(0,242,152,0.45)", badgeBg: "bg-emerald-500/15", badgeText: "text-emerald-400", border: "border-emerald-500/30" } 
};

export const PERSONA_PRESETS = {
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

export function buildFeatureVector(p) {
  const avgSpend = (p.TotalCharges || 0) / (p.tenure === 0 ? 1 : p.tenure);
  const isNew = p.tenure <= 3 ? 1 : 0;
  const hasMulti = (p.OnlineSecurity === 'Yes' ? 1 : 0) + 
                   (p.OnlineBackup === 'Yes' ? 1 : 0) + 
                   (p.DeviceProtection === 'Yes' ? 1 : 0) + 
                   (p.TechSupport === 'Yes' ? 1 : 0);

  return [
    p.gender === 'Male' ? 1 : 0, 
    p.SeniorCitizen === 'Yes' ? 1 : 0, 
    p.Partner === 'Yes' ? 1 : 0, 
    p.Dependents === 'Yes' ? 1 : 0, 
    Number(p.tenure) || 0, 
    p.PhoneService === 'Yes' ? 1 : 0, 
    p.PaperlessBilling === 'Yes' ? 1 : 0, 
    Number(p.MonthlyCharges) || 0, 
    Number(p.TotalCharges) || 0, 
    avgSpend, 
    isNew, 
    hasMulti,
    p.MultipleLines === 'No phone service' ? 1 : 0, 
    p.MultipleLines === 'Yes' ? 1 : 0, 
    p.InternetService === 'Fiber optic' ? 1 : 0, 
    p.InternetService === 'No' ? 1 : 0,
    p.OnlineSecurity === 'No internet service' ? 1 : 0, 
    p.OnlineSecurity === 'Yes' ? 1 : 0, 
    p.OnlineBackup === 'No internet service' ? 1 : 0, 
    p.OnlineBackup === 'Yes' ? 1 : 0,
    p.DeviceProtection === 'No internet service' ? 1 : 0, 
    p.DeviceProtection === 'Yes' ? 1 : 0, 
    p.TechSupport === 'No internet service' ? 1 : 0, 
    p.TechSupport === 'Yes' ? 1 : 0,
    p.StreamingTV === 'No internet service' ? 1 : 0, 
    p.StreamingTV === 'Yes' ? 1 : 0, 
    p.StreamingMovies === 'No internet service' ? 1 : 0, 
    p.StreamingMovies === 'Yes' ? 1 : 0,
    p.Contract === 'One year' ? 1 : 0, 
    p.Contract === 'Two year' ? 1 : 0,
    p.PaymentMethod === 'Credit card (automatic)' ? 1 : 0, 
    p.PaymentMethod === 'Electronic check' ? 1 : 0, 
    p.PaymentMethod === 'Mailed check' ? 1 : 0
  ];
}

export function calcProbability(p) {
  if (typeof scoreProfile !== "function") throw new Error("Model not loaded");
  const features = buildFeatureVector(p);
  const result = scoreProfile(features);
  if (Array.isArray(result)) { 
    return result.length > 1 ? result[1] : result[0]; 
  }
  return (result >= 0 && result <= 1) ? result : 1 / (1 + Math.exp(-result));
}

export function computeModelAttribution(baseProfile, baseProb) {
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

  const ecoCount = (baseProfile.OnlineSecurity === 'Yes' ? 1 : 0) + 
                   (baseProfile.OnlineBackup === 'Yes' ? 1 : 0) + 
                   (baseProfile.DeviceProtection === 'Yes' ? 1 : 0) + 
                   (baseProfile.TechSupport === 'Yes' ? 1 : 0);

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

export function computeNextBestAction(profile, baseProb, riskLevel) {
  if (riskLevel === "Low Risk" || baseProb < 0.35) {
    return {
      header: "⚡ ACCOUNT STABILIZED",
      type: "Account in Good Standing",
      text: "Very low risk of churning. Maintain standard loyalty engagement and periodic satisfaction surveys.",
      reduction: 0,
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
      text: `High flight risk due to month-to-month agreement. Upgrading customer to a ${targetContract} Contract reduces churn probability from ${Math.round(baseProb * 100)}% → ${Math.round(bestP * 100)}%.`
    });
  }

  if (profile.TechSupport !== 'Yes' || profile.OnlineSecurity !== 'Yes') {
    const pSupport = calcProbability({ ...profile, TechSupport: 'Yes', OnlineSecurity: 'Yes' });
    const reduction = (baseProb - pSupport) * 100;
    candidates.push({
      type: 'Tech Support & Security',
      reduction: reduction,
      text: `Low service integration increases churn risk. Offering a 3-month free trial of Premium Tech Support & Online Security drops churn from ${Math.round(baseProb * 100)}% → ${Math.round(pSupport * 100)}%.`
    });
  }

  if (profile.PaymentMethod === 'Electronic check' || profile.PaymentMethod === 'Mailed check') {
    const pAuto = calcProbability({ ...profile, PaymentMethod: 'Bank transfer (automatic)' });
    const reduction = (baseProb - pAuto) * 100;
    candidates.push({
      type: 'AutoPay Incentive',
      reduction: reduction,
      text: `Manual check payments create monthly friction. A $10 statement credit to enroll in Automatic Bank Transfer reduces churn from ${Math.round(baseProb * 100)}% → ${Math.round(pAuto * 100)}%.`
    });
  }

  candidates.sort((a, b) => b.reduction - a.reduction);

  if (candidates.length > 0 && candidates[0].reduction >= 1) {
    const best = candidates[0];
    return {
      header: `⚡ RECOMMENDED ACTION: ${best.type.toUpperCase()}`,
      type: best.type,
      text: best.text,
      reduction: Math.round(best.reduction),
      color: "var(--risk-high)"
    };
  }

  return {
    header: "⚡ CUSTOMER SUCCESS CHECK-IN",
    type: "Dedicated CS Review",
    text: "Multiple subtle risk indicators detected. Schedule a proactive check-in call from Customer Success to resolve service issues.",
    reduction: 0,
    color: "var(--risk-high)"
  };
}

export function normalizeCustomerRow(row, idx) {
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

  const annualLoss = riskTier === 'High Risk' ? prob * MonthlyCharges * 12 : 0;

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

export function generateSampleCohort() {
  const contracts = ['Month-to-month', 'One year', 'Two year'];
  const internets = ['Fiber optic', 'DSL', 'No'];
  const payments = ['Electronic check', 'Mailed check', 'Bank transfer (automatic)', 'Credit card (automatic)'];

  const sample = [];
  for (let i = 1; i <= 100; i++) {
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
      monthly = +(40 + Math.random() * 60).toFixed(2);
      paperless = Math.random() > 0.4 ? 'Yes' : 'No';
      security = Math.random() > 0.5 ? 'Yes' : 'No';
      techSupport = Math.random() > 0.5 ? 'Yes' : 'No';
    }

    const row = {
      customerID: `CUST-${1000 + i}`,
      gender: Math.random() > 0.5 ? 'Male' : 'Female',
      SeniorCitizen: Math.random() > 0.8 ? 'Yes' : 'No',
      Partner: Math.random() > 0.5 ? 'Yes' : 'No',
      Dependents: Math.random() > 0.7 ? 'Yes' : 'No',
      tenure,
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
      TotalCharges: +(monthly * tenure).toFixed(2)
    };

    sample.push(row);
  }

  return sample;
}
