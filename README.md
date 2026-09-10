# ✦ Telco Customer Churn Predictor

[![Live Demo](https://img.shields.io/badge/Demo-Live_Web_App-a4f275?style=for-the-badge&logoColor=black)](https://churn-pred-mu.vercel.app/)

A lightweight, highly interactive web application that predicts telecom customer churn in real-time. Built entirely with Vanilla JavaScript, it executes an XGBoost machine learning model directly in the browser—requiring absolutely no backend server or API calls.

## ⚡ Features

* **Real-Time ML Scoring:** Uses an XGBoost model (exported to native JavaScript) to process 19 demographic and account features, instantly outputting a churn probability score.
* **Serverless Architecture:** The predictive model runs entirely on the client-side edge, ensuring zero latency and maximum privacy.
* **Next Best Action (NBA) Engine:** Automatically generates targeted retention strategies (e.g., contract discounts, tech upsells) based on the highest-weighted risk factors for the specific user profile.
* **Custom WebGL UI:** Features an interactive 3D liquid-warp title engine built with OGL.
* **Dynamic Specular Styling:** Implements pure CSS cursor-tracking hover effects and custom dark-mode form components without relying on heavy UI libraries.

## 🛠️ Tech Stack

* **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3
* **Machine Learning:** XGBoost (Model trained in Python, exported via m2cgen)
* **Graphics & Rendering:** OGL (WebGL framework)
* **Hosting:** GitHub Pages

## 📂 Project Structure

\`\`\`text
├── css/
│   └── style.css            # Custom styling, dark mode variables, and specular hover engine
├── data/
│   └── *.csv                # Historical training data and cleaned datasets (Not used in prod)
├── js/
│   ├── main.js              # Core UI logic, state management, and feature engineering
│   └── churn_model.js       # Exported XGBoost model weights and sigmoid conversion logic
└── index.html               # Main application entry point
\`\`\`

## 🚀 How to Run Locally

Because this project uses a native Vanilla JS architecture, it requires zero build steps or package installations.

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/Arush529/ChurnPred.git
   \`\`\`
2. Navigate to the project folder:
   \`\`\`bash
   cd ChurnPred
   \`\`\`
3. Open `index.html` directly in any modern web browser, or serve it using a local development server (like VS Code Live Server).

## 🧠 Machine Learning Integration

The underlying prediction engine was originally trained on the IBM Telco Customer Churn dataset using **XGBoost**. To achieve a serverless deployment, the trained tree ensembles were transpiled directly into nested JavaScript conditional logic. The web application maps user form inputs to a 33-feature array, processes it through the model, and applies a sigmoid function to return the final probability percentage.

---
*Designed and built by Arush529*
