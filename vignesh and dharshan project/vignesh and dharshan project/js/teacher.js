/* ══════════════════════════════════════════════
   EDUTRACK — TEACHER DASHBOARD LOGIC
   Class analytics, charts, student table,
   search/filter, and detail drill-down
   ══════════════════════════════════════════════ */

// ── Page Guard — Teacher Only ──
const currentTeacher = requireAuth('teacher');

// ── Student Data (full class) ──
const students = getAllStudents();

// ── Populate Dashboard ──
if (currentTeacher) {
  initTeacherDashboard(currentTeacher);
}

function initTeacherDashboard(user) {
  // ── Sidebar Profile ──
  document.getElementById('sidebarAvatar').textContent = user.initials;
  document.getElementById('sidebarName').textContent = user.name;
  document.getElementById('sidebarEmail').textContent = user.email;

  // ── Welcome Banner ──
  document.getElementById('welcomeName').textContent = user.name.split(' ')[0];
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // ── KPI Cards ──
  const avgMarks = Math.round(students.reduce((s, st) => s + st.marks, 0) / students.length);
  const avgAttend = Math.round(students.reduce((s, st) => s + st.attend, 0) / students.length);
  const avgAssign = Math.round(students.reduce((s, st) => s + st.assign, 0) / students.length);
  const atRisk = students.filter(s => s.marks < 50 || s.attend < 70).length;

  document.getElementById('kpiAvgMarks').textContent = avgMarks + '%';
  document.getElementById('kpiAvgAttend').textContent = avgAttend + '%';
  document.getElementById('kpiAvgAssign').textContent = avgAssign + '%';
  document.getElementById('kpiAtRisk').textContent = atRisk;

  // ── Charts ──
  initTeacherCharts();

  // ── Student Table ──
  renderStudentTable();

  // ── Event Listeners ──
  document.getElementById('searchInput').addEventListener('input', filterTable);
  document.getElementById('logoutBtn').addEventListener('click', logout);

  // ── Filter Buttons ──
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentFilter = this.getAttribute('data-filter');
      filterTable();
    });
  });

  // ── Sidebar Nav ──
  setupDashNav();

  // ── Student Detail Close ──
  document.getElementById('detailOverlay').addEventListener('click', function (e) {
    if (e.target === this) closeStudentDetail();
  });
  document.getElementById('detailClose').addEventListener('click', closeStudentDetail);
}

// ── Grade & Status Helpers ──
function grade(m) {
  if (m >= 80) return { label: 'A — Excellent', cls: 'badge-green' };
  if (m >= 65) return { label: 'B — Good', cls: 'badge-blue' };
  if (m >= 50) return { label: 'C — Average', cls: 'badge-amber' };
  return { label: 'D — Needs Help', cls: 'badge-red' };
}

function statusOf(s) {
  if (s.marks >= 80 && s.attend >= 85) return { label: 'Excellent', cls: 'badge-green', key: 'excellent' };
  if (s.marks < 50 || s.attend < 70) return { label: 'At Risk', cls: 'badge-red', key: 'at-risk' };
  return { label: 'On Track', cls: 'badge-blue', key: 'good' };
}

function barColor(v) {
  return v >= 75 ? '#22d3a0' : v >= 55 ? '#4f8ef7' : '#f43f5e';
}

// ── Student Table ──
let currentFilter = 'all';

function renderStudentTable(search = '') {
  const tbody = document.getElementById('tableBody');
  const rows = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const st = statusOf(s);
    const matchFilter = currentFilter === 'all' || st.key === currentFilter;
    return matchSearch && matchFilter;
  });

  tbody.innerHTML = rows.map((s, idx) => {
    const g = grade(s.marks);
    const st = statusOf(s);
    return `<tr onclick="openStudentDetail(${idx})" title="Click to view ${s.name}'s details">
      <td><div class="td-name">
        <div class="avatar" style="background:${s.color}22;color:${s.color}">${s.initials}</div>
        <span>${s.name}</span>
      </div></td>
      <td>
        <span class="prog-bar"><span class="prog-fill" style="width:${s.marks}%;background:${barColor(s.marks)}"></span></span>
        <span class="mono">${s.marks}%</span>
      </td>
      <td>
        <span class="prog-bar"><span class="prog-fill" style="width:${s.attend}%;background:${barColor(s.attend)}"></span></span>
        <span class="mono">${s.attend}%</span>
      </td>
      <td>
        <span class="prog-bar"><span class="prog-fill" style="width:${s.assign}%;background:${barColor(s.assign)}"></span></span>
        <span class="mono">${s.assign}%</span>
      </td>
      <td><span class="badge ${g.cls}">${g.label}</span></td>
      <td><span class="badge ${st.cls}">${st.label}</span></td>
    </tr>`;
  }).join('');

  // Update count
  const countEl = document.getElementById('studentCount');
  if (countEl) countEl.textContent = `${rows.length} student${rows.length !== 1 ? 's' : ''}`;
}

function filterTable() {
  const search = document.getElementById('searchInput').value;
  renderStudentTable(search);
}

// ── Student Detail Modal ──
function openStudentDetail(index) {
  const s = students[index];
  if (!s) return;

  const overlay = document.getElementById('detailOverlay');
  const g = grade(s.marks);
  const st = statusOf(s);

  document.getElementById('detailAvatar').style.background = s.color + '22';
  document.getElementById('detailAvatar').style.color = s.color;
  document.getElementById('detailAvatar').textContent = s.initials;
  document.getElementById('detailName').textContent = s.name;
  document.getElementById('detailStatus').innerHTML = `<span class="badge ${st.cls}">${st.label}</span> · <span class="badge ${g.cls}">${g.label}</span>`;
  document.getElementById('detailMarks').textContent = s.marks + '%';
  document.getElementById('detailMarks').style.color = barColor(s.marks);
  document.getElementById('detailAttend').textContent = s.attend + '%';
  document.getElementById('detailAttend').style.color = barColor(s.attend);
  document.getElementById('detailAssign').textContent = s.assign + '%';
  document.getElementById('detailAssign').style.color = barColor(s.assign);

  // Subject scores
  const subjects = [
    { name: 'Mathematics', score: s.math },
    { name: 'Science', score: s.science },
    { name: 'English', score: s.english },
    { name: 'Social Studies', score: s.social },
    { name: 'Computer Science', score: s.computer },
  ];

  document.getElementById('detailSubjects').innerHTML = subjects.map(sub => `
    <div class="sw-item">
      <span class="sw-name">${sub.name}</span>
      <span class="sw-score" style="color:${barColor(sub.score)}">${sub.score}%</span>
    </div>
  `).join('');

  overlay.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeStudentDetail() {
  document.getElementById('detailOverlay').classList.remove('show');
  document.body.style.overflow = '';
}

// ── Charts ──
function initTeacherCharts() {
  Chart.defaults.color = '#6b7a99';
  Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
  Chart.defaults.font.family = 'Sora, sans-serif';
  Chart.defaults.font.size = 11;

  // Bar Chart — Subject-wise Class Average
  new Chart(document.getElementById('barChart'), {
    type: 'bar',
    data: {
      labels: ['Math', 'Science', 'English', 'Social', 'Computer'],
      datasets: [{
        label: 'Class Average',
        data: [76, 74, 69, 72, 71],
        backgroundColor: ['#4f8ef755', '#22d3a055', '#7c5cfc55', '#f59e0b55', '#f43f5e55'],
        borderColor: ['#4f8ef7', '#22d3a0', '#7c5cfc', '#f59e0b', '#f43f5e'],
        borderWidth: 1.5, borderRadius: 6, borderSkipped: false,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { min: 50, max: 100, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { callback: v => v + '%' } },
        x: { grid: { display: false } }
      }
    }
  });

  // Doughnut — Performance Distribution
  const excellent = students.filter(s => s.marks >= 80).length;
  const good = students.filter(s => s.marks >= 65 && s.marks < 80).length;
  const average = students.filter(s => s.marks >= 50 && s.marks < 65).length;
  const needsHelp = students.filter(s => s.marks < 50).length;

  new Chart(document.getElementById('doughnutChart'), {
    type: 'doughnut',
    data: {
      labels: ['Excellent (A)', 'Good (B)', 'Average (C)', 'Needs Help'],
      datasets: [{
        data: [excellent, good, average, needsHelp],
        backgroundColor: ['#22d3a0aa', '#4f8ef7aa', '#f59e0baa', '#f43f5eaa'],
        borderColor: ['#22d3a0', '#4f8ef7', '#f59e0b', '#f43f5e'],
        borderWidth: 1.5, hoverOffset: 6,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: '68%',
      plugins: { legend: { position: 'bottom', labels: { padding: 10, boxWidth: 10, boxHeight: 10 } } }
    }
  });

  // Line Chart — Marks Trend
  new Chart(document.getElementById('lineChart'), {
    type: 'line',
    data: {
      labels: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
      datasets: [
        { label: 'Class Avg', data: [68, 71, 70, 73, 74, 76], borderColor: '#4f8ef7', backgroundColor: 'rgba(79,142,247,0.08)', tension: 0.4, fill: true, pointRadius: 3, borderWidth: 2 },
        { label: 'Top Student', data: [85, 87, 88, 90, 91, 93], borderColor: '#22d3a0', backgroundColor: 'rgba(34,211,160,0.04)', tension: 0.4, fill: false, pointRadius: 3, borderWidth: 2, borderDash: [4, 3] },
        { label: 'At-Risk Avg', data: [48, 46, 49, 45, 48, 47], borderColor: '#f43f5e', backgroundColor: 'rgba(244,63,94,0.04)', tension: 0.4, fill: false, pointRadius: 3, borderWidth: 2, borderDash: [4, 3] },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { padding: 10, boxWidth: 10 } } },
      scales: {
        y: { min: 30, max: 100, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { callback: v => v + '%' } },
        x: { grid: { display: false } }
      }
    }
  });

  // Radar Chart
  new Chart(document.getElementById('radarChart'), {
    type: 'radar',
    data: {
      labels: ['Math', 'Science', 'English', 'Social', 'CS'],
      datasets: [
        { label: 'Class Avg', data: [76, 74, 69, 72, 71], borderColor: '#4f8ef7', backgroundColor: 'rgba(79,142,247,0.15)', pointBackgroundColor: '#4f8ef7', borderWidth: 1.5 },
        { label: 'Top Student', data: [94, 90, 92, 91, 94], borderColor: '#22d3a0', backgroundColor: 'rgba(34,211,160,0.08)', pointBackgroundColor: '#22d3a0', borderWidth: 1.5 },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: { legend: { position: 'bottom', labels: { padding: 8, boxWidth: 8 } } },
      scales: { r: { min: 40, max: 100, grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { display: false }, pointLabels: { font: { size: 10 } } } }
    }
  });
}

// ── Sidebar Navigation ──
function setupDashNav() {
  const navItems = document.querySelectorAll('.dash-nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', function () {
      navItems.forEach(i => i.classList.remove('active'));
      this.classList.add('active');

      const target = this.getAttribute('data-section');
      if (target) {
        const el = document.getElementById(target);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}
