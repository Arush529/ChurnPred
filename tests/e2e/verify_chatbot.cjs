const { spawn } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

async function main() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-chat-'));
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9251',
    `--user-data-dir=${tmpDir}`,
    '--no-first-run',
    'about:blank'
  ]);

  try {
    for (let i = 0; i < 30; i++) {
      try {
        await fetch('http://127.0.0.1:9251/json/version');
        break;
      } catch (e) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    const listRes = await fetch('http://127.0.0.1:9251/json/list');
    const targets = await listRes.json();
    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

    await new Promise((resolve) => ws.addEventListener('open', resolve));

    let id = 1;
    const send = (method, params = {}) => new Promise((resolve) => {
      const msgId = id++;
      const handler = (event) => {
        const data = JSON.parse(event.data);
        if (data.id === msgId) {
          ws.removeEventListener('message', handler);
          resolve(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

    const evaluate = async (expression) => {
      const res = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true
      });
      return res?.result?.value;
    };

    const capture = async (filename) => {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      const buffer = Buffer.from(res.data, 'base64');
      fs.writeFileSync(path.join(__dirname, '..', filename), buffer);
      console.log('Saved screenshot:', filename);
    };

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 1050,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log('Navigating to http://localhost:8000/ ...');
    await send('Page.navigate', { url: 'http://localhost:8000/' });
    await new Promise(r => setTimeout(r, 2000));

    // 1. Capture launcher button
    console.log('Checking launcher button...');
    const launcherExists = await evaluate(`!!document.getElementById('churn-ai-launcher')`);
    console.log('Launcher exists:', launcherExists);
    await capture('ss_chatbot_launcher.png');

    // 2. Click launcher button to open chat drawer
    console.log('Opening chat window...');
    await evaluate(`document.getElementById('churn-ai-launcher').click()`);
    await new Promise(r => setTimeout(r, 800));
    await capture('ss_chatbot_open.png');

    // 3. Click the XGBoost starter chip
    console.log('Clicking XGBoost starter chip...');
    await evaluate(`
      const chips = Array.from(document.querySelectorAll('.quick-starter-chip'));
      const xgChip = chips.find(c => c.textContent.includes('XGBoost')) || chips[0];
      if (xgChip) xgChip.click();
    `);
    
    // Wait for response from backend /api/chat
    console.log('Waiting for response...');
    await new Promise(r => setTimeout(r, 3000));
    await capture('ss_chatbot_answered_xgboost.png');

    // 4. Authenticate and navigate to single predictor
    console.log('Authenticating and switching to single predictor...');
    await evaluate(`
      (async () => {
        const auth = await import('/src/lib/authDb.js');
        await auth.loginUser({ email: 'arush.masih29@gmail.com', password: 'securePassword123!' });
        window.location.hash = '#single';
        window.location.reload();
      })()
    `);
    await new Promise(r => setTimeout(r, 2500));

    // Click "High Flight-Risk" preset to populate active profile and gauge
    console.log('Selecting High Flight-Risk preset...');
    await evaluate(`
      const buttons = Array.from(document.querySelectorAll('button'));
      const highRiskBtn = buttons.find(b => b.textContent.includes('High Flight-Risk'));
      if (highRiskBtn) highRiskBtn.click();
    `);
    await new Promise(r => setTimeout(r, 1000));

    // Open chat again on single predictor page
    console.log('Opening chat on Single Predictor...');
    await evaluate(`
      const launcher = document.getElementById('churn-ai-launcher');
      if (launcher) launcher.click();
    `);
    await new Promise(r => setTimeout(r, 1000));
    await capture('ss_chatbot_single_context.png');

    // Send a customer-specific prompt
    console.log('Asking about retention strategies for the current profile...');
    await evaluate(`
      const input = document.getElementById('churn-ai-input');
      const sendBtn = document.getElementById('churn-ai-send');
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(input, "What is the primary driver of this customer's risk and what countermeasure should I apply?");
      input.dispatchEvent(new Event('input', { bubbles: true }));
      setTimeout(() => {
        sendBtn.click();
      }, 250);
    `);
    await new Promise(r => setTimeout(r, 4000));
    await capture('ss_chatbot_customer_retention.png');

    // 5. Switch to Batch CSV page and score a sample cohort
    console.log('Switching to Batch CSV page...');
    await evaluate(`
      (async () => {
        window.location.hash = '#batch';
        window.location.reload();
      })()
    `);
    await new Promise(r => setTimeout(r, 2500));

    // Upload & score cohort via file drop
    console.log('Uploading and scoring cohort...');
    await evaluate(`
      (async () => {
        const dt = new DataTransfer();
        const csvContent = 'customerID,gender,SeniorCitizen,Partner,Dependents,tenure,PhoneService,MultipleLines,InternetService,OnlineSecurity,OnlineBackup,DeviceProtection,TechSupport,StreamingTV,StreamingMovies,Contract,PaperlessBilling,PaymentMethod,MonthlyCharges,TotalCharges\\n' +
          'CUST-1001,Male,0,No,No,32,Yes,No,DSL,Yes,Yes,No,Yes,No,No,Two year,No,Mailed check,55.00,1760.00\\n' +
          'CUST-1002,Female,1,No,No,10,Yes,Yes,Fiber optic,No,No,No,No,Yes,Yes,Month-to-month,Yes,Electronic check,96.34,963.40\\n' +
          'CUST-1003,Male,0,Yes,Yes,68,Yes,Yes,Fiber optic,Yes,Yes,Yes,Yes,Yes,Yes,Two year,No,Credit card (automatic),110.25,7497.00\\n' +
          'CUST-1004,Female,0,No,No,4,Yes,No,DSL,No,No,No,No,No,No,Month-to-month,Yes,Electronic check,45.60,182.40';
        
        const file = new File([csvContent], 'test_cohort.csv', { type: 'text/csv' });
        dt.items.add(file);
        
        const dropzone = document.getElementById('csv-dropzone');
        const dropEvent = new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer: dt
        });
        dropzone.dispatchEvent(dropEvent);
      })()
    `);
    await new Promise(r => setTimeout(r, 1000));

    // Click Process & Score Cohort button
    await evaluate(`
      const buttons = Array.from(document.querySelectorAll('button'));
      const scoreBtn = buttons.find(b => b.textContent.includes('Process & Score Cohort'));
      if (scoreBtn) scoreBtn.click();
    `);
    await new Promise(r => setTimeout(r, 1500));

    // Open chat on batch page
    console.log('Opening chat on Batch page...');
    await evaluate(`
      const launcher = document.getElementById('churn-ai-launcher');
      if (launcher) launcher.click();
    `);
    await new Promise(r => setTimeout(r, 1000));
    await capture('ss_chatbot_batch_context.png');

    // Ask cohort question
    console.log('Asking cohort analysis question...');
    await evaluate(`
      const input = document.getElementById('churn-ai-input');
      const sendBtn = document.getElementById('churn-ai-send');
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(input, "What is our cohort risk breakdown and where should we focus our retention budget?");
      input.dispatchEvent(new Event('input', { bubbles: true }));
      setTimeout(() => sendBtn.click(), 250);
    `);
    await new Promise(r => setTimeout(r, 4000));
    await capture('ss_chatbot_batch_cohort_answer.png');

    console.log('Verification completed successfully!');
    ws.close();
  } catch (err) {
    console.error('Error in verification:', err);
  } finally {
    chrome.kill();
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (e) {}
  }
}

main();
