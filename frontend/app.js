// ─── Config ──────────────────────────────────────────────────
const API_BASE = '';  // Same origin — Flask serves both frontend & API

// ─── Shared state (store extraction results for the judge) ───
let storedCodeExtraction = null;
let storedPdfExtraction = null;
let storedTextFiles = [];  // { filename, content }

// ─── DOM refs ────────────────────────────────────────────────
const dropZone      = document.getElementById('dropZone');
const folderInput   = document.getElementById('folderInput');
const browseBtn     = document.getElementById('browseBtn');
const statsBar      = document.getElementById('statsBar');
const resultsGrid   = document.getElementById('resultsGrid');
const resetBtn      = document.getElementById('resetBtn');

const listDocs  = document.getElementById('listDocs');
const listCode  = document.getElementById('listCode');
const listText  = document.getElementById('listText');
const listOther = document.getElementById('listOther');

const badgeDocs = document.getElementById('badgeDocs');
const badgeCode = document.getElementById('badgeCode');
const badgeText = document.getElementById('badgeText');
const badgeOther = document.getElementById('badgeOther');

const emptyDocs = document.getElementById('emptyDocs');
const emptyCode = document.getElementById('emptyCode');
const emptyText = document.getElementById('emptyText');
const emptyOther = document.getElementById('emptyOther');

// ─── Helpers ─────────────────────────────────────────────────
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function fileIcon(ext) {
  const map = {
    pdf: '📕', pptx: '📊', ppt: '📊',
    txt: '📃', text: '📃', log: '📃',
    js: '🟨', ts: '🔷', py: '🐍', java: '☕', cpp: '⚙️', c: '⚙️', cs: '🔮',
    html: '🌐', css: '🎨', json: '📋', xml: '📋', yaml: '📋', yml: '📋',
    md: '📖', readme: '📖',
    png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', svg: '🖼️', webp: '🖼️',
    zip: '📦', gz: '📦', tar: '📦', rar: '📦',
  };
  return map[ext] || '📄';
}

// ─── Code-related extensions ─────────────────────────────────
const CODE_EXTENSIONS = new Set([
  // Languages
  'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs',
  'py', 'pyw', 'pyi',
  'java', 'kt', 'kts', 'scala',
  'c', 'h', 'cpp', 'hpp', 'cc', 'cxx',
  'cs', 'fs', 'fsx',
  'go', 'rs', 'rb', 'php', 'swift', 'dart', 'lua',
  'r', 'R', 'jl', 'm', 'mm',
  'sh', 'bash', 'zsh', 'ps1', 'bat', 'cmd',
  'sql',
  // Web / markup
  'html', 'htm', 'css', 'scss', 'sass', 'less',
  'vue', 'svelte', 'astro',
  // Config / data
  'json', 'yaml', 'yml', 'toml', 'xml', 'ini', 'cfg', 'env',
  'dockerfile', 'makefile', 'cmake',
  // Docs often found in repos
  'md', 'mdx', 'rst',
  // Build / project
  'gradle', 'sbt', 'gemspec', 'lock',
  'gitignore', 'gitattributes', 'editorconfig',
  'eslintrc', 'prettierrc', 'babelrc',
]);

// ─── Categorise ──────────────────────────────────────────────
function categoriseFiles(fileList) {
  const docs   = [];   // PDF, PPTX
  const code   = [];   // Code-related files
  const texts  = [];   // .txt
  const other  = [];   // everything else

  for (const file of fileList) {
    const path  = file.webkitRelativePath || file.name;
    const ext   = file.name.split('.').pop().toLowerCase();
    const name  = file.name.toLowerCase();

    // 1. PDF / PPTX → Documents
    if (['pdf', 'pptx', 'ppt', 'mp4', 'mov', 'webm'].includes(ext)) {
      docs.push({ file, path, ext });
      continue;
    }

    // 2. Plain text → speech section only if named speech/pitch/transcript; otherwise treat as code
    if (ext === 'txt') {
      const baseName = name.replace(/\.txt$/, '');
      const isSpeech = ['speech', 'pitch', 'transcript', 'script', 'notes'].includes(baseName);
      if (isSpeech) {
        texts.push({ file, path, ext });
      } else {
        code.push({ file, path, ext });
      }
      continue;
    }

    // 3. Code-related files → Code section
    const isCode = CODE_EXTENSIONS.has(ext)
      || ['makefile', 'dockerfile', 'rakefile', 'gemfile', 'procfile', 'vagrantfile', 'readme', 'license', 'changelog']
           .includes(name);
    if (isCode) {
      code.push({ file, path, ext });
      continue;
    }

    // 4. Everything else
    other.push({ file, path, ext });
  }

  return { docs, code, texts, other };
}

// ─── Send code files to backend ──────────────────────────────
async function sendCodeToBackend(codeFiles) {
  const extractPanel = document.getElementById('extractPanel');
  const extractStatus = document.getElementById('extractStatus');
  const extractResult = document.getElementById('extractResult');
  const extractContent = document.getElementById('extractContent');
  const extractError = document.getElementById('extractError');
  const extractFileCount = document.getElementById('extractFileCount');
  const extractRepoName = document.getElementById('extractRepoName');
  const extractTotalSize = document.getElementById('extractTotalSize');

  // Show the extraction panel
  extractPanel.classList.remove('hidden');
  extractStatus.classList.remove('hidden');
  extractResult.classList.add('hidden');
  extractError.classList.add('hidden');

  if (codeFiles.length === 0) {
    extractStatus.classList.add('hidden');
    extractError.classList.remove('hidden');
    extractError.textContent = 'No code files to extract.';
    return;
  }

  // Build FormData with all code files
  const formData = new FormData();

  // Derive repo name from first file's path
  const firstPath = codeFiles[0].path;
  const repoName = firstPath.includes('/') ? firstPath.split('/')[0] : 'uploaded_project';
  formData.append('repo_name', repoName);

  for (const item of codeFiles) {
    formData.append('files[]', item.file, item.path);
  }

  try {
    const response = await fetch(`${API_BASE}/api/extract`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Hide loading, show results
    extractStatus.classList.add('hidden');
    extractResult.classList.remove('hidden');

    // Update summary stats
    extractRepoName.textContent = data.repo_name;
    extractFileCount.textContent = data.total_files;
    const totalSize = data.files.reduce((sum, f) => sum + f.size, 0);
    extractTotalSize.textContent = formatSize(totalSize);

    // Render the JSON
    extractContent.textContent = JSON.stringify(data, null, 2);

    // Store for judge
    storedCodeExtraction = data;

  } catch (error) {
    extractStatus.classList.add('hidden');
    extractError.classList.remove('hidden');
    extractError.textContent = `Failed to extract: ${error.message}`;
    console.error('Backend extraction error:', error);
  }
}

// ─── Send text files to backend ──────────────────────────────
async function sendTextToBackend(textFiles) {
  if (!textFiles || textFiles.length === 0) return;

  const formData = new FormData();
  for (const t of textFiles) {
    formData.append('files[]', t.file, t.file.name);
  }

  try {
    const res = await fetch(`${API_BASE}/api/extract-text`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    storedTextFiles = data.text_files || [];
  } catch (e) {
    console.error('Text extraction error:', e);
    storedTextFiles = [];
  }
}

// ─── Send PDF/doc files to backend ───────────────────────────
async function sendDocsToBackend(docFiles) {
  const pdfPanel = document.getElementById('pdfPanel');
  const pdfStatus = document.getElementById('pdfStatus');
  const pdfResult = document.getElementById('pdfResult');
  const pdfError = document.getElementById('pdfError');
  const pdfSlides = document.getElementById('pdfSlides');
  const pdfFilename = document.getElementById('pdfFilename');
  const pdfSlideCount = document.getElementById('pdfSlideCount');
  const pdfFileSize = document.getElementById('pdfFileSize');
  const pdfAuthor = document.getElementById('pdfAuthor');
  const pdfJsonContent = document.getElementById('pdfJsonContent');

  const pdfFiles = docFiles.filter(d => ['pdf', 'pptx', 'ppt'].includes(d.ext));
  const videoFiles = docFiles.filter(d => ['mp4', 'mov', 'webm'].includes(d.ext));

  if (pdfFiles.length === 0 && videoFiles.length === 0) return;

  pdfPanel.classList.remove('hidden');
  pdfStatus.classList.remove('hidden');
  pdfResult.classList.add('hidden');
  pdfError.classList.add('hidden');
  pdfSlides.innerHTML = '';
  
  if (pdfFiles.length > 0 && videoFiles.length > 0) {
      pdfStatus.querySelector('span').textContent = 'Extracting Slides & Video Demo Frames concurrently...';
  } else if (videoFiles.length > 0) {
      pdfStatus.querySelector('span').textContent = 'Extracting Video Demo Keyframes...';
  } else {
      pdfStatus.querySelector('span').textContent = 'Extracting slides...';
  }

  let finalData = null;
  let hasError = false;

  try {
      const promises = [];
      let pdfData = null;
      let videoData = null;

      if (pdfFiles.length > 0) {
          const formData = new FormData();
          formData.append('file', pdfFiles[0].file, pdfFiles[0].file.name);
          promises.push(fetch(`${API_BASE}/api/extract-pdf`, { method: 'POST', body: formData })
          .then(res => res.json().then(data => ({ ok: res.ok, status: res.status, data })))
          .then(res => {
              if (!res.ok) throw new Error(res.data.error || 'PDF extraction failed');
              pdfData = res.data;
          }));
      }

      if (videoFiles.length > 0) {
          const videoDataForm = new FormData();
          videoDataForm.append('file', videoFiles[0].file, videoFiles[0].file.name);
          promises.push(fetch(`${API_BASE}/api/extract-video`, { method: 'POST', body: videoDataForm })
          .then(res => res.json().then(data => ({ ok: res.ok, status: res.status, data })))
          .then(res => {
              if (!res.ok) throw new Error(res.data.error || 'Video extraction failed');
              videoData = res.data;
          }));
      }

      await Promise.all(promises);

      if (pdfData && videoData) {
          const slideOffset = pdfData.slides.length;
          videoData.slides.forEach(s => s.slide += slideOffset);
          
          finalData = {
              ...pdfData,
              filename: pdfData.filename + " & " + videoData.filename,
              file_size: pdfData.file_size + videoData.file_size,
              total_slides: pdfData.total_slides + videoData.total_slides,
              slides: [...pdfData.slides, ...videoData.slides]
          };
      } else {
          finalData = pdfData || videoData;
      }

  } catch (err) {
      hasError = true;
      pdfStatus.classList.add('hidden');
      pdfError.classList.remove('hidden');
      pdfError.textContent = `Failed to extract: ${err.message}`;
      console.error('Extraction error:', err);
  }

  if (hasError || !finalData) return;

  pdfStatus.classList.add('hidden');
  pdfResult.classList.remove('hidden');

  pdfFilename.textContent = finalData.filename;
  pdfSlideCount.textContent = finalData.total_slides;
  pdfFileSize.textContent = formatSize(finalData.file_size);
  pdfAuthor.textContent = finalData.metadata?.author || '—';

  const jsonForDisplay = {
    ...finalData,
    slides: finalData.slides.map(s => { const copy = { ...s }; delete copy.thumbnail_b64; return copy; })
  };
  pdfJsonContent.textContent = JSON.stringify(jsonForDisplay, null, 2);

  storedPdfExtraction = finalData;

  finalData.slides.forEach((slide, i) => {
    const card = document.createElement('div');
    card.className = 'pdf-slide-card';
    card.style.animationDelay = `${i * 60}ms`;

    let thumbnailHTML = '';
    if (slide.thumbnail_b64) {
      thumbnailHTML = `<img class="pdf-slide-thumb" src="data:image/png;base64,${slide.thumbnail_b64}" alt="Slide ${slide.slide}" />`;
    } else {
      thumbnailHTML = `<div class="pdf-slide-thumb-placeholder">Slide ${slide.slide}</div>`;
    }

    const textPreview = slide.text_content
      ? slide.text_content.substring(0, 200).replace(/\n/g, ' ')
      : '(no text)';

    let metaRow = '';
    const sourceChip = slide.source_file
      ? `<span class="pdf-slide-meta-chip" title="${escapeHTML(slide.source_file)}">📁 ${escapeHTML(slide.source_file)}</span>`
      : '';
    if (slide.timestamp_sec !== undefined) {
        metaRow = `
        <div class="pdf-slide-meta-row">
          <span class="pdf-slide-meta-chip">🎬 ${slide.timestamp_sec}s</span>
          ${sourceChip}
        </div>
      `;
    } else if (slide.dimensions) {
      const dimStr = `${slide.dimensions.width_in || 0}″ × ${slide.dimensions.height_in || 0}″`;
      metaRow = `
        <div class="pdf-slide-meta-row">
          ${sourceChip}
          <span class="pdf-slide-meta-chip">📐 ${dimStr}</span>
          <span class="pdf-slide-meta-chip">🖼️ ${slide.image_count || 0} img</span>
        </div>
      `;
    } else if (sourceChip) {
      metaRow = `<div class="pdf-slide-meta-row">${sourceChip}</div>`;
    }

    card.innerHTML = `
      <div class="pdf-slide-visual">
        ${thumbnailHTML}
        <span class="pdf-slide-num">Slide ${slide.slide}</span>
      </div>
      <div class="pdf-slide-details">
        ${metaRow}
        <div class="pdf-slide-text-preview">${escapeHTML(textPreview)}${slide.text_content && slide.text_content.length > 200 ? '…' : ''}</div>
      </div>
    `;

    pdfSlides.appendChild(card);
  });
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ─── Render ──────────────────────────────────────────────────
async function render({ docs, code, texts, other }) {
  // Clear
  listDocs.innerHTML = '';
  listCode.innerHTML = '';
  listText.innerHTML = '';
  listOther.innerHTML = '';

  // Helper to build a file list item
  function makeItem(info, cssClass) {
    const li = document.createElement('li');
    li.className = `file-item file-item-${cssClass}`;
    li.innerHTML = `
      <div class="file-item-icon">${fileIcon(info.ext)}</div>
      <div class="file-item-info">
        <div class="file-item-name">${info.file.name}</div>
        <div class="file-item-path">${info.path}</div>
      </div>
      <div class="file-item-size">${formatSize(info.file.size)}</div>`;
    return li;
  }

  // Documents
  docs.forEach((d, i) => {
    const el = makeItem(d, 'docs');
    el.style.animationDelay = `${i * 40}ms`;
    listDocs.appendChild(el);
  });

  // Code
  code.forEach((c, i) => {
    const el = makeItem(c, 'code');
    el.style.animationDelay = `${i * 40}ms`;
    listCode.appendChild(el);
  });

  // Text files
  texts.forEach((t, i) => {
    const el = makeItem(t, 'text');
    el.style.animationDelay = `${i * 40}ms`;
    listText.appendChild(el);
  });

  // Other
  other.forEach((o, i) => {
    const el = makeItem(o, 'other');
    el.style.animationDelay = `${i * 40}ms`;
    listOther.appendChild(el);
  });

  const total = docs.length + code.length + texts.length + other.length;

  // Stats
  document.querySelector('#statTotal .stat-value').textContent = total;
  document.querySelector('#statDocs  .stat-value').textContent = docs.length;
  document.querySelector('#statCode  .stat-value').textContent = code.length;
  document.querySelector('#statText  .stat-value').textContent = texts.length;
  document.querySelector('#statOther .stat-value').textContent = other.length;

  badgeDocs.textContent  = docs.length;
  badgeCode.textContent  = code.length;
  badgeText.textContent  = texts.length;
  badgeOther.textContent = other.length;

  // Empty states
  emptyDocs.classList.toggle('show', docs.length === 0);
  emptyCode.classList.toggle('show', code.length === 0);
  emptyText.classList.toggle('show', texts.length === 0);
  emptyOther.classList.toggle('show', other.length === 0);

  // Show sections
  statsBar.classList.remove('hidden');
  resultsGrid.classList.remove('hidden');
  resetBtn.classList.remove('hidden');

  // ── Send files to backend for extraction ───────────────────
  sendCodeToBackend(code);
  sendDocsToBackend(docs);

  // ── Send text files to backend for reading ────────────────
  storedTextFiles = [];
  await sendTextToBackend(texts);

  // ── Show judge section ────────────────────────────────────
  const judgeSection = document.getElementById('judgeSection');
  if (judgeSection) judgeSection.classList.remove('hidden');
}

// ─── Event Handlers ──────────────────────────────────────────
// Drag & Drop
dropZone.addEventListener('dragenter', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', e => {
  // Only remove if we actually left the drop zone
  if (!dropZone.contains(e.relatedTarget)) dropZone.classList.remove('drag-over');
});
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  handleDrop(e);
});

// Browse button
browseBtn.addEventListener('click', e => { e.stopPropagation(); folderInput.click(); });
dropZone.addEventListener('click', () => folderInput.click());
folderInput.addEventListener('change', () => {
  if (folderInput.files.length) processFiles(folderInput.files);
});

// Reset
resetBtn.addEventListener('click', () => {
  statsBar.classList.add('hidden');
  resultsGrid.classList.add('hidden');
  resetBtn.classList.add('hidden');
  folderInput.value = '';

  // Hide extraction panels too
  const extractPanel = document.getElementById('extractPanel');
  if (extractPanel) extractPanel.classList.add('hidden');
  const pdfPanel = document.getElementById('pdfPanel');
  if (pdfPanel) pdfPanel.classList.add('hidden');
  const judgeSection = document.getElementById('judgeSection');
  if (judgeSection) judgeSection.classList.add('hidden');

  // Clear stored data
  storedCodeExtraction = null;
  storedPdfExtraction = null;
  storedTextFiles = [];
});

// Toggle JSON viewer
document.addEventListener('click', (e) => {
  // Code extraction JSON
  if (e.target.closest('#toggleJson')) {
    const content = document.getElementById('extractContent');
    const btn = document.getElementById('toggleJson');
    content.classList.toggle('collapsed');
    btn.textContent = content.classList.contains('collapsed') ? 'Show JSON ▼' : 'Hide JSON ▲';
  }
  if (e.target.closest('#copyJson')) {
    const content = document.getElementById('extractContent');
    navigator.clipboard.writeText(content.textContent).then(() => {
      const btn = document.getElementById('copyJson');
      const original = btn.textContent;
      btn.textContent = '✓ Copied!';
      setTimeout(() => btn.textContent = original, 2000);
    });
  }

  // PDF extraction JSON
  if (e.target.closest('#togglePdfJson')) {
    const viewer = document.getElementById('pdfJsonViewer');
    const btn = document.getElementById('togglePdfJson');
    viewer.classList.toggle('collapsed');
    btn.textContent = viewer.classList.contains('collapsed') ? 'Show Raw JSON ▼' : 'Hide Raw JSON ▲';
  }
  if (e.target.closest('#copyPdfJson')) {
    const content = document.getElementById('pdfJsonContent');
    navigator.clipboard.writeText(content.textContent).then(() => {
      const btn = document.getElementById('copyPdfJson');
      const original = btn.textContent;
      btn.textContent = '✓ Copied!';
      setTimeout(() => btn.textContent = original, 2000);
    });
  }

  // Verdict JSON
  if (e.target.closest('#toggleVerdictJson')) {
    const viewer = document.getElementById('verdictJsonViewer');
    const btn = document.getElementById('toggleVerdictJson');
    viewer.classList.toggle('collapsed');
    btn.textContent = viewer.classList.contains('collapsed') ? 'Show Full JSON ▼' : 'Hide Full JSON ▲';
  }
  if (e.target.closest('#copyVerdictJson')) {
    const content = document.getElementById('verdictJsonContent');
    navigator.clipboard.writeText(content.textContent).then(() => {
      const btn = document.getElementById('copyVerdictJson');
      const original = btn.textContent;
      btn.textContent = '✓ Copied!';
      setTimeout(() => btn.textContent = original, 2000);
    });
  }
});

// ─── Process ─────────────────────────────────────────────────
async function handleDrop(e) {
  const items = e.dataTransfer.items;
  if (!items) return;

  // Try to read as directories using the File System Access API
  const allFiles = [];

  const readEntry = (entry) => {
    return new Promise(resolve => {
      if (entry.isFile) {
        entry.file(file => {
          // Reconstruct relative path
          Object.defineProperty(file, 'webkitRelativePath', {
            value: entry.fullPath.replace(/^\//, ''),
            writable: false
          });
          allFiles.push(file);
          resolve();
        });
      } else if (entry.isDirectory) {
        const reader = entry.createReader();
        const readAll = () => {
          reader.readEntries(async entries => {
            if (entries.length === 0) { resolve(); return; }
            await Promise.all(entries.map(readEntry));
            readAll(); // keep reading; readEntries returns in batches
          });
        };
        readAll();
      }
    });
  };

  const entries = [];
  for (let i = 0; i < items.length; i++) {
    const entry = items[i].webkitGetAsEntry?.();
    if (entry) entries.push(entry);
  }

  await Promise.all(entries.map(readEntry));
  if (allFiles.length) {
    const data = categoriseFiles(allFiles);
    await render(data);
  }
}

async function processFiles(fileList) {
  const data = categoriseFiles(fileList);
  await render(data);
}

// --- Judge Button (Streaming) ---
// replacement for judge button handler - will be injected into app.js
document.getElementById('judgeBtn')?.addEventListener('click', async () => {
  const judgeBtn = document.getElementById('judgeBtn');
  const judgeProgress = document.getElementById('judgeProgress');
  const judgeProgressMsg = document.getElementById('judgeProgressMsg');
  const judgeError = document.getElementById('judgeError');
  const judgeVerdict = document.getElementById('judgeVerdict');

  judgeBtn.disabled = true;
  judgeBtn.textContent = '\u23f3 Judging\u2026';
  judgeProgress.classList.remove('hidden');
  judgeError.classList.add('hidden');

  // Show verdict panel early for live reasoning
  judgeVerdict.classList.remove('hidden');
  document.getElementById('verdictScores').innerHTML = '';
  document.getElementById('verdictStrengths').innerHTML = '';
  document.getElementById('verdictImprovements').innerHTML = '';
  document.getElementById('verdictJustification').textContent = '';
  document.getElementById('verdictProjectName').textContent = 'Analyzing\u2026';
  document.getElementById('verdictScoreNum').textContent = '\u2014';
  document.getElementById('verdictJsonContent').textContent = '';

  // Show reasoning section for live streaming
  const reasoningSection = document.getElementById('verdictReasoningSection');
  reasoningSection.classList.remove('hidden');

  const verdictReasoningEl = document.getElementById('verdictReasoning');
  const slidesReasoningEl = document.getElementById('slidesReasoning');
  const codeReasoningEl = document.getElementById('codeReasoning');
  const textReasoningEl = document.getElementById('textReasoning');
  verdictReasoningEl.textContent = '';
  slidesReasoningEl.textContent = '';
  codeReasoningEl.textContent = '';
  if (textReasoningEl) textReasoningEl.textContent = '';

  document.getElementById('slidesReasoningDetails').style.display = storedPdfExtraction ? '' : 'none';
  document.getElementById('codeReasoningDetails').style.display = storedCodeExtraction ? '' : 'none';
  document.getElementById('textReasoningDetails').style.display = storedTextFiles && storedTextFiles.length > 0 ? '' : 'none';

  try {
    const body = {
      pdf_extraction: storedPdfExtraction || null,
      code_extraction: storedCodeExtraction || null,
      text_files: storedTextFiles || [],
    };

    const response = await fetch(`${API_BASE}/api/judge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalResult = null;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const event = JSON.parse(line.slice(6));

          if (event.type === 'stage') {
            judgeProgressMsg.textContent = event.message;
            if (event.stage === 'code') {
              document.getElementById('codeReasoningDetails').open = true;
            } else if (event.stage === 'text') {
              document.getElementById('textReasoningDetails').open = true;
            } else if (event.stage === 'judge') {
              document.getElementById('slidesReasoningDetails').open = false;
              document.getElementById('codeReasoningDetails').open = false;
              document.getElementById('textReasoningDetails').open = false;
            } else if (event.stage.startsWith('slide_')) {
              document.getElementById('slidesReasoningDetails').open = true;
            }

          } else if (event.type === 'token') {
            const targetEl = getReasoningTarget(event.stage);
            if (targetEl) {
              targetEl.textContent += event.text;
              targetEl.scrollTop = targetEl.scrollHeight;
            }

          } else if (event.type === 'reasoning_token') {
            // Live reasoning from the judge model's thinking process
            const reasoningEl = document.getElementById('verdictReasoning');
            if (reasoningEl) {
              reasoningEl.textContent += event.text;
              reasoningEl.scrollTop = reasoningEl.scrollHeight;
            }

          } else if (event.type === 'result') {
            finalResult = event.data;

          } else if (event.type === 'error') {
            throw new Error(event.message);
          }

        } catch (parseErr) {
          if (parseErr.message && !parseErr.message.includes('JSON')) throw parseErr;
        }
      }
    }

    if (!finalResult) throw new Error('No result received from judge.');

    judgeProgress.classList.add('hidden');
    renderVerdict(finalResult);

  } catch (error) {
    judgeProgress.classList.add('hidden');
    judgeError.classList.remove('hidden');
    judgeError.textContent = `Judge failed: ${error.message}`;
    console.error('Judge error:', error);
  } finally {
    judgeBtn.disabled = false;
    judgeBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      Run AI Judge`;
  }
});

function getReasoningTarget(stage) {
  // Judge reasoning is now handled via 'reasoning_token' events, not 'token' events.
  // 'token' events for judge stage contain JSON output, not reasoning.
  if (stage === 'judge') return null;
  if (stage === 'code') return document.getElementById('codeReasoning');
  if (stage === 'text') return document.getElementById('textReasoning');
  if (stage.startsWith('slide_')) return document.getElementById('slidesReasoning');
  return null;
}

// ─── Render Verdict ──────────────────────────────────────────
function renderVerdict(result) {
  const verdictEl = document.getElementById('judgeVerdict');
  verdictEl.classList.remove('hidden');

  // The verdict may be { reasoning, parsed } or just a flat dict
  const verdictWrapper = result.verdict || {};
  const verdict = verdictWrapper.parsed || verdictWrapper;
  const verdictReasoning = verdictWrapper.reasoning || '';

  const scores = verdict.scores || {};
  const feedback = verdict.feedback || {};

  // Project name
  document.getElementById('verdictProjectName').textContent =
    verdict.project_name || 'Project Verdict';

  // Final score
  const finalScore = typeof verdict.final_weighted_score === 'number'
    ? verdict.final_weighted_score.toFixed(2)
    : '—';
  document.getElementById('verdictScoreNum').textContent = finalScore;

  // Color the score circle based on value
  const scoreCircle = document.getElementById('verdictScoreCircle');
  const numScore = parseFloat(finalScore);
  if (numScore >= 4) scoreCircle.style.borderColor = '#34d399';
  else if (numScore >= 3) scoreCircle.style.borderColor = '#fbbf24';
  else if (numScore >= 1) scoreCircle.style.borderColor = '#f87171';
  else scoreCircle.style.borderColor = '#6b7280';

  // Score bars
  const scoreCategories = [
    { key: 'innovation_creativity', label: 'Innovation & Creativity', weight: '20%' },
    { key: 'technical_depth', label: 'Technical Depth', weight: '15%' },
    { key: 'impact_usefulness', label: 'Impact & Usefulness', weight: '20%' },
    { key: 'presentation_demo', label: 'Presentation & Demo', weight: '25%' },
    { key: 'feasibility_sustainability', label: 'Feasibility & Sustainability', weight: '20%' },
  ];

  const scoresContainer = document.getElementById('verdictScores');
  scoresContainer.innerHTML = '';
  for (const cat of scoreCategories) {
    const val = scores[cat.key] ?? 0;
    const pct = (val / 5) * 100;
    const colorClass = val >= 5 ? 'score-5' : val >= 3 ? 'score-3' : val >= 1 ? 'score-1' : 'score-0';

    const row = document.createElement('div');
    row.className = `verdict-score-row ${colorClass}`;
    row.innerHTML = `
      <span class="verdict-score-name">${cat.label} <span style="color:var(--text-dim);font-size:.65rem">(${cat.weight})</span></span>
      <div class="verdict-score-bar-bg">
        <div class="verdict-score-bar-fill" style="width:0%"></div>
      </div>
      <span class="verdict-score-val">${val}</span>
    `;
    scoresContainer.appendChild(row);

    // Animate the bar fill
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        row.querySelector('.verdict-score-bar-fill').style.width = `${pct}%`;
      });
    });
  }

  // Strengths
  const strengthsList = document.getElementById('verdictStrengths');
  strengthsList.innerHTML = '';
  (feedback.strengths || []).forEach(s => {
    const li = document.createElement('li');
    li.textContent = s;
    strengthsList.appendChild(li);
  });

  // Improvements
  const improvementsList = document.getElementById('verdictImprovements');
  improvementsList.innerHTML = '';
  (feedback.areas_for_improvement || []).forEach(s => {
    const li = document.createElement('li');
    li.textContent = s;
    improvementsList.appendChild(li);
  });

  // Justification
  document.getElementById('verdictJustification').textContent =
    feedback.justification || '';

  // ── Reasoning section ──────────────────────────────────────
  const reasoningSection = document.getElementById('verdictReasoningSection');
  const hasAnyReasoning = verdictReasoning ||
    result.slides_report?.reasoning ||
    result.code_report?.reasoning ||
    result.text_analysis?.reasoning;

  if (hasAnyReasoning) {
    reasoningSection.classList.remove('hidden');

    // Judge reasoning
    document.getElementById('verdictReasoning').textContent =
      verdictReasoning || '(No reasoning captured from judge model)';

    // Slides reasoning
    const slidesReasoningEl = document.getElementById('slidesReasoning');
    const slidesDetails = document.getElementById('slidesReasoningDetails');
    const slidesReport = result.slides_report || {};
    let slidesReasoningText = slidesReport.reasoning || '';

    // Also gather per-slide reasoning
    if (slidesReport.slide_analyses) {
      const perSlide = slidesReport.slide_analyses
        .filter(s => s.analysis?.reasoning)
        .map(s => `Slide ${s.slide}: ${s.analysis.reasoning}`)
        .join('\n\n');
      if (perSlide) {
        slidesReasoningText = (slidesReasoningText ? slidesReasoningText + '\n\n' : '') + perSlide;
      }
    }

    if (slidesReasoningText) {
      slidesReasoningEl.textContent = slidesReasoningText;
      slidesDetails.style.display = '';
    } else {
      slidesDetails.style.display = 'none';
    }

    // Code reasoning
    const codeReasoningEl = document.getElementById('codeReasoning');
    const codeDetails = document.getElementById('codeReasoningDetails');
    const codeReasoning = result.code_report?.reasoning || '';
    if (codeReasoning) {
      codeReasoningEl.textContent = codeReasoning;
      codeDetails.style.display = '';
    } else {
      codeDetails.style.display = 'none';
    }

    // Text reasoning
    const textReasoningEl = document.getElementById('textReasoning');
    const textDetails = document.getElementById('textReasoningDetails');
    const textReasoning = result.text_analysis?.reasoning || '';
    if (textReasoning) {
      textReasoningEl.textContent = textReasoning;
      textDetails.style.display = '';
    } else {
      textDetails.style.display = 'none';
    }
  } else {
    reasoningSection.classList.add('hidden');
  }

  // Full JSON
  document.getElementById('verdictJsonContent').textContent =
    JSON.stringify(result, null, 2);
}
