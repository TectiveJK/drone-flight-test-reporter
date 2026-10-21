const $ = (id) => document.getElementById(id);

const sharedFields = ['objectiveType','objectiveType2','location','operator','observer','droneCategory','weather'];
function objectiveTypeText(data = {}) { return [data.objectiveType, data.objectiveType2].map(v => String(v || '').trim()).filter(Boolean).join(' / ') || 'N/A'; }
function normalizeEquipment(value) {
  if (Array.isArray(value)) return value.map(v => String(v || '').trim()).filter(Boolean);
  if (typeof value === 'string' && value.trim()) return value.split(',').map(v => v.trim()).filter(Boolean);
  return [];
}
function selectedEquipment() { return [...document.querySelectorAll('#equipmentList input[type="checkbox"]:checked')].map(el => el.value); }
function equipmentText(data = {}) { const items = normalizeEquipment(data.equipment); return items.length ? items.join(', ') : 'N/A'; }
function selectedFlightModes() { return [...document.querySelectorAll('#flightModesList input[type="checkbox"]:checked')].map(el => el.value); }
function flightModesText(flight = {}) { const items = normalizeEquipment(flight.flightModes); return items.length ? items.join(', ') : 'N/A'; }
const flightFields = ['flightDateTime','duration','missionPerformed','anomalies','immediateAction','flightResult'];
const state = { report: {}, flights: [], activeFlight: 0, attachments: [], flightLogPath: '', captureFilePath: [] };
function esc(value = '') { return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function nowLocal() { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0,16); }
function blankContext() { return { objectiveType:'', objectiveType2:'', location:'', operator:'', observer:'', droneCategory:'', weather:'', equipment:[] }; }
function copyContext(from = {}) { const ctx = blankContext(); sharedFields.forEach(k => { ctx[k] = from[k] || ''; }); ctx.equipment = normalizeEquipment(from.equipment); return ctx; }
function newFlight(number = state.flights.length + 1, from = {}) { return { id: crypto.randomUUID(), flightNumber:number, ...copyContext(from), flightDateTime:nowLocal(), duration:'', flightModes:[], missionPerformed:'', anomalies:'', immediateAction:'', flightResult:'Pending', flightLogPath:'', captureFilePath:'', attachments:[] }; }
function readFlight() {
  const f=state.flights[state.activeFlight]; if(!f)return;
  sharedFields.forEach(k=>f[k]=$(k).value.trim());
  f.equipment=selectedEquipment();
  flightFields.forEach(k=>f[k]=$(k).value);
  f.flightModes=selectedFlightModes();
  f.flightLogPath=state.flightLogPath; f.captureFilePath=state.captureFilePath; f.attachments=[...state.attachments];
}
function writeFlight() {
  const f=state.flights[state.activeFlight]; if(!f)return;
  sharedFields.forEach(k=>$(k).value=f[k]||'');
  const selectedEq = new Set(normalizeEquipment(f.equipment));
  document.querySelectorAll('#equipmentList input[type="checkbox"]').forEach(el => { el.checked = selectedEq.has(el.value); });
  flightFields.forEach(k=>$(k).value=f[k]??'');
  const selected = new Set(normalizeEquipment(f.flightModes));
  document.querySelectorAll('#flightModesList input[type="checkbox"]').forEach(el => { el.checked = selected.has(el.value); });
  state.flightLogPath=f.flightLogPath||''; state.captureFilePath=f.captureFilePath||''; state.attachments=[...(f.attachments||[])];
  const label=`Flight ${String(f.flightNumber).padStart(2,'0')}`;
  $('flightTitle').textContent=label;
  $('testReportFlightHint').textContent=`Applies to ${label}. Switch flights to enter different values.`;
  $('flightLogPathDisplay').textContent=state.flightLogPath||'Not selected';
  $('captureFilePathDisplay').textContent=state.captureFilePath||'Not selected';
  renderAttachments(); renderFlights();
}
function renderFlights() { $('flightCount').textContent=state.flights.length; $('flightList').innerHTML=state.flights.map((f,i)=>`<button class="flight-item ${i===state.activeFlight?'active':''}" data-index="${i}"><span>Flight ${String(f.flightNumber).padStart(2,'0')}</span><small>${esc(f.flightResult)}</small></button>`).join(''); document.querySelectorAll('.flight-item').forEach(b=>b.addEventListener('click',()=>{readFlight();state.activeFlight=Number(b.dataset.index);writeFlight();})); }
function renumberFlights() { state.flights.forEach((f,i)=>f.flightNumber=i+1); }
function addFlight() { readFlight(); const prev=state.flights[state.activeFlight]||{}; state.flights.push(newFlight(state.flights.length+1, prev)); state.activeFlight=state.flights.length-1; writeFlight(); }
function removeCurrentFlight() { if(state.flights.length<=1){alert('A report must contain at least one flight.');return;} if(!confirm(`Remove Flight ${String(state.activeFlight+1).padStart(2,'0')} from this report?`))return; state.flights.splice(state.activeFlight,1); renumberFlights(); state.activeFlight=Math.min(state.activeFlight,state.flights.length-1); writeFlight(); }
function readConclusion() { state.report.conclusion = ($('conclusion').value || '').trim(); }
function writeConclusion() { $('conclusion').value = state.report.conclusion || ''; }
function resetReport() { state.report={conclusion:''};state.flights=[newFlight(1)];state.activeFlight=0;state.attachments=[];state.flightLogPath='';state.captureFilePath='';writeConclusion();writeFlight();$('reportPreview').innerHTML='<p>Add flights and generate the report.</p>'; }
function loadReport(data) {
  if(!data||!Array.isArray(data.flights)||!data.flights.length){alert('This JSON file is not a valid Drone Flight Test Report.');return;}
  const fallback=copyContext(data);
  state.report={conclusion:data.conclusion||''};
  state.flights=data.flights.map((f,i)=>({
    ...newFlight(i+1),
    ...f,
    ...copyContext({ ...fallback, ...f }),
    flightNumber:i+1,
    flightModes:normalizeEquipment(f.flightModes),
    attachments:f.attachments||[],
    flightLogPath:f.flightLogPath||'',
    captureFilePath:f.captureFilePath||''
  }));
  state.activeFlight=0; writeConclusion(); writeFlight(); generate();
}
function renderAttachments() { $('attachmentList').innerHTML=state.attachments.length?state.attachments.map((p,i)=>`<div class="attachment-item"><span title="${esc(p)}">${esc(p)}</span><button class="remove-attachment secondary" data-index="${i}">Remove</button></div>`).join(''):'<em>No evidence attached.</em>'; document.querySelectorAll('.remove-attachment').forEach(b=>b.addEventListener('click',()=>{readFlight();state.attachments.splice(Number(b.dataset.index),1);writeFlight();})); }
function flightResultOf(f = {}) { return String(f.flightResult || f.result || '').trim(); }
function overallResult(flights = state.flights) {
  const r = flights.map(flightResultOf).filter(v => v && v !== 'Pending');
  if (!r.length) return 'PENDING';
  const hasPass = r.some(x => x === 'Pass' || x === 'Pass with observations');
  const hasFail = r.includes('Fail');
  const hasAbort = r.includes('Aborted');
  if ((hasFail || hasAbort) && hasPass) return 'PASS WITH OBSERVATIONS';
  if (hasFail) return 'FAIL';
  if (hasAbort) return 'ABORTED';
  if (r.includes('Pass with observations')) return 'PASS WITH OBSERVATIONS';
  if (r.every(x => x === 'Pass')) return 'PASS';
  return 'PENDING';
}
function reportData() { readFlight(); readConclusion(); const flights=state.flights.map((f,i)=>({...f,flightNumber:i+1})); return {version:5,createdAt:new Date().toISOString(),conclusion:state.report.conclusion||'',overallResult:overallResult(flights),flights}; }
function fileExt(p='') { const m=String(p).match(/\.[^./\\]+$/); return m?m[0]:''; }
function padFlight(n) { return String(n).padStart(2,'0'); }
function attachedLogName(f) { return f.flightLogPath ? `evidence/flight-${padFlight(f.flightNumber)}-log${fileExt(f.flightLogPath)}` : ''; }
function attachedCaptureName(f) { return f.captureFilePath ? `evidence/flight-${padFlight(f.flightNumber)}-capture${fileExt(f.captureFilePath)}` : ''; }
function attachedExtraName(f, p, i) { return `evidence/flight-${padFlight(f.flightNumber)}-attachment-${i+1}${fileExt(p)}`; }
function evidenceText(label, original, attached) { return original ? `${label}: ${attached} (attached)` : `${label}: None`; }
function coverContext(data = {}) { return (data.flights && data.flights[0]) || {}; }
function buildMarkdown(data) { const cover=coverContext(data); const out=[`# Drone Flight Test Report`,'',`**Overall Result:** ${data.overallResult}  `,`**Test Objective Type:** ${objectiveTypeText(cover)}  `,`**Location:** ${cover.location||'N/A'}  `,`**Responsible:** ${cover.operator||'N/A'}  `,`**Robotics & Software:** ${cover.observer||'N/A'}  `,`**UAV Category:** ${cover.droneCategory||'N/A'}  `,`**Equipment:** ${equipmentText(cover)}  `,`**Weather:** ${cover.weather||'N/A'}  `,'','## Flight Summary','','| Flight | Mission | Result | Duration |','|---:|---|---|---|']; data.flights.forEach(f=>out.push(`| ${f.flightNumber} | ${f.missionPerformed||'N/A'} | ${f.flightResult} | ${f.duration||'N/A'} |`)); data.flights.forEach(f=>{out.push('','## Flight '+String(f.flightNumber).padStart(2,'0')+' — '+f.flightResult,'',`**Date / Time:** ${f.flightDateTime||'N/A'}  `,`**Duration:** ${f.duration||'N/A'}  `,`**Flight Modes:** ${flightModesText(f)}`,'','### Mission',f.missionPerformed||'N/A','','### Anomaly / Bug',f.anomalies||'None reported','','### Immediate Action',f.immediateAction||'None','','### Evidence',`- ${evidenceText('Flight log', f.flightLogPath, attachedLogName(f))}`,`- ${evidenceText('Wireshark capture', f.captureFilePath, attachedCaptureName(f))}`,...(f.attachments||[]).map((x,i)=>`- Attachment: ${attachedExtraName(f,x,i)} (attached)`)); }); out.push('','## Conclusion','',`Overall test result: **${data.overallResult}**.`); if(data.conclusion) out.push('',data.conclusion); return out.join('\n'); }
function buildReportHTML(data) { const cover=coverContext(data); const summary=data.flights.map(f=>`<tr><td>${f.flightNumber}</td><td>${esc(f.missionPerformed||'N/A')}</td><td>${esc(f.flightResult)}</td><td>${esc(f.duration||'N/A')}</td></tr>`).join(''); const flights=data.flights.map(f=>`<section class="flight"><h2>Flight ${String(f.flightNumber).padStart(2,'0')} — ${esc(f.flightResult)}</h2><div class="facts"><b>Date:</b> ${esc(f.flightDateTime||'N/A')} <b>Duration:</b> ${esc(f.duration||'N/A')} <b>Flight Modes:</b> ${esc(flightModesText(f))}</div><h3>Mission</h3><p>${esc(f.missionPerformed||'N/A').replace(/\n/g,'<br>')}</p><h3>Anomaly / Bug</h3><p>${esc(f.anomalies||'None reported').replace(/\n/g,'<br>')}</p><h3>Immediate Action</h3><p>${esc(f.immediateAction||'None').replace(/\n/g,'<br>')}</p><h3>Evidence</h3><ul><li>${esc(evidenceText('Flight log', f.flightLogPath, attachedLogName(f)))}</li><li>${esc(evidenceText('Wireshark capture', f.captureFilePath, attachedCaptureName(f)))}</li>${(f.attachments||[]).map((x,i)=>`<li>${esc(attachedExtraName(f,x,i))} (attached)</li>`).join('')}</ul></section>`).join(''); return `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;margin:40px;color:#20242b}h1{font-size:28px}h2{border-bottom:1px solid #bbb;padding-bottom:6px;margin-top:30px}.facts{background:#f3f4f6;padding:10px;line-height:1.8}.flight{page-break-before:always}table{border-collapse:collapse;width:100%}th,td{border:1px solid #bbb;padding:7px;text-align:left}th{background:#eee}p,li{line-height:1.5}.cover{page-break-after:always}</style></head><body><section class="cover"><h1>Drone Flight Test Report</h1><p><b>Overall Result:</b> ${esc(data.overallResult)}</p><div class="facts"><b>Test Objective Type:</b> ${esc(objectiveTypeText(cover))}<br><b>Location:</b> ${esc(cover.location||'N/A')}<br><b>Responsible:</b> ${esc(cover.operator||'N/A')}<br><b>Robotics &amp; Software:</b> ${esc(cover.observer||'N/A')}<br><b>UAV Category:</b> ${esc(cover.droneCategory||'N/A')}<br><b>Equipment:</b> ${esc(equipmentText(cover))}<br><b>Weather:</b> ${esc(cover.weather||'N/A')}</div><h3>Flight Summary</h3><table><thead><tr><th>Flight</th><th>Mission</th><th>Result</th><th>Duration</th></tr></thead><tbody>${summary}</tbody></table>${data.flights.some(f=>f.flightLogPath||f.captureFilePath||(f.attachments||[]).length)?'<p>The original flight logs and other evidence are in the <code>evidence/</code> folder of this ZIP package. Open those files to inspect the attachments.</p>':''}</section>${flights}<h2>Conclusion</h2><p>Overall test result: <b>${esc(data.overallResult)}</b>.</p>${data.conclusion?`<p>${esc(data.conclusion).replace(/\n/g,'<br>')}</p>`:''}</body></html>`; }
function generate() { const data=reportData(); $('reportPreview').innerHTML=buildReportHTML(data).replace(/^<!doctype html><html><head>[\s\S]*?<\/head><body>|<\/body><\/html>$/g,''); return data; }
async function selectFile(kind){
  const options = kind === 'log'
    ? { title: 'Select Flight Log', filters: [{ name: 'Flight Logs', extensions: ['ulg','ulog','bin','log','tlog','csv','txt','DAT'] }, { name: 'All Files', extensions: ['*'] }] }
    : { title: 'Select Wireshark Capture', filters: [{ name: 'Capture Files', extensions: ['pcap','pcapng','cap'] }, { name: 'All Files', extensions: ['*'] }] };
  const r = await window.api.selectFiles(options);
  if (r.canceled || !r.filePaths?.length) return;
  readFlight();
  const f = state.flights[state.activeFlight];
  if (!f) return;
  if (kind === 'log') f.flightLogPath = r.filePaths[0];
  else f.captureFilePath = r.filePaths[0];
  writeFlight();
  generate();
  $('voiceStatus').textContent = `${kind === 'log' ? 'Flight log' : 'Capture'} added: ${r.filePaths[0]}`;
}
async function addAttachments(){
  const r = await window.api.selectFiles({ title: 'Select Evidence / Attachments', multi: true, filters: [{ name: 'All Files', extensions: ['*'] }] });
  if (r.canceled || !r.filePaths?.length) return;
  readFlight();
  const f = state.flights[state.activeFlight];
  if (!f) return;
  f.attachments = [...new Set([...(f.attachments || []), ...r.filePaths])];
  writeFlight();
  generate();
  $('voiceStatus').textContent = `${r.filePaths.length} attachment(s) added.`;
}
async function openReport(){ const r=await window.api.openJSON(); if(r.canceled)return; if(r.error){alert(r.error);return;} loadReport(r.data); $('voiceStatus').textContent=`Opened ${r.filePath}`; }
sharedFields.forEach(id=>$(id).addEventListener('input',readFlight)); $('equipmentList').addEventListener('change',readFlight); flightFields.forEach(id=>$(id).addEventListener('input',readFlight)); $('flightResult').addEventListener('change',()=>{readFlight();renderFlights();}); $('flightModesList').addEventListener('change',readFlight); $('conclusion').addEventListener('input',readConclusion);
$('addFlightButton').addEventListener('click',addFlight); $('removeFlightButton').addEventListener('click',removeCurrentFlight); $('newReportButton').addEventListener('click',()=>{if(confirm('Start a new report? Unsaved data will be cleared.'))resetReport();}); $('openReportButton').addEventListener('click',openReport);
$('selectFlightLogButton').addEventListener('click',()=>selectFile('log')); $('selectCaptureButton').addEventListener('click',()=>selectFile('capture')); $('addAttachmentButton').addEventListener('click',addAttachments); $('generateReportButton').addEventListener('click',generate);
$('saveDataButton').addEventListener('click',async()=>{const d=reportData();const r=await window.api.saveJSON(d,`flight-test-report.json`);if(!r.canceled)$('voiceStatus').textContent=`Report saved to ${r.filePath}`;}); $('exportMarkdownButton').addEventListener('click',async()=>{const d=reportData();const r=await window.api.saveMarkdown(buildMarkdown(d),`flight-test-report.md`);if(!r.canceled)$('voiceStatus').textContent='Markdown report exported.';}); $('exportPdfButton').addEventListener('click',async()=>{const d=reportData();const r=await window.api.exportPDF(buildReportHTML(d),`flight-test-report.zip`,d);if(r.canceled)return; const extra=r.attachmentCount?` with ${r.attachmentCount} attached file(s)`:''; const miss=r.missing?.length?` ${r.missing.length} selected file(s) could not be copied.`: ''; $('voiceStatus').textContent=`Report saved to ${r.filePath}${extra}.${miss}`;});
resetReport();
