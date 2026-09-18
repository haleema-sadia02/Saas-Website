/* =========================================================
   NEXORA — Dashboard Page Logic
   Chart.js charts, filters, KPI updates, table
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  // Guard: sirf dashboard page pe chale
  if (!document.getElementById('mainChart')) return;

  /* -----------------------------------------------------
     1. FAKE DATA GENERATOR
     ----------------------------------------------------- */
  const generateData = (days, base = 100, variance = 30) => {
    const labels = [];
    const data   = [];
    const prev   = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString('en', { month: 'short', day: 'numeric' }));
      data.push(Math.round(base + Math.sin(i / 3) * variance + Math.random() * 20));
      prev.push(Math.round(base * 0.85 + Math.cos(i / 3) * variance + Math.random() * 18));
    }
    return { labels, data, prev };
  };

  /* -----------------------------------------------------
     2. CHART DEFAULTS
     ----------------------------------------------------- */
  if (typeof Chart !== 'undefined') {
    Chart.defaults.color          = '#9CA3AF';
    Chart.defaults.font.family    = "'Inter', sans-serif";
    Chart.defaults.font.size      = 12;
    Chart.defaults.borderColor    = 'rgba(255,255,255,0.06)';
  }

  /* -----------------------------------------------------
     3. MAIN LINE CHART
     ----------------------------------------------------- */
  const mainCtx = document.getElementById('mainChart').getContext('2d');

  const gradient = mainCtx.createLinearGradient(0, 0, 0, 320);
  gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
  gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');

  let mainChart = new Chart(mainCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'This period',
          data: [],
          borderColor: '#6366F1',
          backgroundColor: gradient,
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#6366F1',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 3,
        },
        {
          label: 'Previous',
          data: [],
          borderColor: 'rgba(156, 163, 175, 0.4)',
          borderWidth: 2,
          borderDash: [6, 6],
          fill: false,
          tension: 0.4,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: {
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { callback: v => '$' + v + 'k' },
        },
      },
      interaction: { intersect: false, mode: 'index' },
    },
  });

  /* -----------------------------------------------------
     4. DOUGHNUT CHART
     ----------------------------------------------------- */
  new Chart(document.getElementById('doughnutChart'), {
    type: 'doughnut',
    data: {
      labels: ['Organic', 'Paid', 'Referral', 'Direct'],
      datasets: [{
        data: [42, 28, 18, 12],
        backgroundColor: ['#6366F1', '#22D3EE', '#A78BFA', '#F472B6'],
        borderWidth: 0,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: { legend: { display: false } },
    },
  });

  /* -----------------------------------------------------
     5. BAR CHART (Regions)
     ----------------------------------------------------- */
  new Chart(document.getElementById('barChart'), {
    type: 'bar',
    data: {
      labels: ['NA', 'EU', 'APAC', 'LATAM', 'MEA'],
      datasets: [{
        data: [820, 640, 480, 220, 140],
        backgroundColor: [
          'rgba(99, 102, 241, 0.85)',
          'rgba(34, 211, 238, 0.85)',
          'rgba(167, 139, 250, 0.85)',
          'rgba(244, 114, 182, 0.85)',
          'rgba(96, 165, 250, 0.85)',
        ],
        borderRadius: 8,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: {
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { callback: v => v + 'k' },
        },
      },
    },
  });

  /* -----------------------------------------------------
     6. KPI SPARKLINES (mini line charts)
     ----------------------------------------------------- */
  const makeSpark = (id, color) => {
    const el = document.getElementById(id);
    if (!el) return;
    const c = document.createElement('canvas');
    el.appendChild(c);
    new Chart(c, {
      type: 'line',
      data: {
        labels: Array.from({ length: 12 }, (_, i) => i),
        datasets: [{
          data: Array.from({ length: 12 }, () => 40 + Math.random() * 40),
          borderColor: color,
          borderWidth: 2,
          fill: false,
          tension: 0.45,
          pointRadius: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: false } },
      },
    });
  };

  makeSpark('sparkRevenue', '#6366F1');
  makeSpark('sparkUsers',   '#22D3EE');
  makeSpark('sparkConv',    '#A78BFA');
  makeSpark('sparkSession', '#F472B6');

  /* -----------------------------------------------------
     7. FILTER HANDLERS
     ----------------------------------------------------- */
  const dateFilter   = document.getElementById('dateFilter');
  const metricFilter = document.getElementById('metricFilter');
  const regionFilter = document.getElementById('regionFilter');
  const refreshBtn   = document.getElementById('refreshBtn');
  const mainTitle    = document.getElementById('mainChartTitle');

  const metricConfig = {
    revenue:  { base: 100, label: 'Revenue Over Time',      prefix: '$', suffix: 'k' },
    users:    { base: 200, label: 'Active Users Over Time', prefix: '',  suffix: '' },
    sessions: { base: 350, label: 'Sessions Over Time',     prefix: '',  suffix: '' },
  };

  const regionMultiplier = {
    global: 1, na: 1.15, eu: 0.9, apac: 0.75,
  };

  const updateChart = () => {
    const days   = parseInt(dateFilter.value, 10);
    const metric = metricFilter.value;
    const region = regionFilter.value;

    const cfg  = metricConfig[metric];
    const mult = regionMultiplier[region];

    const { labels, data, prev } = generateData(
      days,
      cfg.base * mult,
      cfg.base * 0.3
    );

    mainChart.data.labels             = labels;
    mainChart.data.datasets[0].data   = data;
    mainChart.data.datasets[1].data   = prev;
    mainChart.options.scales.y.ticks.callback =
      v => cfg.prefix + v + cfg.suffix;
    mainChart.update();

    mainTitle.textContent = cfg.label;
  };

  // Event listeners
  dateFilter.addEventListener('change', updateChart);
  metricFilter.addEventListener('change', updateChart);
  regionFilter.addEventListener('change', updateChart);

  refreshBtn.addEventListener('click', () => {
    refreshBtn.textContent = '⏳ Refreshing…';
    setTimeout(() => {
      updateChart();
      updateKPIs();
      refreshBtn.textContent = '🔄 Refresh';
    }, 600);
  });

  /* -----------------------------------------------------
     8. KPI UPDATES
     ----------------------------------------------------- */
  const updateKPIs = () => {
    const rev  = 200000 + Math.round(Math.random() * 120000);
    const usr  = 10000  + Math.round(Math.random() * 5000);
    const conv = (3.8 + Math.random() * 1.2).toFixed(2);
    const sess = (5 + Math.random() * 3).toFixed(0);

    document.getElementById('kpiRevenue').textContent = rev.toLocaleString();
    document.getElementById('kpiUsers').textContent   = usr.toLocaleString();
    document.getElementById('kpiConv').textContent    = conv;
    document.getElementById('kpiSession').textContent = `${sess}:${Math.floor(Math.random()*60).toString().padStart(2,'0')}`;
  };

  /* -----------------------------------------------------
     9. RECENT TRANSACTIONS TABLE
     ----------------------------------------------------- */
  const customers = ['Acme Inc.', 'Northwind', 'Vertex Labs', 'Lumen Co.', 'Orbit AI', 'Pulse Media', 'Nova Corp', 'Zenith'];
  const plans     = ['Starter', 'Pro', 'Pro', 'Enterprise', 'Pro', 'Starter', 'Enterprise', 'Pro'];
  const statuses  = ['Paid', 'Paid', 'Pending', 'Paid', 'Paid', 'Refunded', 'Paid', 'Pending'];

  const tbody = document.getElementById('tableBody');
  if (tbody) {
    tbody.innerHTML = customers.map((c, i) => {
      const amount = (99 + Math.random() * 900).toFixed(2);
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date = d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
      const statusClass = statuses[i] === 'Paid' ? 'status-paid'
                        : statuses[i] === 'Pending' ? 'status-pending'
                        : 'status-refunded';
      return `
        <tr>
          <td>${c}</td>
          <td>${plans[i]}</td>
          <td>$${amount}</td>
          <td>${date}</td>
          <td><span class="status-pill ${statusClass}">${statuses[i]}</span></td>
        </tr>
      `;
    }).join('');
  }

  /* -----------------------------------------------------
     10. INITIAL LOAD
     ----------------------------------------------------- */
  updateChart();
  updateKPIs();

});