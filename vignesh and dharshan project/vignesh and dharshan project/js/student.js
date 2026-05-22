/* ══════════════════════════════════════════════
   EDUTRACK — STUDENT DASHBOARD LOGIC
   Personal data display, charts, 
   strengths/weaknesses, and profile info
   ══════════════════════════════════════════════ */

// ── Page Guard — Student Only ──
const currentStudent = requireAuth('student');

// ── Populate Dashboard ──
if (currentStudent) {
  initStudentDashboard(currentStudent);
}

function initStudentDashboard(user) {
  const data = user.demoData || {
    marks: 75, attend: 85, assign: 80,
    math: 78, science: 74, english: 72, social: 76, computer: 75,
    trend: [68, 71, 73, 74, 75, 77]
  };

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
  document.getElementById('kpiMarks').textContent = data.marks + '%';
  document.getElementById('kpiAttend').textContent = data.attend + '%';
  document.getElementById('kpiAssign').textContent = data.assign + '%';
  
  const overallGrade = getGrade(data.marks);
  const gradeEl = document.getElementById('kpiGrade');
  gradeEl.textContent = overallGrade.label;
  gradeEl.className = 'kpi-val ' + overallGrade.colorClass;

  // KPI trend arrows
  setTrendIndicator('trendMarks', data.marks, 72);
  setTrendIndicator('trendAttend', data.attend, 82);
  setTrendIndicator('trendAssign', data.assign, 78);

  // ── Personal Info ──
  document.getElementById('infoName').textContent = user.name;
  document.getElementById('infoEmail').textContent = user.email;
  document.getElementById('infoRole').textContent = 'Student';
  document.getElementById('infoClass').textContent = 'Class X-B';
  document.getElementById('infoJoined').textContent = new Date(user.createdAt).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  // ── Subject Cards ──
  populateSubjectCards(data);

  // ── Strengths & Weaknesses ──
  populateStrengthsWeaknesses(data);

  // ── Charts ──
  initStudentCharts(data);

  // ── Nav highlight ──
  setupDashNav();

  // ── Logout ──
  document.getElementById('logoutBtn').addEventListener('click', logout);
}

// ── Grade Calculation ──
function getGrade(marks) {
  if (marks >= 80) return { label: 'A — Excellent', colorClass: 'kpi-green' };
  if (marks >= 65) return { label: 'B — Good', colorClass: '' };
  if (marks >= 50) return { label: 'C — Average', colorClass: 'kpi-amber' };
  return { label: 'D — Needs Help', colorClass: 'kpi-red' };
}

function getSubjectGrade(marks) {
  if (marks >= 80) return { label: 'A', cls: 'kpi-green' };
  if (marks >= 65) return { label: 'B', cls: '' };
  if (marks >= 50) return { label: 'C', cls: 'kpi-amber' };
  return { label: 'D', cls: 'kpi-red' };
}

// ── Trend Indicator ──
function setTrendIndicator(elementId, current, baseline) {
  const el = document.getElementById(elementId);
  const diff = current - baseline;
  if (diff > 0) {
    el.textContent = `↑ +${diff}% vs last term`;
    el.className = 'kpi-trend kpi-green';
  } else if (diff < 0) {
    el.textContent = `↓ ${diff}% vs last term`;
    el.className = 'kpi-trend kpi-red';
  } else {
    el.textContent = '— steady';
    el.className = 'kpi-trend kpi-amber';
  }
}

// ── Subject Cards ──
function populateSubjectCards(data) {
  const subjects = [
    { key: 'math',     name: 'Mathematics',     cls: 'math' },
    { key: 'science',  name: 'Science',          cls: 'science' },
    { key: 'english',  name: 'English',          cls: 'english' },
    { key: 'social',   name: 'Social Studies',   cls: 'social' },
    { key: 'computer', name: 'Computer Science',  cls: 'computer' },
  ];

  const container = document.getElementById('subjectsGrid');
  container.innerHTML = subjects.map(sub => {
    const score = data[sub.key];
    const grade = getSubjectGrade(score);
    const color = score >= 80 ? 'var(--green)' : score >= 65 ? 'var(--accent)' : score >= 50 ? 'var(--amber)' : 'var(--red)';
    return `
      <div class="subject-card ${sub.cls}">
        <div class="subject-name">${sub.name}</div>
        <div class="subject-score" style="color:${color}">${score}%</div>
        <div class="subject-grade badge ${grade.cls === 'kpi-green' ? 'badge-green' : grade.cls === 'kpi-amber' ? 'badge-amber' : grade.cls === 'kpi-red' ? 'badge-red' : 'badge-blue'}">${grade.label} Grade</div>
      </div>
    `;
  }).join('');
}

// ── Strengths & Weaknesses ──
function populateStrengthsWeaknesses(data) {
  const subjects = [
    { key: 'math', name: 'Mathematics' },
    { key: 'science', name: 'Science' },
    { key: 'english', name: 'English' },
    { key: 'social', name: 'Social Studies' },
    { key: 'computer', name: 'Computer Science' },
  ];

  const sorted = subjects.map(s => ({ name: s.name, score: data[s.key] }))
    .sort((a, b) => b.score - a.score);

  const strengths = sorted.slice(0, 2);
  const weaknesses = sorted.slice(-2).reverse();

  document.getElementById('strengthsList').innerHTML = strengths.map(s => `
    <div class="sw-item">
      <span class="sw-name">${s.name}</span>
      <span class="sw-score" style="color:var(--green)">${s.score}%</span>
    </div>
  `).join('');

  document.getElementById('weaknessesList').innerHTML = weaknesses.map(s => `
    <div class="sw-item">
      <span class="sw-name">${s.name}</span>
      <span class="sw-score" style="color:var(--amber)">${s.score}%</span>
    </div>
  `).join('');
}

// ── Charts ──
function initStudentCharts(data) {
  // Chart defaults
  Chart.defaults.color = '#6b7a99';
  Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
  Chart.defaults.font.family = 'Sora, sans-serif';
  Chart.defaults.font.size = 11;

  // Subject-wise Bar Chart
  new Chart(document.getElementById('subjectBarChart'), {
    type: 'bar',
    data: {
      labels: ['Math', 'Science', 'English', 'Social', 'Computer'],
      datasets: [{
        label: 'Your Marks',
        data: [data.math, data.science, data.english, data.social, data.computer],
        backgroundColor: ['#4f8ef755', '#22d3a055', '#7c5cfc55', '#f59e0b55', '#f43f5e55'],
        borderColor: ['#4f8ef7', '#22d3a0', '#7c5cfc', '#f59e0b', '#f43f5e'],
        borderWidth: 1.5, borderRadius: 6, borderSkipped: false,
      }, {
        label: 'Class Average',
        data: [76, 74, 69, 72, 71],
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1, borderRadius: 6, borderSkipped: false,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { padding: 12, boxWidth: 10 } } },
      scales: {
        y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { callback: v => v + '%' } },
        x: { grid: { display: false } }
      }
    }
  });

  // Performance Trend Line Chart
  new Chart(document.getElementById('trendLineChart'), {
    type: 'line',
    data: {
      labels: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
      datasets: [{
        label: 'Your Performance',
        data: data.trend,
        borderColor: '#4f8ef7',
        backgroundColor: 'rgba(79,142,247,0.1)',
        tension: 0.4, fill: true, pointRadius: 4,
        borderWidth: 2.5, pointBackgroundColor: '#4f8ef7',
      }, {
        label: 'Class Average',
        data: [68, 71, 70, 73, 74, 76],
        borderColor: 'rgba(255,255,255,0.25)',
        backgroundColor: 'transparent',
        tension: 0.4, fill: false, pointRadius: 3,
        borderWidth: 1.5, borderDash: [4, 3],
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { padding: 12, boxWidth: 10 } } },
      scales: {
        y: { min: 30, max: 100, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { callback: v => v + '%' } },
        x: { grid: { display: false } }
      }
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
