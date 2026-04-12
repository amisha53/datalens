/**
 * DataLens — CSV Analytics Dashboard
 * Author: Tarunima Amisha
 * Course: CS 433 — Data Analytics, SEMO 2024
 *
 * Parses CSV files, generates Chart.js visualizations,
 * computes summary statistics, and produces AI narrative insights.
 *
 * Dependencies: Chart.js, PapaParse (loaded via CDN in index.html)
 */

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-5';

// TODO: add export to PNG later
const SAMPLES = {
  sales: `Month,Revenue,Orders,Region,Growth\nJan,42000,312,North,2.1\nFeb,38500,287,South,-1.2\nMar,51200,401,East,12.5\nApr,47800,365,West,-6.7\nMay,53400,412,North,11.7\nJun,61200,489,South,14.6\nJul,58900,462,East,-3.7\nAug,64300,501,West,9.2\nSep,59800,471,North,-7.0\nOct,72100,558,South,20.6\nNov,81400,632,East,12.9\nDec,93200,721,West,14.5`,
  students: `Student,GPA,Attendance,Major,Year\nAmisha,3.88,96,CS,Senior\nJordan,3.21,88,Math,Junior\nRiley,2.95,79,Biology,Sophomore\nCasey,3.75,94,CS,Senior\nMorgan,3.41,91,Physics,Junior\nAlex,2.78,72,History,Freshman\nSam,3.92,98,CS,Senior\nTaylor,3.15,85,Chemistry,Junior\nJamie,3.55,90,Math,Senior\nAvery,2.61,68,Biology,Sophomore\nBlair,3.88,97,CS,Junior\nRowan,3.02,81,Physics,Freshman\nSage,3.67,93,Math,Senior\nQuinn,2.89,76,History,Junior\nPeyton,3.44,88,CS,Sophomore\nDrew,3.11,83,Biology,Freshman\nReese,3.79,95,CS,Senior\nHarper,2.95,77,Chemistry,Junior\nFinley,3.33,87,Math,Senior\nLogan,3.58,91,CS,Junior`,
  jobs: `Role,Salary,Experience,Company,Remote\nSoftware Engineer,115000,3,Google,Yes\nData Analyst,82000,2,Meta,Hybrid\nDevOps Engineer,128000,5,Amazon,No\nProduct Manager,135000,7,Apple,Hybrid\nML Engineer,145000,4,OpenAI,Yes\nFrontend Dev,98000,2,Stripe,Yes\nBackend Dev,112000,4,Shopify,Hybrid\nSecurity Analyst,95000,3,Microsoft,No\nData Scientist,122000,5,Netflix,Yes\nSystems Admin,78000,6,IBM,No\nCloud Architect,155000,8,AWS,Yes\nUI Designer,88000,3,Figma,Hybrid\nQA Engineer,85000,4,Adobe,No\nTech Lead,168000,10,Uber,Hybrid\nJr Developer,72000,1,Startup,Yes`
};

let currentData = null, chartInstances = [];

function onDrag(e, over) { e.preventDefault(); document.getElementById('dropZone').classList.toggle('drag-over', over); }
function onDrop(e) { e.preventDefault(); document.getElementById('dropZone').classList.remove('drag-over'); handleFile(e.dataTransfer.files[0]); }

function handleFile(f) {
  if (!f || !f.name.endsWith('.csv')) return;
  const r = new FileReader();
  r.onload = e => processCSV(e.target.result, f.name.replace('.csv', ''));
  r.readAsText(f);
}

function loadSample(k) {
  processCSV(SAMPLES[k], { sales: 'Monthly Sales', students: 'Student Grades', jobs: 'Tech Job Market' }[k]);
}

function processCSV(csv, name) {
  const parsed = Papa.parse(csv, { header: true, dynamicTyping: true, skipEmptyLines: true });
  currentData = { rows: parsed.data, cols: parsed.meta.fields, name };
  buildDashboard();
}

function buildDashboard() {
  const { rows, cols, name } = currentData;
  document.getElementById('dashboard').style.display = 'block';
  document.getElementById('dropZone').closest('.upload-area').style.display = 'none';
  document.querySelector('.samples-area').style.display = 'none';
  document.querySelector('.hero').style.paddingBottom = '2rem';

  const numCols = cols.filter(c => rows.some(r => typeof r[c] === 'number'));
  const missing = rows.reduce((a, r) => a + cols.filter(c => r[c] === null || r[c] === '' || r[c] === undefined).length, 0);

  document.getElementById('dashName').textContent = name;
  document.getElementById('dashMeta').textContent = `${rows.length} rows · ${cols.length} columns · uploaded just now`;
  document.getElementById('kpiRows').textContent = rows.length;
  document.getElementById('kpiCols').textContent = cols.length;
  document.getElementById('kpiNum').textContent = numCols.length;
  document.getElementById('kpiMiss').textContent = missing;
  document.getElementById('previewNote').textContent = `showing first ${Math.min(8, rows.length)} of ${rows.length} rows`;

  chartInstances.forEach(c => c.destroy());
  chartInstances = [];
  buildCharts(rows, cols, numCols);
  buildTable(rows, cols);
  document.getElementById('aiIdle').style.display = 'block';
  document.getElementById('aiLoading').style.display = 'none';
  document.getElementById('aiOut').style.display = 'none';
}

function buildCharts(rows, cols, numCols) {
  const pal = ['#a78bfa', '#26d0ce', '#e879a0', '#f59e0b', '#4ade80', '#60a5fa', '#fb923c', '#34d399'];
  const gridColor = 'rgba(255,255,255,.04)';
  const tickColor = '#3d4566';

  if (numCols[0]) {
    const vals = rows.map(r => r[numCols[0]]).filter(v => typeof v === 'number');
    document.getElementById('chart1Title').textContent = `// ${numCols[0].toLowerCase()}`;
    document.getElementById('chart1Badge').textContent = 'bar chart';
    chartInstances.push(new Chart(document.getElementById('chart1').getContext('2d'), {
      type: 'bar',
      data: { labels: rows.map((_, i) => i + 1), datasets: [{ data: vals, backgroundColor: pal.map(c => c + '88'), borderWidth: 0, borderRadius: 3 }] },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10, family: 'Fira Code' } } }, y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10, family: 'Fira Code' } } } } }
    }));
  }

  const catCol = cols.find(c => !numCols.includes(c));
  if (catCol) {
    const freq = {};
    rows.forEach(r => { const v = String(r[catCol]); freq[v] = (freq[v] || 0) + 1; });
    const labels = Object.keys(freq).slice(0, 8);
    document.getElementById('chart2Title').textContent = `// ${catCol.toLowerCase()}`;
    chartInstances.push(new Chart(document.getElementById('chart2').getContext('2d'), {
      type: 'doughnut',
      data: { labels, datasets: [{ data: labels.map(l => freq[l]), backgroundColor: pal.map(c => c + 'bb'), borderWidth: 0 }] },
      options: { responsive: true, plugins: { legend: { position: 'right', labels: { color: '#8892b0', font: { size: 10, family: 'Fira Code' }, padding: 10, boxWidth: 10 } } } }
    }));
  }
}

function buildTable(rows, cols) {
  const preview = rows.slice(0, 8);
  document.getElementById('dataTable').innerHTML =
    `<thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead>` +
    `<tbody>${preview.map(r => `<tr>${cols.map(c => `<td>${r[c] ?? '—'}</td>`).join('')}</tr>`).join('')}</tbody>`;
}

async function getInsights() {
  if (!currentData) return;
  const btn = document.getElementById('insightsBtn');
  btn.disabled = true;
  document.getElementById('aiIdle').style.display = 'none';
  document.getElementById('aiLoading').style.display = 'flex';
  document.getElementById('aiOut').style.display = 'none';

  const { rows, cols, name } = currentData;
  const numCols = cols.filter(c => rows.some(r => typeof r[c] === 'number'));
  const stats = {};
  numCols.forEach(c => {
    const v = rows.map(r => r[c]).filter(v => typeof v === 'number');
    if (v.length) stats[c] = { min: +Math.min(...v).toFixed(2), max: +Math.max(...v).toFixed(2), avg: +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(2), count: v.length };
  });

  const prompt = `Dataset: "${name}"\nColumns: ${cols.join(', ')}\nRows: ${rows.length}\nNumeric column stats: ${JSON.stringify(stats)}\nFirst 5 rows: ${JSON.stringify(rows.slice(0, 5))}\n\nRespond ONLY with valid JSON, no markdown:\n{"summary":"<2-3 sentence overview of what this data represents and its overall story>","insights":["<specific finding 1 with numbers>","<specific finding 2 with numbers>","<specific finding 3>","<specific finding 4>"],"anomaly":"<one notable outlier or surprising pattern, or empty string if none>","recommendation":"<one concrete actionable recommendation based on this data>"}`;

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 1000, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await res.json();
    const r = JSON.parse(data.content[0].text);
    const dots = ['var(--purple-l)', 'var(--teal)', 'var(--pink)', 'var(--amber)'];
    document.getElementById('aiOut').innerHTML = `
      <p class="ai-summary">${r.summary}</p>
      <div class="insights-list">
        ${r.insights.map((ins, i) => `<div class="insight"><span class="ins-dot" style="background:${dots[i % 4]}"></span><span class="ins-txt">${ins}</span></div>`).join('')}
        ${r.anomaly ? `<div class="insight"><span class="ins-dot" style="background:var(--pink)"></span><span class="ins-txt"><strong>Notable pattern:</strong> ${r.anomaly}</span></div>` : ''}
        <div class="insight rec-insight"><span class="ins-dot" style="background:var(--purple-l)"></span><span class="ins-txt"><strong>Recommendation:</strong> ${r.recommendation}</span></div>
      </div>`;
    document.getElementById('aiLoading').style.display = 'none';
    document.getElementById('aiOut').style.display = 'block';
  } catch (e) {
    document.getElementById('aiLoading').style.display = 'none';
    document.getElementById('aiIdle').style.display = 'block';
    document.getElementById('aiIdle').innerHTML = '<p class="ai-idle" style="color:#e879a0">Error generating insights. Please try again.</p>';
  }
  btn.disabled = false;
}

function resetDash() {
  currentData = null;
  chartInstances.forEach(c => c.destroy());
  chartInstances = [];
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('dropZone').closest('.upload-area').style.display = 'block';
  document.querySelector('.samples-area').style.display = 'block';
  document.getElementById('fileInput').value = '';
}