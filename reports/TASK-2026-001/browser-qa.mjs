import { createApp } from '../../server.mjs';
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import assert from 'node:assert/strict';
import http from 'node:http';

const output = resolve('reports/TASK-2026-001');
const profile = await mkdtemp(join(output, 'chrome-qa-'));
const dataFile = join(profile, 'assets.json');
const server = await createApp({ dataFile });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const results = { checks: [], consoleErrors: [], requestFailures: [], screenshots: [], lint: {} };
let ws;
const delay = ms => new Promise(r => setTimeout(r, ms));
function checked(name, value) { assert.ok(value, name); results.checks.push(name); }
try {
  let port;
  for (let i = 0; i < 100; i++) { try { port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break; } catch { await delay(100); } }
  assert.ok(port, 'Chrome DevTools port');
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let seq = 0;
  const waiting = new Map();
  ws.onmessage = event => { const message = JSON.parse(event.data); if (message.id) { const p = waiting.get(message.id); if (p) { waiting.delete(message.id); message.error ? p.reject(new Error(JSON.stringify(message.error))) : p.resolve(message.result); } } else if (message.method === 'Runtime.exceptionThrown') results.consoleErrors.push(message.params); else if (message.method === 'Network.loadingFailed') results.requestFailures.push(message.params); };
  const cdp = (method, params = {}) => new Promise((resolve, reject) => { const id = ++seq; waiting.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
  const evaluate = async expression => { const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails)); return result.result.value; };
  const waitFor = async expression => { for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await delay(50); } throw new Error(`Timeout: ${expression}`); };
  const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  async function screenshot(name) { const { data } = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }); await writeFile(join(output, name), Buffer.from(data, 'base64')); results.screenshots.push(name); }
  const lint = () => evaluate(`(() => {
    const visible = e => { const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&!e.closest('[hidden]'); };
    const texts=[...document.querySelectorAll('body *')].filter(e=>visible(e)&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()));
    const tiny=texts.filter(e=>parseFloat(getComputedStyle(e).fontSize)<12).map(e=>({text:e.textContent.trim().slice(0,90),size:getComputedStyle(e).fontSize}));
    const overflow=[...document.querySelectorAll('body *')].filter(e=>visible(e)&&!['STYLE','SCRIPT'].includes(e.tagName)&&e.scrollWidth>e.clientWidth+2&&getComputedStyle(e).overflowX==='visible').map(e=>({tag:e.tagName,id:e.id,width:e.clientWidth,scroll:e.scrollWidth}));
    const unlabeled=[...document.querySelectorAll('input,textarea,select,button')].filter(visible).filter(e=>!(e.labels?.length||e.getAttribute('aria-label')||e.getAttribute('aria-labelledby')||e.textContent.trim())).map(e=>e.outerHTML);
    function rgb(c){return (c.match(/[\\d.]+/g)||[]).map(Number)}
    function back(e){if(!e)return [255,255,255];let c=rgb(getComputedStyle(e).backgroundColor),b=back(e.parentElement),a=c[3]??1;return c.slice(0,3).map((v,i)=>v*a+b[i]*(1-a));}
    function lum(c){let v=c.map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*v[0]+.7152*v[1]+.0722*v[2]}
    const contrast=texts.map(e=>{let s=getComputedStyle(e),a=lum(rgb(s.color).slice(0,3)),b=lum(back(e)),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05),large=parseFloat(s.fontSize)>=24||(parseFloat(s.fontSize)>=18.66&&Number(s.fontWeight)>=700);return {text:e.textContent.trim().slice(0,90),ratio,required:large?3:4.5};}).filter(x=>x.ratio<x.required);
    return {viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,tiny,overflow,unlabeled,contrast,missingAlt:[...document.images].filter(e=>!e.hasAttribute('alt')).length};
  })()`);
  await cdp('Runtime.enable'); await cdp('Network.enable'); await cdp('Page.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await cdp('Page.navigate', { url: base }); await waitFor(`!document.querySelector('#loading')?.hidden===false && !!document.querySelector('#empty-title')`);
  checked('empty state', await evaluate(`document.querySelector('#empty-title').textContent.includes('inventário')`));
  await screenshot('desktop-empty.png');
  await click('#create');
  checked('initial focus and dialog', await evaluate(`document.querySelector('#asset-dialog').open && document.activeElement.name==='identification'`));
  checked('required native validation', await evaluate(`!document.querySelector('#asset-form').checkValidity()`));
  const fields = { identification: 'PAT-QA-001', description: 'Notebook de criação e operações', location: 'Escritório · Sala 02', responsible: 'João Gonçalves', value: '3299.90', acquiredAt: '2024-02-29', status: 'ativo' };
  await evaluate(`for(const [key,value] of Object.entries(${JSON.stringify(fields)}))document.querySelector('#asset-form').elements[key].value=value`);
  await screenshot('desktop-form.png'); await click('#save');
  await waitFor(`document.querySelectorAll('#asset-list tr').length===1 && !document.querySelector('#asset-dialog').open`);
  checked('create from UI', true);
  await screenshot('desktop-inventory.png'); results.lint.desktop = await lint();
  await click('.details-button');
  checked('details contain fields', await evaluate(`document.querySelector('#details').textContent.includes('João Gonçalves') && document.querySelector('#details').textContent.includes('29/02/2024')`));
  await evaluate(`Array.from(document.querySelectorAll('#details button')).find(e=>e.textContent==='Editar bem').click()`);
  await evaluate(`document.querySelector('#asset-form').elements.location.value='Sala de reunião';document.querySelector('#asset-form').elements.status.value='manutencao'`);
  await click('#save'); await waitFor(`!document.querySelector('#asset-dialog').open`);
  checked('edit updates listing', await evaluate(`document.querySelector('#asset-list').textContent.includes('Sala de reunião')&&document.querySelector('#asset-list').textContent.includes('Em manutenção')`));
  await evaluate(`document.querySelector('#search').value='reuniao';document.querySelector('#search').dispatchEvent(new Event('input'))`);
  checked('accent insensitive search', await evaluate(`document.querySelectorAll('#asset-list tr').length===1`));
  await evaluate(`document.querySelector('#status-filter').value='ativo';document.querySelector('#status-filter').dispatchEvent(new Event('change'))`);
  checked('status filter empty', await evaluate(`!document.querySelector('#empty').hidden && document.querySelector('#empty-title').textContent==='Nenhum bem encontrado'`));
  await evaluate(`document.querySelector('#status-filter').value='all';document.querySelector('#status-filter').dispatchEvent(new Event('change'))`);
  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await screenshot('mobile-inventory.png'); results.lint.mobile = await lint();
  await click('.details-button'); await screenshot('mobile-details.png'); results.lint.mobileDetails=await lint();
  await evaluate(`Array.from(document.querySelectorAll('#details button')).find(e=>e.textContent==='Editar bem').click()`);
  await screenshot('mobile-form.png'); results.lint.mobileForm=await lint(); await click('#cancel-form');
  await click('.details-button'); await click('.text-danger');
  checked('retire confirmation focus', await evaluate(`document.querySelector('#retire-dialog').open && document.activeElement.id==='cancel-retire'`));
  await screenshot('mobile-retire.png'); await click('#cancel-retire');
  checked('cancel retire preserves status', await evaluate(`document.querySelector('#details').textContent.includes('Em manutenção')`));
  await click('.text-danger'); await click('#confirm-retire'); await waitFor(`!document.querySelector('#retire-dialog').open`);
  checked('retire retained in listing', await evaluate(`document.querySelector('#asset-list').textContent.includes('Baixado') && document.querySelector('#active-count').textContent==='0'`));
  await click('.details-button');
  checked('retired details date and no repeat action', await evaluate(`document.querySelector('#details').textContent.includes('Data da baixa') && !document.querySelector('.text-danger')`));
  await click('#close-dialog');
  await cdp('Network.enable'); await cdp('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  await evaluate('load()'); await waitFor(`!document.querySelector('#load-error').hidden`); await screenshot('mobile-error.png');
  checked('connection error and retry', await evaluate(`document.querySelector('#load-error').textContent.includes('conectar') && !!document.querySelector('#retry')`));
  await cdp('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await click('#retry'); await waitFor(`document.querySelector('#load-error').hidden && !document.querySelector('#table-wrap').hidden`);
  checked('retry recovers', true);
  for (const [name, value] of Object.entries(results.lint)) { checked(`${name} no horizontal page overflow`, value.documentWidth===value.viewport); checked(`${name} labeled controls`, !value.unlabeled.length); }
  checked('no browser JS exceptions', !results.consoleErrors.length);
  // Chunk boundary splits the two-byte UTF-8 letter ã to verify decoding across packets.
  const payload = { ...fields, identification:'UTF8-QA', description:'Identificação São João', value:0.29 };
  const buffer=Buffer.from(JSON.stringify(payload)); const split=buffer.indexOf(Buffer.from('ã'))+1;
  const chunked=await new Promise((resolve,reject)=>{const req=http.request(`${base}/api/assets`,{method:'POST',headers:{'Content-Type':'application/json'}},res=>{let body='';res.setEncoding('utf8');res.on('data',c=>body+=c);res.on('end',()=>resolve({status:res.statusCode,body:JSON.parse(body)}));});req.on('error',reject);req.write(buffer.subarray(0,split));setTimeout(()=>req.end(buffer.subarray(split)),20);});
  checked('UTF8 across chunk boundaries preserved',chunked.status===201&&chunked.body.description===payload.description);
  checked('two decimal value preserved',chunked.body.value===0.29);
  const badValue=await fetch(`${base}/api/assets`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,identification:'EXTRA-DP',value:1.001})});
  checked('extra decimal places rejected',badValue.status===400);
  results.failedChecks=Object.entries(results.lint).filter(([,value])=>value.contrast.length).map(([name])=>`${name} contrast >= WCAG AA`);
  results.verdict=results.failedChecks.length?'REPROVADO':'APROVADO';
  if(results.failedChecks.length)process.exitCode=1;
} catch(error) { results.verdict='REPROVADO';results.error=error.stack;process.exitCode=1; }
finally { await writeFile(join(output,'browser-qa-results.json'),JSON.stringify(results,null,2)+'\n');ws?.close();chrome.kill();await new Promise(r=>server.close(r));await delay(500);if(profile.startsWith(output+ '\\chrome-qa-'))await rm(profile,{recursive:true,force:true,maxRetries:10,retryDelay:200}).catch(()=>{}); }
console.log(JSON.stringify(results,null,2));
