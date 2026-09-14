const { spawn } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

async function main() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-warp-'));
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9254',
    `--user-data-dir=${tmpDir}`,
    '--no-first-run',
    'about:blank'
  ]);

  try {
    for (let i = 0; i < 30; i++) {
      try {
        await fetch('http://127.0.0.1:9254/json/version');
        break;
      } catch (e) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    const listRes = await fetch('http://127.0.0.1:9254/json/list');
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
    await new Promise(r => setTimeout(r, 2500));

    // Verify canvas exists inside #landing-warp-title-container
    const canvasStatus = await evaluate(`
      (() => {
        const container = document.getElementById('landing-warp-title-container');
        if (!container) return { found: false };
        const canvas = container.querySelector('canvas');
        return {
          found: true,
          canvasExists: !!canvas,
          width: canvas?.width,
          height: canvas?.height
        };
      })()
    `);
    console.log('Canvas Status:', canvasStatus);

    // Initial screenshot of Liquid Warp title
    await capture('ss_liquid_warp_initial.png');

    // Simulate mouse interaction across the title
    console.log('Simulating mousemove interaction over liquid title...');
    await evaluate(`
      (() => {
        const container = document.getElementById('landing-warp-title-container');
        const canvas = container?.querySelector('canvas');
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        
        // Dispatch mousemove event in the center of "Before It Happens"
        const evt = new MouseEvent('mousemove', {
          bubbles: true,
          clientX: rect.left + rect.width * 0.55,
          clientY: rect.top + rect.height * 0.65
        });
        canvas.dispatchEvent(evt);
      })()
    `);

    await new Promise(r => setTimeout(r, 500));
    await capture('ss_liquid_warp_hover.png');

    console.log('Verification of liquid warp completed successfully!');
    ws.close();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    chrome.kill();
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (e) {}
  }
}

main();
