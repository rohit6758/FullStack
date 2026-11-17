// Student Management & DNS Architecture Client Controller

// Dynamic API Base URL detection:
// - If hosted on Vercel or running on a separate frontend port (3000, 5173, 5500), call localhost:5000 or Render backend
// - If served directly from Express on port 5000, use relative paths
const API_BASE_URL = (() => {
  if (window.API_BASE_URL) return window.API_BASE_URL;
  if (window.location.hostname.includes('vercel.app')) {
    return 'https://sms-backend.onrender.com';
  }
  if (
    ['3000', '5173', '5500', '8080'].includes(window.location.port) ||
    window.location.protocol === 'file:'
  ) {
    return 'http://localhost:5000';
  }
  return '';
})();

let allStudents = [];

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    lucide.createIcons();
  }
  checkServerHealth();
  performDnsLookup(); // Initialize default DNS trace for sms-frontend.vercel.app
  loadStudents(); // Load SMS directory
});

// Toast Notification
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toastMessage');
  const iconEl = document.getElementById('toastIcon');

  msgEl.textContent = message;
  toast.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');
  toast.classList.add('translate-y-0', 'opacity-100');

  if (type === 'error') {
    toast.className =
      'fixed bottom-6 right-6 bg-red-900 border border-red-700 shadow-2xl rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-white transform transition-all duration-300 z-50';
    iconEl.setAttribute('data-lucide', 'alert-circle');
  } else {
    toast.className =
      'fixed bottom-6 right-6 bg-slate-800 border border-slate-700 shadow-2xl rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-white transform transition-all duration-300 z-50';
    iconEl.setAttribute('data-lucide', 'check-circle-2');
  }

  if (window.lucide) lucide.createIcons();

  setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
    toast.classList.remove('translate-y-0', 'opacity-100');
  }, 3500);
}

// Tab Switching
function switchTab(tabId) {
  const tabs = ['dns', 'hosting', 'sms', 'theory'];
  tabs.forEach((t) => {
    const btn = document.getElementById(`tabBtn-${t}`);
    const content = document.getElementById(`tabContent-${t}`);
    if (t === tabId) {
      btn.className =
        'tab-btn active px-4 py-2.5 text-sm font-medium rounded-t-lg flex items-center gap-2 border-b-2 border-blue-500 text-white bg-slate-800/60';
      content.classList.remove('hidden');
    } else {
      btn.className =
        'tab-btn px-4 py-2.5 text-sm font-medium rounded-t-lg flex items-center gap-2 border-b-2 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30';
      content.classList.add('hidden');
    }
  });
  if (window.lucide) lucide.createIcons();
}

// Check Server Health
async function checkServerHealth() {
  const textEl = document.getElementById('healthStatusText');
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    const data = await res.json();
    if (res.ok) {
      textEl.textContent = `Express Online (${data.database})`;
    } else {
      textEl.textContent = 'Server Status Degraded';
    }
  } catch (err) {
    textEl.textContent = 'Offline / Connecting...';
  }
}

// Quick Preset Helper
function setDomain(domain) {
  document.getElementById('domainInput').value = domain;
  performDnsLookup();
}

// ==========================================
// 1. DNS & RESOLUTION LOGIC (Question 1)
// ==========================================

async function performDnsLookup() {
  const domainInput =
    document.getElementById('domainInput').value.trim() || 'sms-frontend.vercel.app';
  const stepsContainer = document.getElementById('dnsStepsContainer');
  const latencyBadge = document.getElementById('dnsLatencyBadge');
  const latencyText = document.getElementById('dnsLatencyText');

  stepsContainer.innerHTML = `
    <div class="py-8 text-center text-slate-400 text-sm flex flex-col items-center justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
      Querying Root, TLD, and Authoritative Nameservers...
    </div>
  `;

  try {
    // 1. Fetch Trace steps
    const traceRes = await fetch(`${API_BASE_URL}/api/dns/trace`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: domainInput }),
    });
    const traceData = await traceRes.json();

    // 2. Fetch Live Records
    const recordsRes = await fetch(`${API_BASE_URL}/api/dns/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: domainInput }),
    });
    const recordsData = await recordsRes.json();

    if (traceData.success) {
      // Update Anatomy
      document.getElementById('anat-proto').textContent = traceData.anatomy.protocol;
      document.getElementById('anat-sub').textContent = traceData.anatomy.subdomain;
      document.getElementById('anat-sld').textContent = traceData.anatomy.secondLevelDomain;
      document.getElementById('anat-tld').textContent = '.' + traceData.anatomy.topLevelDomain;
      document.getElementById('anat-ip').textContent = traceData.resolvedIp || '76.76.21.21';

      // Update Latency
      latencyBadge.classList.remove('hidden');
      latencyText.textContent = `${traceData.totalLatencyMs} ms`;

      // Render Steps
      renderDnsSteps(traceData.steps);
    }

    if (recordsData.success) {
      renderRecords(recordsData.records);
    }
  } catch (error) {
    stepsContainer.innerHTML = `
      <div class="p-4 bg-red-950/40 border border-red-800 rounded-lg text-red-300 text-xs">
        Failed to resolve DNS: ${error.message}
      </div>
    `;
  }
}

function renderDnsSteps(steps) {
  const container = document.getElementById('dnsStepsContainer');
  container.innerHTML = steps
    .map(
      (s) => `
    <div class="dns-step-card p-4 rounded-xl border border-slate-700/80 bg-slate-900/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-xs border border-blue-500/30">
          0${s.step}
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h5 class="text-sm font-semibold text-white">${s.name}</h5>
            <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
              s.status.includes('Connected') || s.status.includes('Authoritative')
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }">${s.status}</span>
          </div>
          <p class="text-xs text-slate-400 mt-0.5">${s.description}</p>
          ${
            s.record
              ? `<code class="text-xs text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800 mt-1 inline-block">${s.record}</code>`
              : ''
          }
        </div>
      </div>
      <div class="flex items-center gap-3 self-end md:self-center shrink-0">
        <div class="text-right">
          <span class="text-[11px] text-slate-400 block">Target Server</span>
          <span class="text-xs font-mono text-cyan-400 font-medium">${s.queriedEntity}</span>
        </div>
        <span class="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded border border-slate-700">${s.latencyMs}ms</span>
      </div>
    </div>
  `
    )
    .join('');

  if (window.lucide) lucide.createIcons();
}

function renderRecords(records) {
  const aContainer = document.getElementById('recordsAContainer');
  const txtContainer = document.getElementById('recordsTxtContainer');

  // A and CNAME Records
  let aHtml = '';
  if (records.a && records.a.length > 0) {
    aHtml += records.a
      .map(
        (ip) => `
      <div class="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
        <div class="flex items-center gap-2">
          <span class="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 font-bold rounded text-[10px]">A (IPv4)</span>
          <code class="text-white font-mono">${ip}</code>
        </div>
        <span class="text-emerald-400 font-mono text-[11px]">TTL: 3600s</span>
      </div>
    `
      )
      .join('');
  }

  if (records.cname && records.cname.length > 0) {
    aHtml += records.cname
      .map(
        (cn) => `
      <div class="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
        <div class="flex items-center gap-2">
          <span class="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 font-bold rounded text-[10px]">CNAME</span>
          <code class="text-purple-300 font-mono">${cn}</code>
        </div>
        <span class="text-emerald-400 font-mono text-[11px]">Alias Pointer</span>
      </div>
    `
      )
      .join('');
  }

  if (!aHtml) {
    aHtml = `<div class="text-xs text-slate-400 italic">No A or CNAME records returned.</div>`;
  }
  aContainer.innerHTML = aHtml;

  // TXT Records
  let txtHtml = '';
  if (records.txt && records.txt.length > 0) {
    txtHtml = records.txt
      .slice(0, 3)
      .map(
        (t) => `
      <div class="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
        <div class="flex items-center gap-1.5 mb-1">
          <span class="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 font-bold rounded text-[10px]">TXT</span>
          <span class="text-[10px] text-slate-400">Verification Record</span>
        </div>
        <code class="text-slate-300 font-mono text-[11px] break-all block">${t}</code>
      </div>
    `
      )
      .join('');
  } else {
    txtHtml = `
      <div class="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400">
        <span class="text-cyan-400 font-mono">_vercel</span> verification token active for automatic SSL issuing.
      </div>
    `;
  }
  txtContainer.innerHTML = txtHtml;
}

// ==========================================
// 2. STUDENT MANAGEMENT SYSTEM CRUD LOGIC
// ==========================================

async function loadStudents() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/students`);
    const result = await res.json();
    if (result.success) {
      allStudents = result.data;
      updateMetrics(result.count, result.dataSource);
      renderStudentTable(allStudents);
    }
  } catch (err) {
    console.error('Error loading students:', err);
    showToast('Failed to load students from API', 'error');
  }
}

function updateMetrics(total, source) {
  document.getElementById('metricTotal').textContent = total;
  document.getElementById('metricSource').textContent = source;

  const techCount = allStudents.filter((s) => ['CSE', 'IT', 'AIDS'].includes(s.department)).length;
  document.getElementById('metricTech').textContent = techCount;

  if (allStudents.length > 0) {
    const avg = allStudents.reduce((acc, s) => acc + (s.cgpa || 8.0), 0) / allStudents.length;
    document.getElementById('metricAvgCgpa').textContent = avg.toFixed(2);
  } else {
    document.getElementById('metricAvgCgpa').textContent = '0.0';
  }
}

function getDeptBadgeClass(dept) {
  switch (dept.toUpperCase()) {
    case 'CSE':
      return 'badge-cse';
    case 'IT':
      return 'badge-it';
    case 'ECE':
      return 'badge-ece';
    case 'EEE':
      return 'badge-eee';
    case 'MECH':
      return 'badge-mech';
    case 'CIVIL':
      return 'badge-civil';
    case 'AIDS':
      return 'badge-aids';
    default:
      return 'bg-slate-700 text-slate-300';
  }
}

function renderStudentTable(students) {
  const tbody = document.getElementById('studentTableBody');
  if (students.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-8 text-center text-slate-400 text-sm">
          No student records found. Click "+ Add New Student" to create one.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = students
    .map(
      (s) => `
    <tr class="hover:bg-slate-800/40 transition">
      <td class="px-6 py-4 font-mono font-medium text-white">${s.rollNo}</td>
      <td class="px-6 py-4 font-medium text-slate-200">${s.name}</td>
      <td class="px-6 py-4">
        <span class="px-2.5 py-1 rounded-md text-xs font-semibold ${getDeptBadgeClass(s.department)}">
          ${s.department}
        </span>
      </td>
      <td class="px-6 py-4 text-slate-400 text-xs">${s.email}</td>
      <td class="px-6 py-4 text-slate-300">Sem ${s.semester || 4}</td>
      <td class="px-6 py-4 font-bold text-emerald-400">${s.cgpa ? Number(s.cgpa).toFixed(2) : '8.50'}</td>
      <td class="px-6 py-4 text-right space-x-2">
        <button
          onclick="openEditModal('${s._id}', '${s.name}', '${s.department}')"
          class="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 transition cursor-pointer"
          title="Update Department"
        >
          <i data-lucide="edit-2" class="w-4 h-4"></i>
        </button>
        <button
          onclick="handleDeleteStudent('${s._id}', '${s.name}')"
          class="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 transition cursor-pointer"
          title="Delete Student"
        >
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </td>
    </tr>
  `
    )
    .join('');

  if (window.lucide) lucide.createIcons();
}

// Modal Handlers
function openAddModal() {
  document.getElementById('addStudentModal').classList.remove('hidden');
}

function closeAddModal() {
  document.getElementById('addStudentModal').classList.add('hidden');
}

function openEditModal(id, name, dept) {
  document.getElementById('editStudentId').value = id;
  document.getElementById('editStudentLabel').textContent = `Change department for ${name}`;
  document.getElementById('editDepartmentSelect').value = dept;
  document.getElementById('editDepartmentModal').classList.remove('hidden');
}

function closeEditModal() {
  document.getElementById('editDepartmentModal').classList.add('hidden');
}

// Add Student API call
async function handleAddStudent(e) {
  e.preventDefault();
  const rollNo = document.getElementById('addRollNo').value.trim();
  const name = document.getElementById('addName').value.trim();
  const department = document.getElementById('addDepartment').value;
  const semester = Number(document.getElementById('addSemester').value);
  const email = document.getElementById('addEmail').value.trim();
  const cgpa = Number(document.getElementById('addCgpa').value);

  try {
    const res = await fetch(`${API_BASE_URL}/api/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rollNo, name, department, semester, email, cgpa }),
    });
    const result = await res.json();

    if (result.success) {
      showToast(`Student ${name} added successfully!`);
      closeAddModal();
      document.getElementById('addStudentForm').reset();
      loadStudents();
    } else {
      showToast(result.message || result.error || 'Failed to add student', 'error');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Update Department API call
async function handleSaveDepartment(e) {
  e.preventDefault();
  const id = document.getElementById('editStudentId').value;
  const newDept = document.getElementById('editDepartmentSelect').value;

  try {
    const res = await fetch(`${API_BASE_URL}/api/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ department: newDept }),
    });
    const result = await res.json();

    if (result.success) {
      showToast(`Department updated to ${newDept}!`);
      closeEditModal();
      loadStudents();
    } else {
      showToast(result.message || 'Update failed', 'error');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Delete Student API call
async function handleDeleteStudent(id, name) {
  if (!confirm(`Are you sure you want to delete ${name}?`)) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/students/${id}`, {
      method: 'DELETE',
    });
    const result = await res.json();

    if (result.success) {
      showToast(`Student deleted successfully!`);
      loadStudents();
    } else {
      showToast(result.message || 'Delete failed', 'error');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}
