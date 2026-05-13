const API_BASE = `${window.location.origin}/api/v1`;

const state = {
  page: 'overview',
  query: '',
  summary: { metrics: {}, nodes: [], tasks: [], approvals: [] },
  services: [],
  theme: localStorage.getItem('hmn-theme') || 'midnight',
  mode: localStorage.getItem('hmn-mode') || 'dark',
  customThemeName: localStorage.getItem('hmn-custom-theme-name') || ''
};

const pageTitle = {
  overview: '总览', nodes: '节点', tasks: '任务', approvals: '审批', services: '服务资产', join: '接入节点', backup: '备份恢复', network: '网络 ACL', components: '组件', headscale: 'Headscale 配置', docs: '文档中心', themes: '主题', permissions: '账户与权限', skills: 'Hermes 技能', conversations: 'Hermes 对话', platform: '平台配置'
};

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
const esc = (v) => String(v ?? '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c]);
const pct = (v) => Math.max(0, Math.min(100, Number(v) || 0));
const managedNodes = () => (state.summary.nodes || []).filter((n) => n.status === 'managed');
const filteredNodes = () => managedNodes().filter((n) => JSON.stringify(n).toLowerCase().includes(state.query.toLowerCase()));

const builtinThemes = {
  midnight: { name: 'Apple Ops', desc: 'Apple / visionOS 风格，深色优先的云控制台。', accent: '#8f8cf8' },
  graphite: { name: 'Graphite', desc: '低饱和石墨灰，更克制的控制台观感。', accent: '#a7b0c0' },
  aurora: { name: 'Aurora', desc: '青绿极光强调色，状态感更明显。', accent: '#67e8f9' },
  ember: { name: 'Ember', desc: '暖色警戒风格，适合高风险运维窗口。', accent: '#fbbf24' },
  custom: { name: 'Custom Package', desc: '从上传的主题包读取 CSS 变量。', accent: '#cfbcff' }
};

function applyMode(mode = state.mode) {
  state.mode = mode === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.mode = state.mode;
  document.documentElement.classList.toggle('dark', state.mode === 'dark');
  localStorage.setItem('hmn-mode', state.mode);
  const icon = $('#mode-toggle .material-symbols-outlined');
  if (icon) icon.textContent = state.mode === 'dark' ? 'dark_mode' : 'light_mode';
}

function closeSidebar() {
  document.body.classList.remove('sidebar-open');
}

function applyTheme(theme = state.theme) {
  state.theme = builtinThemes[theme] ? theme : 'midnight';
  document.documentElement.dataset.theme = state.theme;
  applyMode(state.mode);
  localStorage.setItem('hmn-theme', state.theme);
  const customCss = localStorage.getItem('hmn-custom-theme-css') || '';
  let style = $('#custom-theme-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'custom-theme-style';
    document.head.appendChild(style);
  }
  style.textContent = state.theme === 'custom' ? customCss : '';
}

function parseThemePackage(text) {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('主题包为空');
  if (trimmed.startsWith('{')) {
    const data = JSON.parse(trimmed);
    const vars = data.vars || data.variables || data;
    const cssVars = Object.entries(vars)
      .filter(([key, value]) => key.startsWith('--') && typeof value === 'string')
      .map(([key, value]) => `${key}:${value};`)
      .join('');
    if (!cssVars) throw new Error('JSON 主题包没有 CSS 变量');
    return { name: data.name || 'Uploaded Theme', css: `:root[data-theme="custom"]{${cssVars}}` };
  }
  if (!trimmed.includes('--')) throw new Error('主题包需包含 CSS 变量或 JSON vars');
  return { name: 'Uploaded Theme', css: trimmed };
}

function showToast(message, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  $('#toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { accept: 'application/json', 'content-type': 'application/json', ...(options.headers || {}) }
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try { const body = await res.json(); detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail || body); } catch {}
    throw new Error(detail);
  }
  return res.json();
}

async function refresh({ silent = false } = {}) {
  try {
    const [summary, serviceResp] = await Promise.all([
      api('/console/summary'),
      api('/console/services').catch(() => ({ services: [] }))
    ]);
    state.summary = summary;
    state.services = serviceResp.services || [];
    $('#api-status').textContent = `API online · ${location.hostname}`;
    const pending = (summary.approvals || []).filter((a) => a.status === 'pending').length;
    $('#approval-count').textContent = String(pending);
    render();
    if (!silent) showToast('已刷新');
  } catch (err) {
    $('#api-status').textContent = 'API offline';
    showToast(`无法连接 HMN API：${err.message}`, 'danger');
  }
}

function switchPage(page) {
  state.page = page || 'overview';
  $$('.nav-item').forEach((b) => b.classList.toggle('active', b.dataset.page === state.page));
  $('#page-title').textContent = pageTitle[state.page] || 'HMN';
  if (location.hash.slice(1) !== state.page) location.hash = state.page;
  render();
}

function statusChip(label, cls) { return `<span class="status-chip ${cls}">${esc(label)}</span>`; }
function liveChip(node) {
  if (node.live === 'online') return statusChip('Online', 'chip-online');
  if (node.live === 'stale') return statusChip('Stale', 'chip-stale');
  return statusChip('Offline', 'chip-offline');
}
function riskChip(risk) {
  const r = risk || 'low';
  if (r === 'critical' || r === 'high') return statusChip(r, 'chip-danger');
  if (r === 'medium') return statusChip(r, 'chip-warning');
  return statusChip(r, 'chip-success');
}
function taskStatusChip(status) {
  const s = status || '-';
  if (s === 'running') return statusChip('RUNNING', 'chip-running');
  if (s === 'succeeded' || s === 'approved') return statusChip(s.toUpperCase(), 'chip-success');
  if (s === 'failed' || s === 'rejected') return statusChip(s.toUpperCase(), 'chip-danger');
  if (s === 'pending_approval' || s === 'pending') return statusChip(s.toUpperCase(), 'chip-warning');
  return statusChip(s.toUpperCase(), 'chip-offline');
}
function bar(value) {
  const v = pct(value);
  const tone = v >= 90 ? 'danger' : v >= 75 ? 'warn' : '';
  return `<div class="progress-bg"><div class="progress-fill ${tone}" style="width:${v}%"></div></div>`;
}

function metric(label, value, icon, sub = '', danger = false) {
  return `<div class="card p-4 ${danger ? 'border-red-500/30 bg-red-500/5' : ''}">
    <div class="flex items-center justify-between"><span class="text-[11px] font-semibold uppercase tracking-wider text-muted">${esc(label)}</span><span class="material-symbols-outlined text-[20px] ${danger ? 'text-danger' : 'text-primary'}">${icon}</span></div>
    <div class="mt-4 flex items-end gap-2"><span class="text-3xl font-semibold leading-none text-white">${esc(value)}</span>${sub ? `<span class="mb-1 text-xs text-muted">${esc(sub)}</span>` : ''}</div>
  </div>`;
}

function nodeCard(node) {
  return `<article class="card-soft p-4 space-y-4 ${node.live === 'offline' ? 'opacity-60' : ''}">
    <div class="flex items-start justify-between gap-3"><div><h3 class="font-mono text-sm font-bold text-white">${esc(node.name)}</h3><p class="font-mono text-xs text-muted">ID: ${esc(node.id)}</p></div>${liveChip(node)}</div>
    <div class="grid grid-cols-2 gap-3 border-y border-line py-3 text-sm"><div class="flex items-center gap-2"><span class="material-symbols-outlined text-[18px] text-muted">terminal</span><span>${esc(node.os || 'unknown')}</span></div><div class="flex items-center justify-end gap-2"><span class="material-symbols-outlined text-[18px] text-muted">schedule</span><span>${esc(node.uptime || '-')}</span></div></div>
    <div class="space-y-3">
      ${stat('CPU', node.cpu)}
      ${stat('RAM', node.memory)}
      ${stat('Disk', node.disk)}
    </div>
    <div class="flex items-center justify-between border-t border-line pt-3 font-mono text-[11px] text-muted"><span>${node.exec ? 'Executing: worker enabled' : 'Executing: disabled'}</span><span>Heartbeat: ${esc(node.hb || '-')}</span></div>
    <div class="flex gap-2"><button class="btn-secondary" data-task-node="${esc(node.id)}">下发任务</button><button class="btn-secondary" data-copy="${esc(node.id)}">复制 ID</button></div>
  </article>`;
}
function stat(label, value) {
  return `<div><div class="mb-1 flex justify-between font-mono text-[11px] text-muted"><span>${label}</span><span>${esc(value ?? 0)}%</span></div>${bar(value)}</div>`;
}

function renderOverview() {
  const m = state.summary.metrics || {};
  const nodes = managedNodes();
  const pending = (state.summary.approvals || []).filter((a) => a.status === 'pending');
  const online = nodes.filter((n) => n.live === 'online').length;
  const ring = Math.round((Number(m.managed_nodes || 0) / Math.max(1, Number(m.total_nodes || 1))) * 251);
  return `<div class="space-y-6">
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      ${metric('总节点', m.total_nodes ?? 0, 'memory')}
      ${metric('在线 Worker', online, 'cloud_done', `/ ${m.managed_nodes ?? 0} 已纳管`)}
      ${metric('运行任务', m.running_tasks ?? 0, 'task_alt')}
      ${metric('待审批', m.pending_approvals ?? 0, 'warning', pending.length ? `${pending.length} 个等待` : '', Number(m.pending_approvals) > 0)}
      ${metric('托管节点', m.managed_nodes ?? 0, 'verified', `${m.pending_nodes ?? 0} 个待接入隐藏`)}
    </div>
    <div class="grid grid-cols-12 gap-4">
      <section class="card p-6 col-span-12 lg:col-span-4"><h3 class="mb-6 flex items-center gap-2 text-lg font-semibold text-white"><span class="material-symbols-outlined text-primary">pie_chart</span>节点分布</h3><div class="relative mx-auto h-44 w-44"><svg class="ring h-44 w-44" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" class="text-muted/20" stroke-width="12"/><circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" class="text-primary" stroke-width="12" stroke-dasharray="${ring} 251"/></svg><div class="absolute inset-0 grid place-items-center text-center"><div><p class="text-xs text-muted">托管</p><p class="text-2xl font-bold text-white">${m.managed_nodes ?? 0}</p></div></div></div><div class="mt-5 grid grid-cols-2 gap-3 text-sm"><span class="text-primary">● 已纳管 (${m.managed_nodes ?? 0})</span><span class="text-warning">● 待接入 (${m.pending_nodes ?? 0})</span></div></section>
      <section class="card p-6 col-span-12 lg:col-span-8"><div class="mb-5 flex items-center justify-between"><h3 class="flex items-center gap-2 text-lg font-semibold text-white"><span class="material-symbols-outlined text-primary">rebase_edit</span>任务流水线</h3><button data-switch="tasks" class="text-sm text-primary hover:underline">查看全部</button></div>${taskTable(state.summary.tasks || [])}</section>
    </div>
    <div class="grid grid-cols-12 gap-4"><section class="card p-6 col-span-12 lg:col-span-8"><div class="mb-5 flex items-center justify-between"><h3 class="text-lg font-semibold text-white">托管节点</h3><span class="status-chip chip-success">仅托管</span></div><div class="grid grid-cols-1 gap-4 xl:grid-cols-2">${nodes.slice(0, 4).map(nodeCard).join('') || empty('暂无 managed 节点')}</div></section><section class="card p-6 col-span-12 lg:col-span-4">${approvalPanel(pending)}</section></div>
  </div>`;
}

function taskTable(tasks) {
  if (!tasks.length) return empty('暂无任务');
  return `<div class="table-wrap"><table class="w-full border-collapse text-sm"><thead class="bg-[#1d1b20]"><tr><th class="px-4 py-2 text-left text-[11px] uppercase tracking-wider text-muted">Task ID</th><th class="px-4 py-2 text-left text-[11px] uppercase tracking-wider text-muted">Node</th><th class="px-4 py-2 text-left text-[11px] uppercase tracking-wider text-muted">Command</th><th class="px-4 py-2 text-left text-[11px] uppercase tracking-wider text-muted">Status</th></tr></thead><tbody>${tasks.map((t) => `<tr class="table-row border-t border-line"><td class="px-4 py-3 font-mono text-xs">${esc(t.id)}</td><td class="px-4 py-3">${esc(t.node_name || t.node_id)}</td><td class="px-4 py-3 font-mono text-xs">${esc(t.command)}</td><td class="px-4 py-3">${taskStatusChip(t.status)}</td></tr>`).join('')}</tbody></table></div>`;
}

function pageHeader(title, desc, icon = 'dashboard', chip = '') {
  return `<div class="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p class="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-primary"><span class="material-symbols-outlined text-[18px]">${icon}</span> HMN Console</p><h2 class="text-2xl font-bold text-white">${esc(title)}</h2>${desc ? `<p class="mt-2 max-w-3xl text-sm text-muted">${esc(desc)}</p>` : ''}</div>${chip}</div>`;
}

function approvalPanel(approvals) {
  return `<h3 class="mb-5 flex items-center gap-2 text-lg font-semibold text-white"><span class="material-symbols-outlined text-danger">gavel</span>待审批</h3><div class="space-y-3">${approvals.length ? approvals.map(approvalCard).join('') : empty('暂无待审批动作')}</div>`;
}
function approvalCard(a) {
  return `<div class="rounded-lg border-l-2 ${a.risk === 'medium' ? 'border-warning' : 'border-danger'} bg-[#1d1b20] p-4"><div class="mb-2 flex items-start justify-between">${riskChip(a.risk)}<span class="font-mono text-[10px] text-muted">${esc(a.id)}</span></div><p class="font-medium text-white">${esc(a.action)}</p><p class="mt-1 font-mono text-[11px] text-muted">${esc(a.subject_type)}:${esc(a.subject_id)} · ${esc(a.requested_by || '')}</p><div class="mt-4 flex gap-2"><button class="btn-primary flex-1" data-approve="${esc(a.id)}">允许</button><button class="btn-secondary flex-1" data-reject="${esc(a.id)}">取消</button></div></div>`;
}

function renderNodes() {
  const nodes = filteredNodes();
  const online = nodes.filter((n) => n.live === 'online').length;
  const stale = nodes.filter((n) => n.live === 'stale').length;
  return `<div class="space-y-6">${pageHeader('Managed Nodes', `${online} Active · ${stale} Stale · ${nodes.length - online - stale} Offline`, 'developer_board', '<span class="status-chip chip-success">仅托管</span>')}<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">${nodes.map(nodeCard).join('') || empty('没有匹配的 managed 节点')}</div></div>`;
}

function renderTasks() {
  const opts = managedNodes().map((n) => `<option value="${esc(n.id)}">${esc(n.name)} · ${esc(n.id)}</option>`).join('');
  return `<div class="space-y-6"><section class="card p-6"><h3 class="mb-4 text-lg font-semibold text-white">New Task</h3><form id="task-form" class="grid gap-4 md:grid-cols-[1fr_2fr_auto]"><label class="field">节点<select id="task-node">${opts || '<option value="">暂无 managed 节点</option>'}</select></label><label class="field">命令<input id="task-command" value="uptime" /></label><button class="btn-primary self-end" type="submit">下发</button></form><p class="mt-3 text-sm text-muted">高风险命令会自动进入审批队列。</p></section><section class="card p-6"><h3 class="mb-4 text-lg font-semibold text-white">任务流水线</h3>${taskTable(state.summary.tasks || [])}</section></div>`;
}

function renderApprovals() {
  const approvals = state.summary.approvals || [];
  return `<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">${approvals.length ? approvals.map((a) => `<div class="card p-5"><div class="mb-3 flex items-start justify-between">${riskChip(a.risk)}${taskStatusChip(a.status)}</div><h3 class="font-semibold text-white">${esc(a.action)}</h3><p class="mt-2 font-mono text-xs text-muted">${esc(a.subject_type)}:${esc(a.subject_id)}<br>${esc(a.id)}<br>${esc(a.created_at)}</p>${a.status === 'pending' ? `<div class="mt-5 flex gap-2"><button class="btn-primary flex-1" data-approve="${esc(a.id)}">允许</button><button class="btn-danger flex-1" data-reject="${esc(a.id)}">取消</button></div>` : ''}</div>`).join('') : empty('暂无审批记录')}</div>`;
}

function renderServices() {
  const services = state.services.filter((s) => JSON.stringify(s).toLowerCase().includes(state.query.toLowerCase()));
  return `<div class="table-wrap"><table class="w-full text-sm"><thead class="bg-[#1d1b20]"><tr><th class="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-muted">Service</th><th class="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-muted">Node</th><th class="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-muted">Domains</th><th class="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-muted">Status</th><th class="px-5 py-3"></th></tr></thead><tbody>${services.map((s) => `<tr class="table-row border-t border-line"><td class="px-5 py-4"><b class="text-white">${esc(s.name)}</b><p class="font-mono text-xs text-muted">${esc(s.service_id)} · ${esc(s.kind)} · ports ${(s.ports || []).join(',') || '-'}</p></td><td class="px-5 py-4 font-mono text-xs">${esc(s.node_id)}</td><td class="px-5 py-4">${(s.domains || []).map((d) => `<a class="mr-2 text-primary hover:underline" href="https://${esc(d)}" target="_blank">${esc(d)}</a>`).join('') || '-'}</td><td class="px-5 py-4">${taskStatusChip(s.status)}</td><td class="px-5 py-4 text-right">${s.docs_path ? `<a class="btn-secondary" href="/hmn-web/docs/file/${encodeURIComponent(s.docs_path)}" target="_blank">文档</a>` : ''}</td></tr>`).join('') || `<tr><td class="px-5 py-5" colspan="5">${empty('暂无服务资产')}</td></tr>`}</tbody></table></div>`;
}

function renderJoin() {
  return `<div class="grid gap-6 xl:grid-cols-[1fr_360px]"><section class="card p-6"><h3 class="text-lg font-semibold text-white">Join Node</h3><p class="mt-2 text-sm text-muted">填入 Join Token 后复制到目标服务器执行。默认自动确认、自动安装 worker，并开启执行能力。</p><div class="mt-5 grid gap-4 md:grid-cols-2"><label class="field">Master URL<input id="join-master" value="${esc(location.origin)}" /></label><label class="field">Join Token<input id="join-token" placeholder="填入 HERMES_JOIN_TOKEN" /></label><label class="field">HERMES_AUTO_CONFIRM<select id="join-auto-confirm"><option value="1">1 开启</option><option value="0">0 关闭</option></select></label><label class="field">HERMES_AUTO_INSTALL_WORKER<select id="join-auto-worker"><option value="1">1 开启</option><option value="0">0 关闭</option></select></label><label class="field">HMN_ENABLE_EXEC<select id="join-exec"><option value="1">1 开启</option><option value="0">0 关闭</option></select></label></div><pre id="join-command" class="codebox mt-5"></pre><div class="mt-4 flex gap-2"><button id="copy-join" class="btn-primary">复制命令</button><a class="btn-secondary" href="/scripts/join.sh" target="_blank">查看脚本</a></div></section><aside class="card p-6"><h3 class="font-semibold text-white">默认策略</h3><ul class="mt-4 space-y-3 text-sm text-muted"><li>• 注册后默认 managed</li><li>• permission_bundles: observe, task</li><li>• worker systemd timer 自动写入</li><li>• pending 节点不进入主视图</li></ul></aside></div>`;
}



function renderPermissions() {
  const roles = [
    ['owner', 'Owner', '完整控制台访问、审批、任务下发、主题与权限管理'],
    ['operator', 'Operator', '查看节点、下发低风险任务、读取服务与文档'],
    ['auditor', 'Auditor', '只读查看总览、节点、任务、审批与审计信息']
  ];
  const permissions = [
    ['console.view', '访问控制台', true, true, true],
    ['node.manage', '管理节点与接入', true, false, false],
    ['task.dispatch', '下发任务', true, true, false],
    ['approval.decide', '审批允许/取消', true, false, false],
    ['service.view', '查看服务资产', true, true, true],
    ['theme.manage', '切换/上传主题包', true, false, false],
    ['permission.manage', '管理权限', true, false, false]
  ];
  return `<div class="space-y-6">
    <section class="card p-6">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div><h3 class="text-lg font-semibold text-white">权限管理</h3><p class="mt-2 text-sm text-muted">当前站点已启用管理员登录保护。默认管理员用于访问 HMN Web 控制台。</p></div>
        <span class="status-chip chip-success">BASIC AUTH ENABLED</span>
      </div>
      <div class="mt-6 grid gap-4 md:grid-cols-3">
        <div class="card-soft p-4"><span class="text-[11px] font-semibold uppercase tracking-wider text-muted">Admin User</span><p class="mt-3 font-mono text-xl font-bold text-white">liut</p><p class="mt-2 text-xs text-muted">默认管理员账号</p></div>
        <div class="card-soft p-4"><span class="text-[11px] font-semibold uppercase tracking-wider text-muted">Auth Layer</span><p class="mt-3 font-mono text-xl font-bold text-white">Caddy Basic Auth</p><p class="mt-2 text-xs text-muted">站点与 API 同源保护</p></div>
        <div class="card-soft p-4"><span class="text-[11px] font-semibold uppercase tracking-wider text-muted">Session</span><p class="mt-3 font-mono text-xl font-bold text-white">Browser Managed</p><p class="mt-2 text-xs text-muted">由浏览器保存登录态</p></div>
      </div>
    </section>
    <section class="grid gap-6 xl:grid-cols-[360px_1fr]">
      <aside class="card p-6"><h3 class="font-semibold text-white">角色</h3><div class="mt-4 space-y-3">${roles.map(([id,name,desc]) => `<div class="rounded-xl border border-line bg-white/[0.02] p-4"><div class="flex items-center justify-between"><b class="text-white">${name}</b><span class="font-mono text-[10px] text-muted">${id}</span></div><p class="mt-2 text-xs leading-5 text-muted">${desc}</p></div>`).join('')}</div></aside>
      <div class="table-wrap"><table class="w-full text-sm"><thead class="bg-[#1d1b20]"><tr><th class="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-muted">Permission</th><th class="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-muted">说明</th><th class="px-5 py-3 text-center text-[11px] uppercase tracking-wider text-muted">Owner</th><th class="px-5 py-3 text-center text-[11px] uppercase tracking-wider text-muted">Operator</th><th class="px-5 py-3 text-center text-[11px] uppercase tracking-wider text-muted">Auditor</th></tr></thead><tbody>${permissions.map(([key,desc,owner,operator,auditor]) => `<tr class="table-row border-t border-line"><td class="px-5 py-4 font-mono text-xs text-primary">${key}</td><td class="px-5 py-4 text-muted">${desc}</td>${[owner,operator,auditor].map(v => `<td class="px-5 py-4 text-center"><span class="material-symbols-outlined ${v ? 'text-success' : 'text-muted'}">${v ? 'check_circle' : 'remove_circle'}</span></td>`).join('')}</tr>`).join('')}</tbody></table></div>
    </section>
    <section class="card p-6"><h3 class="font-semibold text-white">后续扩展</h3><p class="mt-2 text-sm text-muted">当前是站点级管理员保护 + 前端权限视图。若要多人账号、审计登录、按角色限制按钮，可继续接入 HMN 后端 RBAC 表和登录 API。</p></section>
  </div>`;
}

function renderThemes() {
  const cards = Object.entries(builtinThemes).map(([id, theme]) => {
    const active = state.theme === id;
    const customName = id === 'custom' && state.customThemeName ? ` · ${esc(state.customThemeName)}` : '';
    return `<button class="theme-card ${active ? 'active' : ''}" data-theme-choice="${esc(id)}">
      <span class="theme-swatch" style="--swatch:${esc(theme.accent)}"></span>
      <span class="min-w-0 flex-1 text-left"><b>${esc(theme.name)}${customName}</b><small>${esc(theme.desc)}</small></span>
      <span class="material-symbols-outlined text-[20px]">${active ? 'radio_button_checked' : 'radio_button_unchecked'}</span>
    </button>`;
  }).join('');
  return `<div class="space-y-6">
    <section class="card p-6">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div><h3 class="text-lg font-semibold text-white">主题设置</h3><p class="mt-2 text-sm text-muted">切换控制台主题，或上传一个轻量主题包覆盖 CSS 变量。设置会保存在当前浏览器。</p></div>
        <span class="status-chip chip-running">${esc(builtinThemes[state.theme]?.name || state.theme)}</span>
      </div>
      <div class="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">${cards}</div>
    </section>
    <section class="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div class="card p-6">
        <h3 class="text-lg font-semibold text-white">上传主题包</h3>
        <p class="mt-2 text-sm text-muted">支持 .css 或 .json。JSON 示例：<span class="font-mono">{"name":"Ocean","vars":{"--hmn-primary":"#67e8f9"}}</span></p>
        <div class="mt-5 rounded-xl border border-dashed border-line bg-white/[0.02] p-6">
          <input id="theme-upload" type="file" accept=".css,.json,text/css,application/json" class="block w-full text-sm text-muted file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:font-semibold file:text-[#22005d]" />
          <div class="mt-4 flex flex-wrap gap-2">
            <button id="reset-theme" class="btn-secondary">恢复默认</button>
            <button id="export-theme" class="btn-secondary">导出当前变量</button>
          </div>
        </div>
      </div>
      <aside class="card p-6">
        <h3 class="font-semibold text-white">主题包变量</h3>
        <ul class="mt-4 space-y-2 font-mono text-xs text-muted">
          <li>--hmn-bg</li><li>--hmn-surface</li><li>--hmn-panel</li><li>--hmn-line</li><li>--hmn-primary</li><li>--hmn-accent</li><li>--hmn-text</li><li>--hmn-muted</li><li>--hmn-success / warning / danger</li>
        </ul>
      </aside>
    </section>
    <section class="card p-6"><h3 class="mb-4 text-lg font-semibold text-white">实时预览</h3><div class="grid gap-4 md:grid-cols-3">${metric('Theme', builtinThemes[state.theme]?.name || state.theme, 'palette')}${metric('API', $('#api-status')?.textContent || 'online', 'cloud_done')}${metric('Managed', state.summary.metrics?.managed_nodes ?? 0, 'verified')}</div></section>
  </div>`;
}

function renderPlaceholder(title, desc, icon) {
  return `<div class="card p-8"><span class="material-symbols-outlined text-5xl text-primary/60">${icon}</span><h3 class="mt-4 text-xl font-semibold text-white">${title}</h3><p class="mt-2 max-w-2xl text-sm text-muted">${desc}</p></div>`;
}
function empty(text) { return `<div class="empty">${esc(text)}</div>`; }

function render() {
  const c = $('#content');
  if (state.page === 'overview') c.innerHTML = renderOverview();
  else if (state.page === 'nodes') c.innerHTML = renderNodes();
  else if (state.page === 'tasks') c.innerHTML = renderTasks();
  else if (state.page === 'approvals') c.innerHTML = renderApprovals();
  else if (state.page === 'services') c.innerHTML = renderServices();
  else if (state.page === 'join') c.innerHTML = renderJoin();
  else if (state.page === 'backup') c.innerHTML = renderPlaceholder('备份恢复', '备份 dry-run、恢复点、恢复审批会集中在这里。', 'backup');
  else if (state.page === 'network') c.innerHTML = renderPlaceholder('网络 ACL', 'ACL plan、diff 预览、审批后 apply 入口。', 'lan');
  else if (state.page === 'components') c.innerHTML = renderPlaceholder('组件', 'HMN 控制面、worker、bridge、approval gateway 等组件状态入口。', 'widgets');
  else if (state.page === 'headscale') c.innerHTML = renderPlaceholder('Headscale 配置', 'Headscale policy、routes、DNS 与 ACL 配置审查入口。', 'vpn_lock');
  else if (state.page === 'docs') c.innerHTML = renderPlaceholder('文档中心', '服务文档与机器文档统一入口。可从服务页直达单个 docs_path。', 'description');
  else if (state.page === 'themes') c.innerHTML = renderThemes();
  else if (state.page === 'permissions') c.innerHTML = renderPermissions();
  else if (state.page === 'skills') c.innerHTML = renderPlaceholder('Hermes 技能', '技能清单、启用状态与运行约束会集中在这里。', 'psychology');
  else if (state.page === 'conversations') c.innerHTML = renderPlaceholder('Hermes 对话', 'Hermes 会话、任务上下文与审计记录入口。', 'forum');
  else if (state.page === 'platform') c.innerHTML = renderPlaceholder('平台配置', 'Provider、模型、Webhook、MCP 与系统配置入口。', 'tune');
  bindPageEvents();
}

function bindPageEvents() {
  const form = $('#task-form');
  if (form) form.addEventListener('submit', submitTask);
  ['#join-master', '#join-token', '#join-auto-confirm', '#join-auto-worker', '#join-exec'].forEach((s) => { const el = $(s); if (el) el.addEventListener('input', updateJoinCommand); });
  const copy = $('#copy-join');
  if (copy) copy.addEventListener('click', async () => { await navigator.clipboard.writeText($('#join-command').textContent); showToast('接入命令已复制'); });
  updateJoinCommand();
  bindThemeEvents();
}


function bindThemeEvents() {
  $$('[data-theme-choice]').forEach((btn) => btn.addEventListener('click', () => {
    applyTheme(btn.dataset.themeChoice);
    showToast(`已切换主题：${builtinThemes[state.theme].name}`);
    render();
  }));
  const upload = $('#theme-upload');
  if (upload) upload.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const pkg = parseThemePackage(await file.text());
      localStorage.setItem('hmn-custom-theme-css', pkg.css);
      localStorage.setItem('hmn-custom-theme-name', pkg.name);
      state.customThemeName = pkg.name;
      applyTheme('custom');
      showToast(`主题包已应用：${pkg.name}`);
      render();
    } catch (err) {
      showToast(`主题包无效：${err.message}`, 'danger');
    }
  });
  const reset = $('#reset-theme');
  if (reset) reset.addEventListener('click', () => {
    localStorage.removeItem('hmn-custom-theme-css');
    localStorage.removeItem('hmn-custom-theme-name');
    state.customThemeName = '';
    applyTheme('midnight');
    showToast('已恢复默认主题');
    render();
  });
  const exportBtn = $('#export-theme');
  if (exportBtn) exportBtn.addEventListener('click', async () => {
    const vars = ['--hmn-bg','--hmn-surface','--hmn-panel','--hmn-line','--hmn-primary','--hmn-accent','--hmn-text','--hmn-muted','--hmn-success','--hmn-warning','--hmn-danger'];
    const styles = getComputedStyle(document.documentElement);
    const payload = { name: builtinThemes[state.theme]?.name || state.theme, vars: Object.fromEntries(vars.map((v) => [v, styles.getPropertyValue(v).trim()])) };
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    showToast('当前主题变量已复制');
  });
}

function updateJoinCommand() {
  const out = $('#join-command');
  if (!out) return;
  const q = (v) => `'${String(v).replace(/'/g, `'\\''`)}'`;
  const master = ($('#join-master')?.value || location.origin).replace(/\/$/, '');
  const token = $('#join-token')?.value.trim() || '填入_HERMES_JOIN_TOKEN';
  out.textContent = `curl -fsSL ${q(`${master}/scripts/join.sh`)} | HMN_MASTER_URL=${q(master)} HERMES_JOIN_TOKEN=${q(token)} HERMES_AUTO_CONFIRM=${q($('#join-auto-confirm')?.value || '1')} HERMES_AUTO_INSTALL_WORKER=${q($('#join-auto-worker')?.value || '1')} HMN_ENABLE_EXEC=${q($('#join-exec')?.value || '1')} bash`;
}

async function submitTask(e) {
  e.preventDefault();
  const node_id = $('#task-node').value;
  const command = $('#task-command').value.trim();
  if (!node_id || !command) return showToast('请选择节点并填写命令', 'warning');
  try {
    const r = await api('/console/tasks', { method: 'POST', body: JSON.stringify({ node_id, command, created_by: 'hmn-web', executor: 'worker' }) });
    showToast(r.approval_id ? `已进入审批：${r.approval_id}` : `任务已下发：${r.task_id}`);
    await refresh({ silent: true });
    switchPage(r.approval_id ? 'approvals' : 'tasks');
  } catch (err) { showToast(`下发失败：${err.message}`, 'danger'); }
}

async function decideApproval(id, action) {
  try {
    await api(`/approvals/${encodeURIComponent(id)}/${action}`, { method: 'POST', body: JSON.stringify({ decided_by: 'hmn-web' }) });
    showToast(action === 'approve' ? '已允许' : '已取消');
    await refresh({ silent: true });
  } catch (err) { showToast(`审批失败：${err.message}`, 'danger'); }
}

$('#side-nav').addEventListener('click', (e) => { const btn = e.target.closest('[data-page]'); if (btn) { switchPage(btn.dataset.page); closeSidebar(); } });
document.body.addEventListener('click', async (e) => {
  const sw = e.target.closest('[data-switch]');
  const taskNode = e.target.closest('[data-task-node]');
  const copy = e.target.closest('[data-copy]');
  const approve = e.target.closest('[data-approve]');
  const reject = e.target.closest('[data-reject]');
  if (sw) { switchPage(sw.dataset.switch); closeSidebar(); }
  if (taskNode) { switchPage('tasks'); setTimeout(() => { const s = $('#task-node'); if (s) s.value = taskNode.dataset.taskNode; }, 0); }
  if (copy) { await navigator.clipboard.writeText(copy.dataset.copy); showToast('node_id 已复制'); }
  if (approve) decideApproval(approve.dataset.approve, 'approve');
  if (reject) decideApproval(reject.dataset.reject, 'reject');
});
$('#new-request').addEventListener('click', () => switchPage('tasks'));
$('#refresh-btn').addEventListener('click', () => refresh());
$('#mode-toggle').addEventListener('click', () => applyMode(state.mode === 'dark' ? 'light' : 'dark'));
$('#mobile-menu').addEventListener('click', () => document.body.classList.toggle('sidebar-open'));
$('#mobile-scrim').addEventListener('click', closeSidebar);
$('#search-input').addEventListener('input', (e) => { state.query = e.target.value; render(); });
window.addEventListener('hashchange', () => switchPage(location.hash.slice(1) || 'overview'));
applyMode(state.mode);
applyTheme(state.theme);

switchPage(location.hash.slice(1) || 'overview');
refresh({ silent: true });
setInterval(() => refresh({ silent: true }), 30000);
