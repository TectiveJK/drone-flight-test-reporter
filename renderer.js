const flightForm = document.getElementById('flight-form');
const dateTime = document.getElementById('dateTime');
const flightId = document.getElementById('flightId');
const droneType = document.getElementById('droneType');
const batteryId = document.getElementById('batteryId');
const firmwareVersion = document.getElementById('firmwareVersion');
const missionPerformed = document.getElementById('missionPerformed');
const flightModes = document.getElementById('flightModes');
const telemetrySummary = document.getElementById('telemetrySummary');
const anomalies = document.getElementById('anomalies');
const jiraTickets = document.getElementById('jiraTickets');
const flightLogPathDisplay = document.getElementById('flightLogPathDisplay');
const captureFilePathDisplay = document.getElementById('captureFilePathDisplay');
const operatorNotes = document.getElementById('operatorNotes');
const attachmentList = document.getElementById('attachmentList');
const addAttachmentButton = document.getElementById('addAttachmentButton');
const selectFlightLogButton = document.getElementById('selectFlightLogButton');
const selectCaptureButton = document.getElementById('selectCaptureButton');
const reportPreview = document.getElementById('reportPreview');
const startVoiceButton = document.getElementById('startVoiceButton');
const stopVoiceButton = document.getElementById('stopVoiceButton');
const voiceStatus = document.getElementById('voiceStatus');
const generateReportButton = document.getElementById('generateReportButton');
const saveDataButton = document.getElementById('saveDataButton');
const exportMarkdownButton = document.getElementById('exportMarkdownButton');
const exportPdfButton = document.getElementById('exportPdfButton');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
let recognition = null;
let voiceActive = false;
let attachments = [];
let flightLogPath = '';
let captureFilePath = '';

function setDateTimeNow() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  dateTime.value = local.toISOString().slice(0, 16);
}

function sanitizeText(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

function normalizeTimeString(timeString, meridiem) {
  if (!timeString) return timeString;
  let [hours, minutes] = timeString.split(':').map((part) => parseInt(part, 10));
  if (meridiem) {
    const normalized = meridiem.toLowerCase();
    if (normalized === 'pm' && hours < 12) hours += 12;
    if (normalized === 'am' && hours === 12) hours = 0;
  }
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function extractTimelineEntries(text) {
  const lines = text.split(/\n+/).filter((line) => line.trim());
  const entries = [];

  lines.forEach((line) => {
    const cleaned = line.trim();
    const timeMatch = cleaned.match(/\b(?:at\s*)?(\d{1,2}:\d{2})(?:\s*(am|pm))?\b/i);
    let timestamp = null;
    let note = cleaned;

    if (timeMatch) {
      timestamp = normalizeTimeString(timeMatch[1], timeMatch[2]);
      note = cleaned.replace(timeMatch[0], '').trim();
      note = note.replace(/^[:\-–—]+/, '').trim();
    }

    if (!note) {
      note = cleaned;
    }

    entries.push({ timestamp, note });
  });

  return entries;
}

function buildAttachmentList(data) {
  if (!data.attachments?.length) {
    return '<p>No attachments included.</p>';
  }

  return `<ul>${data.attachments
    .map((attachment) => `<li>${sanitizeText(attachment)}</li>`)
    .join('')}</ul>`;
}

function buildFileReference(label, path) {
  if (!path) {
    return `<p>${label}: Not selected.</p>`;
  }
  return `<p><strong>${label}:</strong> ${sanitizeText(path)}</p>`;
}

function buildMarkdown(data) {
  const lines = [];
  lines.push(`# Flight Test ${data.flightId || 'Report'}`);
  lines.push(`**Mission:** ${data.missionPerformed || 'N/A'}`);
  lines.push(`**Result:** ${data.result}`);
  lines.push(`**Issue:** ${data.issue}`);
  lines.push('---');
  lines.push(`**Date / Time:** ${data.dateTime}`);
  lines.push(`**Drone / Aircraft:** ${data.droneType}`);
  lines.push(`**Battery ID:** ${data.batteryId}`);
  lines.push(`**Firmware Version:** ${data.firmwareVersion}`);
  lines.push('');
  lines.push('## Mission Summary');
  lines.push(data.missionPerformed || '');
  lines.push('');
  lines.push('## Flight Modes');
  lines.push(data.flightModes || '');
  lines.push('');
  lines.push('## Telemetry');
  lines.push(data.telemetrySummary || '');
  lines.push('');
  lines.push('## Anomalies & Bugs');
  lines.push(data.anomalies || '');
  lines.push('');
  lines.push('## Jira Links');
  lines.push(data.jiraTickets.length ? data.jiraTickets.map((ticket) => `- ${ticket}`).join('\n') : '- None');
  lines.push('');
  lines.push('## Flight Log & Capture');
  lines.push(`- Flight Log: ${data.flightLogPath || 'None'}`);
  lines.push(`- Wireshark Capture: ${data.captureFilePath || 'None'}`);
  lines.push('');
  lines.push('## Attachments');
  lines.push(data.attachments.length ? data.attachments.map((attachment) => `- ${attachment}`).join('\n') : '- None');
  lines.push('');
  lines.push('## Operator Notes');
  lines.push(data.operatorNotes || '');
  lines.push('');
  lines.push('## Structured Timeline');
  if (data.timeline.length) {
    data.timeline.forEach((entry) => {
      lines.push(`- ${entry.timestamp ? `${entry.timestamp} — ` : ''}${entry.note}`);
    });
  } else {
    lines.push('- No timeline entries available.');
  }

  return lines.join('\n');
}

function buildJiraLinks(data) {
  if (!data.jiraTickets?.length) {
    return '<p>No Jira links added.</p>';
  }

  const items = data.jiraTickets.map((ticket) => {
    const trimmed = ticket.trim();
    const href = trimmed.match(/^https?:\/\//i) ? trimmed : `https://your-jira-instance.com/browse/${encodeURIComponent(trimmed)}`;
    return `<li><a href="${sanitizeText(href)}" target="_blank">${sanitizeText(trimmed)}</a></li>`;
  });

  return `<ul>${items.join('')}</ul>`;
}

function generateReport() {
  const timelineEntries = extractTimelineEntries(operatorNotes.value.trim());
  const data = {
    flightId: flightId.value.trim(),
    dateTime: dateTime.value,
    droneType: droneType.value.trim(),
    batteryId: batteryId.value.trim(),
    firmwareVersion: firmwareVersion.value.trim(),
    missionPerformed: missionPerformed.value.trim(),
    flightModes: flightModes.value.trim(),
    telemetrySummary: telemetrySummary.value.trim(),
    anomalies: anomalies.value.trim(),
    jiraTickets: jiraTickets.value
      .split(/\s*,\s*/)
      .map((ticket) => ticket.trim())
      .filter(Boolean),
    flightLogPath,
    captureFilePath,
    attachments,
    operatorNotes: operatorNotes.value.trim(),
    timeline: timelineEntries,
    result: anomalies.value.trim() ? 'Partially Successful' : 'Successful',
    issue: anomalies.value.trim() || 'No major issues'
  };

  const html = buildReport(data);
  reportPreview.innerHTML = html;
  reportPreview.scrollIntoView({ behavior: 'smooth' });
  return { html, data };
}

function renderAttachmentList() {
  if (!attachments.length) {
    attachmentList.innerHTML = '<em>No attachments added.</em>';
    return;
  }

  attachmentList.innerHTML = attachments
    .map(
      (filePath, index) =>
        `<div class="attachment-item"><span>${sanitizeText(filePath)}</span><button type="button" class="remove-attachment" data-index="${index}">Remove</button></div>`
    )
    .join('');
}

async function addAttachments() {
  const result = await window.api.selectAttachments();
  if (result.canceled) {
    return;
  }

  attachments = [...new Set([...attachments, ...result.filePaths])];
  renderAttachmentList();
}

function deleteAttachment(event) {
  const target = event.target;
  if (!target.matches('.remove-attachment')) return;
  const index = Number(target.dataset.index);
  if (!Number.isFinite(index)) return;
  attachments.splice(index, 1);
  renderAttachmentList();
}

async function saveFlightData() {
  const { data } = generateReport();
  const result = await window.api.saveFlightData(data);
  if (!result.canceled) {
    voiceStatus.textContent = `Flight data saved to ${result.filePath}`;
  }
}

function buildReport(data) {
  const lines = [];
  lines.push(`<h1>Flight Test ${sanitizeText(data.flightId || 'Report')}</h1>`);
  lines.push(`<p><strong>Mission:</strong> ${sanitizeText(data.missionPerformed || 'N/A')}</p>`);
  lines.push(`<p><strong>Result:</strong> ${sanitizeText(data.result || 'Pending')}</p>`);
  lines.push(`<p><strong>Issue:</strong> ${sanitizeText(data.issue || 'None reported')}</p>`);
  lines.push('<hr>');
  lines.push(`<p><strong>Date / Time:</strong> ${sanitizeText(data.dateTime)}</p>`);
  lines.push(`<p><strong>Drone / Aircraft:</strong> ${sanitizeText(data.droneType)}</p>`);
  lines.push(`<p><strong>Battery ID:</strong> ${sanitizeText(data.batteryId)}</p>`);
  lines.push(`<p><strong>Firmware Version:</strong> ${sanitizeText(data.firmwareVersion)}</p>`);
  lines.push('<h2>Mission Summary</h2>');
  lines.push(`<p>${sanitizeText(data.missionPerformed)}</p>`);
  lines.push('<h2>Flight Modes</h2>');
  lines.push(`<p>${sanitizeText(data.flightModes)}</p>`);
  lines.push('<h2>Telemetry</h2>');
  lines.push(`<p>${sanitizeText(data.telemetrySummary)}</p>`);
  lines.push('<h2>Anomalies & Bugs</h2>');
  lines.push(`<p>${sanitizeText(data.anomalies)}</p>`);
  lines.push('<h2>Jira Links</h2>');
  lines.push(buildJiraLinks(data));
  lines.push('<h2>Attachments</h2>');
  lines.push(buildAttachmentList(data));
  lines.push('<h2>Operator Notes</h2>');
  lines.push(`<p>${sanitizeText(data.operatorNotes)}</p>`);
  lines.push('<h2>Structured Timeline</h2>');

  if (data.timeline.length) {
    lines.push('<ul>');
    data.timeline.forEach((entry) => {
      lines.push(`<li>${entry.timestamp ? `<strong>${sanitizeText(entry.timestamp)}</strong> — ` : ''}${sanitizeText(entry.note)}</li>`);
    });
    lines.push('</ul>');
  } else {
    lines.push('<p>No timeline entries available.</p>');
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Flight Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #222; }
    h1 { margin-bottom: 0.2em; }
    h2 { margin-top: 1.6em; }
    p { line-height: 1.6; }
    ul { padding-left: 1.2rem; }
    a { color: #1d4ed8; text-decoration: none; }
    a:hover { text-decoration: underline; }
    hr { margin: 1.8rem 0; border-color: #ccc; }
  </style>
</head>
<body>
  ${lines.join('\n')}
</body>
</html>`;
}

async function exportPDF() {
  const { html } = generateReport();
  const result = await window.api.exportPDF(html);
  if (!result.canceled) {
    voiceStatus.textContent = `PDF exported to ${result.filePath}`;
  }
}

async function exportMarkdown() {
  const { data } = generateReport();
  const markdown = buildMarkdown(data);
  const result = await window.api.saveMarkdown(markdown);
  if (!result.canceled) {
    voiceStatus.textContent = `Markdown exported to ${result.filePath}`;
  }
}

async function selectFlightLog() {
  const result = await window.api.selectFile({
    title: 'Select Flight Log File',
    filters: [{ name: 'Flight Logs', extensions: ['log', 'txt', 'bin', 'ulg'] }]
  });

  if (!result.canceled) return;
  flightLogPath = result.filePath;
  flightLogPathDisplay.textContent = flightLogPath;
}

async function selectCaptureFile() {
  const result = await window.api.selectFile({
    title: 'Select Wireshark Capture File',
    filters: [{ name: 'Capture Files', extensions: ['pcap', 'pcapng', 'cap'] }]
  });

  if (!result.canceled) return;
  captureFilePath = result.filePath;
  captureFilePathDisplay.textContent = captureFilePath;
}

function renderAttachmentList() {
  if (!attachments.length) {
    attachmentList.innerHTML = '<em>No attachments added.</em>';
    return;
  }

  attachmentList.innerHTML = attachments
    .map((filePath, index) => {
      const lower = filePath.toLowerCase();
      const isImage = ['.png', '.jpg', '.jpeg', '.gif'].some((ext) => lower.endsWith(ext));
      const thumbnail = isImage ? `<img class="attachment-thumb" src="file://${filePath}" alt="Attachment preview" />` : '';
      return `<div class="attachment-item"><div class="attachment-file">${thumbnail}<span>${sanitizeText(filePath)}</span></div><button type="button" class="remove-attachment" data-index="${index}">Remove</button></div>`;
    })
    .join('');
}

function addVoiceEvent(message) {
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  operatorNotes.value += `${timestamp} — ${message}\n`;
}

function startVoiceRecognition() {
  if (!SpeechRecognition) {
    voiceStatus.textContent = 'Voice transcription is not supported in this environment.';
    return;
  }

  if (voiceActive) return;

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    voiceActive = true;
    startVoiceButton.disabled = true;
    stopVoiceButton.disabled = false;
    voiceStatus.textContent = 'Listening... speak your post-flight notes.';
  };

  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    if (finalTranscript.trim()) {
      addVoiceEvent(finalTranscript.trim());
    }

    if (interimTranscript.trim()) {
      voiceStatus.textContent = `Listening... ${interimTranscript.trim()}`;
    }
  };

  recognition.onerror = (event) => {
    voiceStatus.textContent = `Voice recognition error: ${event.error}`;
    stopVoiceRecognition();
  };

  recognition.onend = () => {
    stopVoiceRecognition();
  };

  recognition.start();
}

function stopVoiceRecognition() {
  if (!recognition) return;
  recognition.stop();
  voiceActive = false;
  startVoiceButton.disabled = false;
  stopVoiceButton.disabled = true;
  voiceStatus.textContent = 'Voice transcription stopped.';
}

generateReportButton.addEventListener('click', (event) => {
  event.preventDefault();
  generateReport();
  voiceStatus.textContent = 'Report generated.';
});

saveDataButton.addEventListener('click', async (event) => {
  event.preventDefault();
  await saveFlightData();
});

exportPdfButton.addEventListener('click', async (event) => {
  event.preventDefault();
  await exportPDF();
});

exportMarkdownButton.addEventListener('click', async (event) => {
  event.preventDefault();
  await exportMarkdown();
});

selectFlightLogButton.addEventListener('click', async () => {
  await selectFlightLog();
});

selectCaptureButton.addEventListener('click', async () => {
  await selectCaptureFile();
});

addAttachmentButton.addEventListener('click', async () => {
  await addAttachments();
});

attachmentList.addEventListener('click', deleteAttachment);

startVoiceButton.addEventListener('click', () => {
  startVoiceRecognition();
});

stopVoiceButton.addEventListener('click', () => {
  stopVoiceRecognition();
});

renderAttachmentList();
setDateTimeNow();
