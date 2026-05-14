const API_BASE = window.HMN_API_BASE || localStorage.getItem('hmnApiBase') || `${window.location.origin}/api/v1`;

const state = {
  page: 'overview',
  query: '',
  summary: { metrics: {}, nodes: [], tasks: [], approvals: [] },
  services: [],
  docs: { server_docs: [], service_docs: [] },
  version: {},
  joinPolicy: { auto_confirm: true, auto_install_worker: true, enable_exec: true, pending_visible: false, permission_bundle: 'observe_task' },
  theme: localStorage.getItem('hmn-theme') || 'midnight',
  mode: localStorage.getItem('hmn-mode') || 'dark',
  lang: localStorage.getItem('hmn-lang') || 'zh-CN',
  customThemeName: localStorage.getItem('hmn-custom-theme-name') || ''
};

const i18n = {
  'zh-CN': {
    overview:'总览', nodes:'节点', tasks:'任务', approvals:'审批', services:'服务资产', join:'接入节点', backup:'备份恢复', network:'网络 ACL', components:'组件', headscale:'Headscale 配置', docs:'文档中心', themes:'主题', permissions:'账户与权限', skills:'Hermes 技能', conversations:'Hermes 对话', platform:'平台配置',
    totalManaged:'已纳管节点', onlineWorker:'在线 Worker', runningTasks:'运行任务', pendingApprovals:'待审批', hiddenPending:'待接入隐藏', managed:'托管', nodeDistribution:'节点分布', taskPipeline:'任务流水线', viewAll:'查看全部', managedNodes:'托管节点', managedOnly:'仅托管',
    newTask:'New Task', node:'节点', command:'命令', dispatch:'下发', highRiskHint:'高风险命令会自动进入审批队列。', taskId:'Task ID', status:'Status', purpose:'用途', details:'脚本详情',
    language:'语言', refresh:'刷新', mode:'浅色/深色', search:'搜索节点、任务、服务…', copied:'已复制', joinNode:'接入节点',
    copyId:'复制 ID', dispatchTask:'下发任务', executing:'执行', heartbeat:'心跳', osUnknown:'未知系统'
  },
  en: {
    overview:'Overview', nodes:'Nodes', tasks:'Tasks', approvals:'Approvals', services:'Services', join:'Join Node', backup:'Backup', network:'Network ACL', components:'Components', headscale:'Headscale', docs:'Docs', themes:'Themes', permissions:'Accounts', skills:'Hermes Skills', conversations:'Conversations', platform:'Platform',
    totalManaged:'Managed Nodes', onlineWorker:'Online Worker', runningTasks:'Running Tasks', pendingApprovals:'Pending Approvals', hiddenPending:'pending hidden', managed:'Managed', nodeDistribution:'Node Distribution', taskPipeline:'Task Pipeline', viewAll:'View all', managedNodes:'Managed Nodes', managedOnly:'Managed only',
    newTask:'New Task', node:'Node', command:'Command', dispatch:'Dispatch', highRiskHint:'High-risk commands will be routed to approval automatically.', taskId:'Task ID', status:'Status', purpose:'Purpose', details:'Script details',
    language:'Language', refresh:'Refresh', mode:'Light/Dark', search:'Search nodes, tasks, services…', copied:'Copied', joinNode:'Join Node',
    copyId:'Copy ID', dispatchTask:'Dispatch Task', executing:'Executing', heartbeat:'Heartbeat', osUnknown:'Unknown OS'
  },
  ja: {
    overview:'概要', nodes:'ノード', tasks:'タスク', approvals:'承認', services:'サービス', join:'ノード接続', backup:'バックアップ', network:'ネットワーク ACL', components:'コンポーネント', headscale:'Headscale', docs:'ドキュメント', themes:'テーマ', permissions:'アカウント', skills:'Hermes スキル', conversations:'会話', platform:'平台設定',
    totalManaged:'管理済みノード', onlineWorker:'オンライン Worker', runningTasks:'実行中タスク', pendingApprovals:'承認待ち', hiddenPending:'接続待ち非表示', managed:'管理済み', nodeDistribution:'ノード分布', taskPipeline:'タスクパイプライン', viewAll:'すべて表示', managedNodes:'管理済みノード', managedOnly:'管理済みのみ',
    newTask:'新規タスク', node:'ノード', command:'コマンド', dispatch:'送信', highRiskHint:'高リスクコマンドは自動的に承認待ちになります。', taskId:'Task ID', status:'Status', purpose:'目的', details:'スクリプト詳細',
    language:'言語', refresh:'更新', mode:'ライト/ダーク', search:'ノード、タスク、サービスを検索…', copied:'コピーしました', joinNode:'ノード接続',
    copyId:'ID コピー', dispatchTask:'タスク送信', executing:'実行', heartbeat:'ハートビート', osUnknown:'不明な OS'
  },
  ko: {
    overview:'개요', nodes:'노드', tasks:'작업', approvals:'승인', services:'서비스', join:'노드 연결', backup:'백업', network:'네트워크 ACL', components:'컴포넌트', headscale:'Headscale', docs:'문서', themes:'테마', permissions:'계정', skills:'Hermes 스킬', conversations:'대화', platform:'플랫폼',
    totalManaged:'관리 노드', onlineWorker:'온라인 Worker', runningTasks:'실행 작업', pendingApprovals:'승인 대기', hiddenPending:'연결 대기 숨김', managed:'관리됨', nodeDistribution:'노드 분포', taskPipeline:'작업 파이프라인', viewAll:'전체 보기', managedNodes:'관리 노드', managedOnly:'관리만',
    newTask:'새 작업', node:'노드', command:'명령', dispatch:'전송', highRiskHint:'고위험 명령은 자동으로 승인 대기열로 이동합니다.', taskId:'Task ID', status:'Status', purpose:'목적', details:'스크립트 상세',
    language:'언어', refresh:'새로고침', mode:'라이트/다크', search:'노드, 작업, 서비스 검색…', copied:'복사됨', joinNode:'노드 연결',
    copyId:'ID 복사', dispatchTask:'작업 전송', executing:'실행', heartbeat:'하트비트', osUnknown:'알 수 없는 OS'
  }
};
const t = (key) => (i18n[state.lang] || i18n['zh-CN'])[key] || i18n['zh-CN'][key] || key;
const pageTitle = new Proxy({}, { get: (_, key) => t(key) });

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
const esc = (v) => String(v ?? '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c]);
const pct = (v) => Math.max(0, Math.min(100, Number(v) || 0));
const managedNodes = () => (state.summary.nodes || []).filter((n) => n.status === 'managed');
const filteredNodes = () => managedNodes().filter((n) => JSON.stringify(n).toLowerCase().includes(state.query.toLowerCase()));

const builtinThemes = {
  midnight: { name: 'Mac Glass', desc: 'macOS / visionOS 透明玻璃质感，随主题强调色变化。', accent: '#8f8cf8' },
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
    credentials: 'same-origin',
    ...options,
    headers: { accept: 'application/json', 'content-type': 'application/json', ...(options.headers || {}) }
  });
  if (res.status === 401) {
    if (!location.pathname.startsWith('/login')) location.href = '/login';
    throw new Error('login required');
  }
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try { const body = await res.json(); detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail || body); } catch {}
    throw new Error(detail);
  }
  return res.json();
}

async function ensureSession() {
  const res = await fetch(`${API_BASE}/session`, {
    credentials: 'same-origin',
    headers: { accept: 'application/json' }
  });
  if (res.status === 401) {
    location.href = '/login';
    return false;
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return true;
}

async function refresh({ silent = false } = {}) {
  try {
    const [summary, serviceResp, docsResp, versionResp, joinPolicyResp] = await Promise.all([
      api('/console/summary'),
      api('/console/services').catch(() => ({ services: [] })),
      api('/hmn-web/docs/index').catch(() => ({ server_docs: [], service_docs: [] })),
      api('/version').catch(() => ({})),
      api('/console/join-policy').catch(() => ({}))
    ]);
    state.summary = summary;
    state.services = serviceResp.services || [];
    state.docs = docsResp || { server_docs: [], service_docs: [] };
    state.version = versionResp || {};
    if (joinPolicyResp) state.joinPolicy = { ...state.joinPolicy, ...joinPolicyResp };
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

function normalizePage(page) {
  const raw = String(page || 'overview').replace(/^#/, '');
  return raw.split('/').filter(Boolean)[0] || 'overview';
}

function updateSearchPlaceholder() {
  const input = $('#search-input');
  if (!input) return;
  input.placeholder = state.page === 'docs'
    ? '模糊搜索文档、服务器、服务…'
    : t('search');
}

function syncDocsHeaderControls() {
  const topSearch = $('#top-search-shell');
  const topJoinButton = $('#top-join-button');
  const hideSearchOnDocs = state.page === 'docs';
  if (topSearch) {
    topSearch.hidden = hideSearchOnDocs;
    topSearch.style.display = hideSearchOnDocs ? 'none' : '';
  }
  if (topJoinButton) {
    topJoinButton.hidden = false;
    topJoinButton.style.display = '';
  }
}

function switchPage(page, options = {}) {
  const raw = String(page || 'overview').replace(/^#/, '');
  const nextPage = normalizePage(raw);
  state.page = nextPage;
  $$('.nav-item').forEach((b) => b.classList.toggle('active', b.dataset.page === state.page));
  $('#page-title').textContent = pageTitle[state.page] || 'HMN';
  updateSearchPlaceholder();
  syncDocsHeaderControls();
  const lang = $('#lang-select'); if (lang) lang.value = state.lang;
  if (!options.preserveHash && location.hash.slice(1) !== raw) location.hash = raw;
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
  const osLabel = nodeOsLabel(node);
  const cpuValue = Number(node.cpu ?? 0);
  const cpuSuffix = cpuValue > 0 ? '%' : ' load';
  return `<article class="card-soft p-4 space-y-4 ${node.live === 'offline' ? 'opacity-60' : ''}">
    <div class="flex items-start justify-between gap-3"><div><h3 class="font-mono text-sm font-bold text-white">${esc(node.name)}</h3><p class="font-mono text-xs text-muted">ID: ${esc(node.id)}</p></div>${liveChip(node)}</div>
    <div class="grid grid-cols-2 gap-3 border-y border-line py-3 text-sm"><div class="flex items-center gap-2"><span class="material-symbols-outlined text-[18px] text-muted">terminal</span><span>${esc(osLabel)}</span></div><div class="flex items-center justify-end gap-2"><span class="material-symbols-outlined text-[18px] text-muted">schedule</span><span>${esc(node.uptime || '-')}</span></div></div>
    <div class="space-y-3">
      ${stat('CPU', cpuValue > 0 ? cpuValue : Number(node.load ?? 0), cpuSuffix)}
      ${stat('RAM', node.memory)}
      ${stat('Disk', node.disk)}
    </div>
    <div class="flex items-center justify-between border-t border-line pt-3 font-mono text-[11px] text-muted"><span>${node.exec ? `${t('executing')}: worker enabled` : `${t('executing')}: disabled`}</span><span>${t('heartbeat')}: ${esc(node.hb || '-')}</span></div>
    <div class="flex gap-2"><button class="btn-secondary" data-task-node="${esc(node.id)}">${t('dispatchTask')}</button><button class="btn-secondary" data-copy="${esc(node.id)}">${t('copyId')}</button></div>
  </article>`;
}
function stat(label, value, suffix = '%') {
  const display = value ?? 0;
  return `<div><div class="mb-1 flex justify-between font-mono text-[11px] text-muted"><span>${label}</span><span>${esc(display)}${suffix}</span></div>${bar(value)}</div>`;
}

function renderOverview() {
  const m = state.summary.metrics || {};
  const nodes = managedNodes();
  const pending = (state.summary.approvals || []).filter((a) => a.status === 'pending');
  const online = nodes.filter((n) => n.live === 'online').length;
  const ring = Math.round((Number(m.managed_nodes || 0) / Math.max(1, Number(m.total_nodes || 1))) * 251);
  return `<div class="space-y-6">
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      ${metric(t('totalManaged'), m.managed_nodes ?? nodes.length, 'memory')}
      ${metric(t('onlineWorker'), online, 'cloud_done', `/ ${m.managed_nodes ?? nodes.length} ${t('managed')}`)}
      ${metric(t('runningTasks'), m.running_tasks ?? 0, 'task_alt')}
      ${metric(t('pendingApprovals'), m.pending_approvals ?? 0, 'warning', pending.length ? `${pending.length}` : '', Number(m.pending_approvals) > 0)}
      ${metric(t('hiddenPending'), m.pending_nodes ?? Math.max(0, Number(m.total_nodes || 0) - nodes.length), 'verified', t('hiddenPending'))}
    </div>
    <div class="grid grid-cols-12 gap-4">
      <section class="card p-6 col-span-12 lg:col-span-4"><h3 class="mb-6 flex items-center gap-2 text-lg font-semibold text-white"><span class="material-symbols-outlined text-primary">pie_chart</span>${t('nodeDistribution')}</h3><div class="relative mx-auto h-44 w-44"><svg class="ring h-44 w-44" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" class="text-muted/20" stroke-width="12"/><circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" class="text-primary" stroke-width="12" stroke-dasharray="${ring} 251"/></svg><div class="absolute inset-0 grid place-items-center text-center"><div><p class="text-xs text-muted">托管</p><p class="text-2xl font-bold text-white">${m.managed_nodes ?? 0}</p></div></div></div><div class="mt-5 grid grid-cols-2 gap-3 text-sm"><span class="text-primary">● 已纳管 (${m.managed_nodes ?? 0})</span><span class="text-warning">● 待接入 (${m.pending_nodes ?? 0})</span></div></section>
      <section class="card p-6 col-span-12 lg:col-span-8"><div class="mb-5 flex items-center justify-between"><h3 class="flex items-center gap-2 text-lg font-semibold text-white"><span class="material-symbols-outlined text-primary">rebase_edit</span>${t('taskPipeline')}</h3><button data-switch="tasks" class="text-sm text-primary hover:underline">${t('viewAll')}</button></div>${taskTable(state.summary.tasks || [])}</section>
    </div>
    <div class="grid grid-cols-12 gap-4"><section class="card p-6 col-span-12 lg:col-span-8"><div class="mb-5 flex items-center justify-between"><h3 class="text-lg font-semibold text-white">${t('managedNodes')}</h3><span class="status-chip chip-success">${t('managedOnly')}</span></div><div class="grid grid-cols-1 gap-4 xl:grid-cols-2">${nodes.slice(0, 4).map(nodeCard).join('') || empty('暂无 managed 节点')}</div></section><section class="card p-6 col-span-12 lg:col-span-4">${approvalPanel(pending)}</section></div>
  </div>`;
}


function commandSummary(command = '') {
  const c = String(command || '').trim();
  const lower = c.toLowerCase();
  if (!c) return '空命令';
  if (lower.includes('hermes --version') || lower.includes('hermes config path') || lower.includes('hermes chat')) return 'Hermes 版本、配置与聊天连通性探测';
  if (lower.includes('queue-ping')) return '队列连通性测试';
  if (lower.includes('install-runtime') || lower.includes('hermes-runtime')) return '安装 / 更新 Hermes runtime';
  if (lower.includes('install.sh') && lower.includes('curl')) return '下载安装脚本并执行节点初始化';
  if (lower.includes('pkill') || lower.includes('kill')) return '清理卡住的安装或运行进程';
  if (lower.includes('hostname') && lower.includes('uname')) return '采集节点系统与运行环境信息';
  if (lower.includes('systemctl')) return '管理 systemd 服务';
  if (lower.includes('rm -rf')) return '危险清理命令（需审批）';
  const first = c.split(/[;\n]/).map(x => x.trim()).find(Boolean) || c;
  return first.length > 64 ? `${first.slice(0, 64)}…` : first;
}
function shortTaskId(id = '') {
  const v = String(id || '');
  return v.length > 14 ? `…${v.slice(-12)}` : v;
}
function nodeOsLabel(node) {
  return node.os_release || node.distro || node.platform || node.os || t('osUnknown');
}
function firstText(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}
function approvalTaskName(a) {
  return firstText(a.task_name, a.title, a.name, a.action, commandSummary(a.command));
}
function approvalTaskDescription(a) {
  return firstText(
    a.task_description,
    a.description,
    a.summary,
    a.reason,
    a.command ? commandSummary(a.command) : '',
    [a.subject_type, a.subject_id].filter(Boolean).join(':')
  );
}
function approvalMetaLine(a) {
  return [a.subject_type && a.subject_id ? `${a.subject_type}:${a.subject_id}` : '', a.requested_by || '', a.created_at || '']
    .filter(Boolean)
    .join(' · ');
}
function docTitle(d) {
  return firstText(d.title, d.name, d.doc_name, d.slug, d.path, d.url, '未命名文档');
}
function docDescription(d) {
  return firstText(
    d.summary,
    d.description,
    d.purpose,
    d.excerpt,
    d.category_description,
    d.path,
    d.url,
    '点击查看知识库条目'
  );
}
function docCategory(d, fallback = '未分类') {
  return firstText(d.category, d.kind, d.group, d.section, d.doc_type, d.collection, fallback);
}
function docMetaValue(d, ...keys) {
  return firstText(...keys.map((key) => d?.[key]));
}
function docMetaParts(d, fallbackCategory = '未分类') {
  const parts = [
    docMetaValue(d, 'category', 'kind', 'group', 'section', 'doc_type', 'collection') || fallbackCategory,
    docMetaValue(d, 'path', 'relative_path', 'source_path', 'file', 'filepath'),
    docMetaValue(d, 'service_name', 'service', 'service_id'),
    docMetaValue(d, 'updated_at', 'mtime', 'modified_at')
  ];
  return parts.filter(Boolean);
}
function docMetaBadges(d, fallbackCategory = '未分类') {
  const raw = [
    docMetaValue(d, 'category', 'kind', 'group', 'section', 'doc_type', 'collection') || fallbackCategory,
    docMetaValue(d, 'path', 'relative_path'),
    docMetaValue(d, 'service_name', 'service'),
    docMetaValue(d, 'lang', 'language')
  ].filter(Boolean);
  const seen = new Set();
  return raw.filter((item) => {
    const key = String(item).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 4);
}
function docViewerUrl(d) {
  const direct = firstText(d.viewer_url, d.view_url);
  if (direct) return direct;
  const source = firstText(d.path, d.relative_path, d.source_path, d.url, d.file, d.slug, d.id);
  if (!source) return '/hmn-web/docs/view/';
  const normalized = String(source)
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/^\/hmn-web\/docs\/(?:view|file)\//, '')
    .replace(/^\/+/g, '');
  return `/hmn-web/docs/view/${normalized.split('/').map((part) => encodeURIComponent(part)).join('/')}`;
}
function docPathParts(d) {
  return firstText(d.path, d.relative_path, d.source_path, d.file, d.filepath).split('/').filter(Boolean);
}
function docScopeInfo(d) {
  const parts = docPathParts(d);
  if (parts[0] === 'docs' && parts[1] === 'server') {
    return {
      scope: 'server',
      key: parts[2] || 'unknown',
      label: parts[2] || '未命名机器',
      leaf: parts.slice(3).join('/') || parts.at(-1) || docTitle(d)
    };
  }
  if (parts[0] === 'service') {
    return {
      scope: 'service',
      key: parts[1] || 'service',
      label: parts[1] || '服务文档',
      leaf: parts.slice(2).join('/') || parts.at(-1) || docTitle(d)
    };
  }
  return {
    scope: docCategory(d, 'docs'),
    key: parts[0] || 'docs',
    label: parts[0] || '其他文档',
    leaf: parts.slice(1).join('/') || docTitle(d)
  };
}
function docCard(d, sectionTitle) {
  const title = docTitle(d);
  const description = docDescription(d);
  const category = docCategory(d, sectionTitle);
  const metaParts = docMetaParts(d, sectionTitle);
  const badges = docMetaBadges(d, sectionTitle);
  const scopeInfo = docScopeInfo(d);
  const pathLabel = docMetaValue(d, 'path', 'relative_path', 'source_path', 'url', 'viewer_url', 'view_url') || docViewerUrl(d);
  const metaLine = metaParts.join(' · ');
  return `<a class="doc-card group flex h-full min-w-0 flex-col gap-4 rounded-3xl border border-line bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-[0_24px_80px_rgba(67,97,238,0.16)]" href="${esc(docViewerUrl(d))}"><div class="flex items-start justify-between gap-3"><div class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20"><span class="material-symbols-outlined">library_books</span></div><span class="status-chip chip-success shrink-0">${esc(category)}</span></div><div class="min-w-0 space-y-3"><div class="min-w-0 space-y-2"><b class="block break-words text-base leading-6 text-white group-hover:text-primary">${esc(title)}</b><p class="line-clamp-3 break-words text-sm leading-6 text-muted">${esc(description)}</p></div><div class="flex flex-wrap gap-2">${badges.map((badge) => `<span class="max-w-full truncate rounded-full border border-line bg-white/[0.03] px-3 py-1 text-[11px] font-medium tracking-wide text-muted">${esc(badge)}</span>`).join('')}</div></div><div class="mt-auto min-w-0 space-y-3 border-t border-line pt-3"><p class="truncate text-xs leading-5 text-muted" title="${esc(metaLine)}">${esc(metaLine)}</p><div class="doc-card-footer flex items-center gap-3 text-xs text-muted"><div class="min-w-0 flex-1"><p class="truncate font-semibold text-white/90" title="${esc(scopeInfo.label)}">${esc(scopeInfo.label)}</p><p class="truncate font-mono" title="${esc(pathLabel)}">${esc(pathLabel)}</p></div><span class="doc-card-action inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary">查看<span class="material-symbols-outlined text-[16px]">arrow_forward</span></span></div></div></a>`;
}
function groupDocsByScope(docs = [], fallbackTitle = '文档') {
  const filtered = (docs || []).filter((d) => JSON.stringify(d).toLowerCase().includes(state.query.toLowerCase()));
  const groups = new Map();
  for (const doc of filtered) {
    const info = docScopeInfo(doc);
    const key = `${info.scope}:${info.key}`;
    if (!groups.has(key)) groups.set(key, { ...info, docs: [] });
    groups.get(key).docs.push(doc);
  }
  return Array.from(groups.values())
    .sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'))
    .map((group) => ({
      ...group,
      title: group.label,
      description: firstText(group.docs[0]?.summary, `${fallbackTitle} · ${group.docs.length} 篇文档`),
      count: group.docs.length
    }));
}
function docGroupCard(group) {
  const href = `#docs/${encodeURIComponent(group.scope)}/${encodeURIComponent(group.key)}`;
  const sample = group.docs.slice(0, 3).map((doc) => `<li class="truncate" title="${esc(docTitle(doc))}">${esc(docTitle(doc))}</li>`).join('');
  return `<a class="doc-card group flex h-full min-w-0 flex-col gap-4 rounded-3xl border border-line bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-[0_24px_80px_rgba(67,97,238,0.16)]" href="${href}"><div class="flex items-start justify-between gap-3"><div class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20"><span class="material-symbols-outlined">folder_managed</span></div><span class="status-chip chip-running shrink-0">${esc(group.count)} 篇</span></div><div class="min-w-0 space-y-2"><b class="block break-words text-base leading-6 text-white group-hover:text-primary">${esc(group.title)}</b><p class="line-clamp-3 break-words text-sm leading-6 text-muted">${esc(group.description)}</p></div><ul class="min-w-0 space-y-1 text-sm text-muted">${sample || '<li>暂无文档</li>'}</ul><div class="doc-card-footer mt-auto border-t border-line pt-3"><div class="min-w-0 flex-1"><p class="truncate font-mono text-xs text-muted">${esc(group.scope)} · ${esc(group.key)}</p></div><span class="doc-card-action inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary">进入<span class="material-symbols-outlined text-[16px]">arrow_forward</span></span></div></a>`;
}
function findDocGroup(scope, key) {
  const source = scope === 'service' ? state.docs.service_docs : state.docs.server_docs;
  return groupDocsByScope(source, scope === 'service' ? '服务文档' : '机器文档').find((group) => group.scope === scope && group.key === key);
}
function docsPageState() {
  const raw = location.hash.replace(/^#/, '');
  const parts = raw.split('/').filter(Boolean);
  if (parts[0] !== 'docs' || parts.length < 3) return null;
  return { scope: decodeURIComponent(parts[1] || ''), key: decodeURIComponent(parts[2] || '') };
}

function taskTable(tasks) {
  if (!tasks.length) return empty('暂无任务');
  return `<div class="table-wrap task-table-wrap"><table class="task-table w-full border-collapse text-sm"><thead><tr><th class="px-4 py-2 text-left text-[11px] uppercase tracking-wider text-muted">${t('taskId')}</th><th class="px-4 py-2 text-left text-[11px] uppercase tracking-wider text-muted">${t('node')}</th><th class="px-4 py-2 text-left text-[11px] uppercase tracking-wider text-muted">${t('purpose')}</th><th class="px-4 py-2 text-left text-[11px] uppercase tracking-wider text-muted">${t('status')}</th></tr></thead><tbody>${tasks.map((row) => { const summary = commandSummary(row.command); return `<tr class="table-row border-t border-line"><td class="px-4 py-3 font-mono text-xs" title="${esc(row.id)}">${esc(shortTaskId(row.id))}</td><td class="px-4 py-3">${esc(row.node_name || row.node_id)}</td><td class="px-4 py-3"><div class="font-medium text-white">${esc(summary)}</div><details class="mt-1 command-details"><summary>${t('details')}</summary><pre class="command-full">${esc(row.command)}</pre></details></td><td class="px-4 py-3">${taskStatusChip(row.status)}</td></tr>`; }).join('')}</tbody></table></div>`;
}

function pageHeader(title, desc, icon = 'dashboard', chip = '') {
  return `<div class="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p class="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-primary"><span class="material-symbols-outlined text-[18px]">${icon}</span> HMN Console</p><h2 class="text-2xl font-bold text-white">${esc(title)}</h2>${desc ? `<p class="mt-2 max-w-3xl text-sm text-muted">${esc(desc)}</p>` : ''}</div>${chip}</div>`;
}

function approvalPanel(approvals) {
  return `<h3 class="mb-5 flex items-center gap-2 text-lg font-semibold text-white"><span class="material-symbols-outlined text-danger">gavel</span>待审批</h3><div class="space-y-3">${approvals.length ? approvals.map(approvalCard).join('') : empty('暂无待审批动作')}</div>`;
}
function approvalCard(a) {
  const taskName = approvalTaskName(a);
  const taskDesc = approvalTaskDescription(a);
  const meta = approvalMetaLine(a);
  return `<div class="rounded-lg border-l-2 ${a.risk === 'medium' ? 'border-warning' : 'border-danger'} bg-[#1d1b20] p-4"><div class="mb-2 flex items-start justify-between gap-3">${riskChip(a.risk)}<span class="font-mono text-[10px] text-muted">${esc(a.id)}</span></div><p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/90">任务名称</p><p class="mt-1 font-medium text-white">${esc(taskName)}</p><p class="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/70">任务描述</p><p class="mt-1 text-sm leading-6 text-muted">${esc(taskDesc)}</p><p class="mt-3 font-mono text-[11px] text-muted">${esc(meta)}</p><div class="mt-4 flex gap-2"><button class="btn-primary flex-1" data-approve="${esc(a.id)}">允许</button><button class="btn-secondary flex-1" data-reject="${esc(a.id)}">取消</button></div></div>`;
}

function renderNodes() {
  const nodes = filteredNodes();
  const online = nodes.filter((n) => n.live === 'online').length;
  const stale = nodes.filter((n) => n.live === 'stale').length;
  return `<div class="space-y-6">${pageHeader('Managed Nodes', `${online} Active · ${stale} Stale · ${nodes.length - online - stale} Offline`, 'developer_board', '<span class="status-chip chip-success">仅托管</span>')}<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">${nodes.map(nodeCard).join('') || empty('没有匹配的 managed 节点')}</div></div>`;
}

function renderTasks() {
  const opts = managedNodes().map((n) => `<option value="${esc(n.id)}">${esc(n.name)} · ${esc(n.id)}</option>`).join('');
  return `<div class="space-y-6"><section class="card p-6"><div class="mb-4 flex flex-wrap items-center justify-between gap-3"><h3 class="text-lg font-semibold text-white">${t('newTask')}</h3><span class="status-chip chip-running">${t('managedOnly')}</span></div><form id="task-form" class="task-form grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]"><label class="field">${t('node')}<select id="task-node">${opts || '<option value="">暂无 managed 节点</option>'}</select></label><label class="field">${t('command')}<input id="task-command" value="uptime" /></label><button class="btn-primary task-submit" type="submit">${t('dispatch')}</button></form><p class="mt-3 text-sm text-muted">${t('highRiskHint')}</p></section><section class="card p-6"><h3 class="mb-4 text-lg font-semibold text-white">${t('taskPipeline')}</h3>${taskTable(state.summary.tasks || [])}</section></div>`;
}

function renderApprovals() {
  const approvals = state.summary.approvals || [];
  return `<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">${approvals.length ? approvals.map((a) => `<div class="card p-5"><div class="mb-3 flex items-start justify-between gap-3">${riskChip(a.risk)}${taskStatusChip(a.status)}</div><p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/90">任务名称</p><h3 class="mt-1 font-semibold text-white">${esc(approvalTaskName(a))}</h3><p class="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/70">任务描述</p><p class="mt-1 text-sm leading-6 text-muted">${esc(approvalTaskDescription(a))}</p><p class="mt-3 font-mono text-xs text-muted">${esc(approvalMetaLine(a))}<br>${esc(a.id)}</p>${a.status === 'pending' ? `<div class="mt-5 flex gap-2"><button class="btn-primary flex-1" data-approve="${esc(a.id)}">允许</button><button class="btn-danger flex-1" data-reject="${esc(a.id)}">取消</button></div>` : ''}</div>`).join('') : empty('暂无审批记录')}</div>`;
}

function serviceBadge(category, bucket) {
  const cls = bucket === 'main' ? 'chip-success' : bucket === 'pending' ? 'chip-warning' : 'chip-offline';
  return `<span class="status-chip ${cls}">${esc(category || bucket || 'pending')}</span>`;
}
function serviceFacts(s) {
  const parts = [];
  if (s.project_name) parts.push(`项目 ${s.project_name}`);
  if (s.business_name && s.business_name !== s.name) parts.push(`业务 ${s.business_name}`);
  if (s.business_purpose) parts.push(`用途 ${s.business_purpose}`);
  if (s.reverse_proxy_domains?.length) parts.push(`反代 ${s.reverse_proxy_domains.join(', ')}`);
  if (s.docs_path) parts.push(`文档 ${s.docs_path}`);
  if (s.backup_status) parts.push(`备份 ${s.backup_status}`);
  return parts;
}
function serviceWhyList(s) {
  const why = Array.isArray(s.why_asset) ? s.why_asset : [];
  return why.length ? why.slice(0, 4).map((item) => `<li class="truncate">${esc(item)}</li>`).join('') : '<li>暂无说明</li>';
}
function serviceDetailHtml(s) {
  const facts = serviceFacts(s);
  const domains = (s.domains || []).length ? s.domains : [];
  const ports = (s.ports || []).length ? s.ports : [];
  const tags = Array.isArray(s.tags) ? s.tags : [];
  return `<div class="space-y-4 text-sm text-muted"><div class="grid gap-3 sm:grid-cols-2"><div class="card-soft p-4"><p class="text-xs uppercase tracking-[0.18em] text-muted">资产分层</p><p class="mt-2 text-lg font-semibold text-white">${esc(s.asset_category || '未分类')}</p><p class="mt-1 text-xs text-muted">bucket: ${esc(s.asset_bucket || 'pending')} · score: ${esc(s.asset_score ?? 0)}</p></div><div class="card-soft p-4"><p class="text-xs uppercase tracking-[0.18em] text-muted">为什么是资产</p><ul class="mt-2 space-y-1 text-sm text-muted">${serviceWhyList(s)}</ul></div></div><div class="rounded-2xl border border-line bg-white/[0.02] p-4"><p class="text-xs uppercase tracking-[0.18em] text-muted">业务字段</p><div class="mt-3 flex flex-wrap gap-2">${facts.map((fact) => `<span class="rounded-full border border-line bg-white/[0.03] px-3 py-1 text-[11px] text-muted">${esc(fact)}</span>`).join('') || '<span>暂无业务字段</span>'}</div></div><div class="grid gap-3 sm:grid-cols-2"><div class="rounded-2xl border border-line bg-white/[0.02] p-4"><p class="text-xs uppercase tracking-[0.18em] text-muted">域名 / 反代</p><div class="mt-2 flex flex-wrap gap-2">${domains.map((d) => `<a class="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary hover:underline" href="https://${esc(d)}" target="_blank">${esc(d)}</a>`).join('') || '<span>暂无</span>'}</div></div><div class="rounded-2xl border border-line bg-white/[0.02] p-4"><p class="text-xs uppercase tracking-[0.18em] text-muted">端口 / 标签</p><div class="mt-2 flex flex-wrap gap-2">${ports.map((p) => `<span class="rounded-full border border-line bg-white/[0.03] px-3 py-1 text-[11px] text-muted">${esc(p)}</span>`).join('') || '<span>暂无</span>'}${tags.map((tag) => `<span class="rounded-full border border-line bg-white/[0.03] px-3 py-1 text-[11px] text-muted">#${esc(tag)}</span>`).join('')}</div></div></div><div class="rounded-2xl border border-line bg-white/[0.02] p-4"><p class="text-xs uppercase tracking-[0.18em] text-muted">定位信息</p><div class="mt-2 grid gap-1 text-xs text-muted"><div>项目：${esc(s.project_name || '-')}</div><div>业务：${esc(s.business_name || s.name)}</div><div>用途：${esc(s.business_purpose || '-')}</div><div>文档：${s.docs_path ? esc(s.docs_path) : '-'}</div><div>备份：${esc(s.backup_status || '-')}</div></div></div></div>`;
}
function ensureServiceSheet() {
  let sheet = $('#service-sheet');
  if (sheet) return sheet;
  sheet = document.createElement('div');
  sheet.id = 'service-sheet';
  sheet.className = 'service-sheet fixed inset-0 z-50 hidden items-end justify-center bg-black/45 p-4 backdrop-blur-sm md:items-center';
  sheet.innerHTML = `<div class="absolute inset-0" data-service-sheet-close></div><section class="relative w-full max-w-3xl overflow-hidden rounded-[28px] border border-line bg-[var(--hmn-panel-solid)] shadow-[0_30px_80px_rgba(0,0,0,0.38)]"><div class="flex items-start justify-between gap-3 border-b border-line p-5"><div class="min-w-0"><p class="text-xs font-bold uppercase tracking-[0.22em] text-primary">服务详情</p><h3 id="service-sheet-title" class="mt-2 truncate text-xl font-semibold text-white"></h3><p id="service-sheet-subtitle" class="mt-1 text-sm text-muted"></p></div><button class="icon-btn" data-service-sheet-close aria-label="关闭"><span class="material-symbols-outlined">close</span></button></div><div id="service-sheet-body" class="max-h-[78vh] overflow-auto p-5"></div></section>`;
  document.body.appendChild(sheet);
  return sheet;
}
function openServiceSheet(serviceId) {
  const s = (state.services || []).find((item) => item.service_id === serviceId || item.name === serviceId);
  if (!s) return showToast('未找到服务详情', 'warning');
  const sheet = ensureServiceSheet();
  const title = $('#service-sheet-title', sheet);
  const subtitle = $('#service-sheet-subtitle', sheet);
  const body = $('#service-sheet-body', sheet);
  if (title) title.textContent = s.name || s.service_id;
  if (subtitle) subtitle.textContent = `${s.service_id || '-'} · ${s.node_id || '-'} · ${s.kind || 'unknown'}`;
  if (body) body.innerHTML = serviceDetailHtml(s);
  sheet.classList.remove('hidden');
  sheet.classList.add('flex');
}
function closeServiceSheet() {
  const sheet = $('#service-sheet');
  if (!sheet) return;
  sheet.classList.add('hidden');
  sheet.classList.remove('flex');
}
function renderServices() {
  const services = (state.services || []).filter((s) => JSON.stringify(s).toLowerCase().includes(state.query.toLowerCase()));
  const main = services.filter((s) => (s.asset_bucket || s.asset_category) === 'main');
  const pending = services.filter((s) => (s.asset_bucket || s.asset_category) === 'pending');
  const system = services.filter((s) => (s.asset_bucket || s.asset_category) === 'system');
  const countLabel = (items) => `${items.length} 项`;
  const card = (s) => {
    const score = Number(s.asset_score || 0);
    const bucket = s.asset_bucket || (score >= 50 ? 'main' : score >= 20 ? 'pending' : 'system');
    const category = s.asset_category || '未分类';
    const facts = serviceFacts(s);
    const domains = (s.domains || []).slice(0, 3);
    const tags = Array.isArray(s.tags) ? s.tags : [];
    return `<article class="service-card card flex h-full min-h-[280px] flex-col p-5"><div class="flex items-start justify-between gap-3"><div class="min-w-0"><h3 class="truncate font-semibold text-white">${esc(s.name)}</h3><p class="mt-2 font-mono text-xs text-muted">${esc(s.service_id)} · ${esc(s.kind || 'unknown')} · ${esc(s.node_id || '-')}</p></div><div class="flex shrink-0 flex-col items-end gap-2">${serviceBadge(category, bucket)}<span class="status-chip chip-running">${score} 分</span></div></div><div class="mt-4 flex flex-wrap gap-2">${facts.map((fact) => `<span class="rounded-full border border-line bg-white/[0.03] px-3 py-1 text-[11px] text-muted">${esc(fact)}</span>`).join('') || '<span class="rounded-full border border-line bg-white/[0.03] px-3 py-1 text-[11px] text-muted">暂无业务字段</span>'}</div><div class="mt-4 grid gap-3 text-sm text-muted"><div class="flex flex-wrap gap-2">${domains.map((d) => `<a class="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary hover:underline" href="https://${esc(d)}" target="_blank">${esc(d)}</a>`).join('') || '<span>-</span>'}</div><div class="rounded-2xl border border-line bg-white/[0.02] p-3"><p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">为什么是资产</p><ul class="mt-2 space-y-1 text-sm text-muted">${serviceWhyList(s)}</ul></div>${tags.length ? `<div class="flex flex-wrap gap-2">${tags.slice(0, 4).map((tag) => `<span class="rounded-full border border-line bg-white/[0.03] px-3 py-1 text-[11px] text-muted">#${esc(tag)}</span>`).join('')}</div>` : ''}</div><div class="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4"><div class="min-w-0 text-xs text-muted">${s.docs_path ? `<span class="truncate">文档：${esc(s.docs_path)}</span>` : '<span>暂无文档路径</span>'}</div><div class="flex gap-2"><button class="btn-secondary" data-service-detail="${esc(s.service_id)}">详情</button>${s.docs_path ? `<a class="btn-secondary" href="/hmn-web/docs/file/${encodeURIComponent(s.docs_path)}" target="_blank">文档</a>` : ''}</div></div></article>`;
  };
  return `<div class="space-y-6">
    ${pageHeader('服务资产', '主视图只放真正业务资产；候选保留待确认；系统资产折叠。', 'dns')}
    <section class="card p-6"><div class="grid gap-3 sm:grid-cols-3"><div class="card-soft p-4"><p class="text-xs uppercase tracking-[0.18em] text-muted">主视图</p><p class="mt-2 text-2xl font-bold text-white">${main.length}</p></div><div class="card-soft p-4"><p class="text-xs uppercase tracking-[0.18em] text-muted">待确认</p><p class="mt-2 text-2xl font-bold text-white">${pending.length}</p></div><div class="card-soft p-4"><p class="text-xs uppercase tracking-[0.18em] text-muted">系统资产</p><p class="mt-2 text-2xl font-bold text-white">${system.length}</p></div></div><p class="mt-4 text-sm text-muted">人工标记优先，manual_business_asset 会强制进入主视图。</p></section>
    ${main.length ? `<section class="card p-6"><div class="mb-5 flex items-center justify-between gap-3"><div><h3 class="text-lg font-semibold text-white">业务资产主视图</h3><p class="mt-1 text-sm text-muted">真正承载业务的服务。</p></div><span class="status-chip chip-success">${countLabel(main)}</span></div><div class="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">${main.map(card).join('')}</div></section>` : ''}
    ${pending.length ? `<section class="card p-6"><div class="mb-5 flex items-center justify-between gap-3"><div><h3 class="text-lg font-semibold text-white">待确认发现项</h3><p class="mt-1 text-sm text-muted">有一定业务特征，但还没完全确认。</p></div><span class="status-chip chip-warning">${countLabel(pending)}</span></div><div class="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">${pending.map(card).join('')}</div></section>` : ''}
    ${system.length ? `<section class="card p-6"><div class="mb-5 flex items-center justify-between gap-3"><div><h3 class="text-lg font-semibold text-white">系统资产</h3><p class="mt-1 text-sm text-muted">系统服务、监控探针、localhost-only 等。</p></div><span class="status-chip chip-offline">${countLabel(system)}</span></div><div class="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">${system.map(card).join('')}</div></section>` : ''}
    ${!services.length ? empty('暂无服务资产') : ''}
  </div>`;
}

function renderJoin() {
  const policy = state.joinPolicy || {};
  const selected = (key, value) => String(policy[key]) === String(value) ? 'selected' : '';
  const enabled = (key) => policy[key] !== false;
  return `<div class="grid gap-6 xl:grid-cols-[1fr_420px]">
    <section class="card p-6">
      <div class="flex flex-wrap items-start justify-between gap-3"><div><h3 class="text-lg font-semibold text-white">接入节点</h3><p class="mt-2 text-sm text-muted">填写节点名字，自动生成接入令牌，然后复制命令到目标服务器执行。</p></div><button id="generate-join-token" class="btn-secondary" type="button">生成令牌</button></div>
      <div class="mt-5 grid gap-4 md:grid-cols-2">
        <label class="field">主控地址<input id="join-master" value="${esc(location.origin)}" /></label>
        <label class="field">节点名字<input id="join-node-name" placeholder="例如：d2-worker-01" /></label>
        <label class="field md:col-span-2">接入令牌<input id="join-token" placeholder="点击生成令牌" readonly /></label>
        <label class="field">注册后状态<select id="join-auto-confirm"><option value="1" ${enabled('auto_confirm') ? 'selected' : ''}>直接纳管</option><option value="0" ${!enabled('auto_confirm') ? 'selected' : ''}>等待确认</option></select></label>
        <label class="field">安装 Worker<select id="join-auto-worker"><option value="1" ${enabled('auto_install_worker') ? 'selected' : ''}>自动安装</option><option value="0" ${!enabled('auto_install_worker') ? 'selected' : ''}>只注册节点</option></select></label>
        <label class="field">执行能力<select id="join-exec"><option value="1" ${enabled('enable_exec') ? 'selected' : ''}>允许执行任务</option><option value="0" ${!enabled('enable_exec') ? 'selected' : ''}>只上报心跳</option></select></label>
      </div>
      <pre id="join-command" class="codebox mt-5"></pre>
      <div class="mt-4 flex flex-wrap gap-2"><button id="copy-join" class="btn-primary">复制命令</button><a class="btn-secondary" href="/scripts/join.sh" target="_blank">查看脚本</a></div>
    </section>
    <section class="card p-6"><h3 class="font-semibold text-white">默认策略</h3><form id="join-policy-form" class="mt-4 grid gap-4">
      <label class="field">注册后状态<select id="policy-auto-confirm"><option value="true" ${selected('auto_confirm', true)}>直接纳管</option><option value="false" ${selected('auto_confirm', false)}>等待确认</option></select></label>
      <label class="field">权限组合<select id="policy-permission-bundle"><option value="observe_task" ${selected('permission_bundle', 'observe_task')}>观察 + 任务</option><option value="observe" ${selected('permission_bundle', 'observe')}>仅观察</option><option value="none" ${selected('permission_bundle', 'none')}>不授予</option></select></label>
      <label class="field">Worker 定时器<select id="policy-auto-worker"><option value="true" ${selected('auto_install_worker', true)}>自动写入</option><option value="false" ${selected('auto_install_worker', false)}>不自动安装</option></select></label>
      <label class="field">执行能力<select id="policy-enable-exec"><option value="true" ${selected('enable_exec', true)}>允许执行任务</option><option value="false" ${selected('enable_exec', false)}>只上报心跳</option></select></label>
      <label class="field">待确认节点<select id="policy-pending-visible"><option value="false" ${selected('pending_visible', false)}>不进入主视图</option><option value="true" ${selected('pending_visible', true)}>显示在主视图</option></select></label>
      <button class="btn-primary" type="submit">保存策略</button>
    </form></section>
  </div>`;
}


function nodeOptions(selected = '') {
  const opts = managedNodes().map((n) => `<option value="${esc(n.id)}" ${n.id === selected ? 'selected' : ''}>${esc(n.name)} · ${esc(n.id)}</option>`).join('');
  return opts || '<option value="">暂无 managed 节点</option>';
}
function jsonBox(id, text = '等待操作结果…') {
  return `<pre id="${esc(id)}" class="codebox mt-4 result-box">${esc(text)}</pre>`;
}
function renderBackup() {
  return `<div class="space-y-6">
    ${pageHeader('备份恢复', '1.1 操作台：先生成备份计划 / 恢复请求，危险动作仍走审批。', 'backup', '<span class="status-chip chip-running">PLAN FIRST</span>')}
    <div class="grid gap-6 xl:grid-cols-2">
      <section class="card p-6"><h3 class="text-lg font-semibold text-white">创建备份计划</h3><p class="mt-2 text-sm text-muted">选择节点和备份目标，提交后由 HMN 生成可审计的 plan。</p><form id="backup-plan-form" class="mt-5 grid gap-4"><label class="field">节点<select id="backup-node">${nodeOptions()}</select></label><label class="field">备份目标<input id="backup-target" placeholder="/srv/files/backups 或 rclone:remote/path" value="/srv/files/backups" /></label><button class="btn-primary" type="submit">生成备份计划</button></form>${jsonBox('backup-plan-result')}</section>
      <section class="card p-6"><h3 class="text-lg font-semibold text-white">恢复请求</h3><p class="mt-2 text-sm text-muted">恢复属于高风险动作。Web 只发起请求，后端按策略进入审批。</p><form id="restore-run-form" class="mt-5 grid gap-4"><label class="field">节点<select id="restore-node">${nodeOptions()}</select></label><label class="field">Backup ID<input id="restore-backup-id" placeholder="填入备份 ID" /></label><button class="btn-danger" type="submit">发起恢复审批</button></form>${jsonBox('restore-run-result')}</section>
    </div>
  </div>`;
}
function renderNetwork() {
  const sample = '# Headscale / HMN ACL plan\nallow: operator -> managed:*\ndeny: public -> control-plane';
  return `<div class="space-y-6">
    ${pageHeader('网络 ACL', '提交 ACL 草案，查看 diff / risk / approval routing，不直接改线上网络。', 'lan', '<span class="status-chip chip-warning">DRY RUN</span>')}
    <section class="card p-6"><form id="acl-plan-form" class="grid gap-4"><label class="field">ACL 草案<textarea id="acl-proposed" rows="10">${esc(sample)}</textarea></label><button class="btn-primary" type="submit">生成 ACL Plan</button></form>${jsonBox('acl-plan-result')}</section>
  </div>`;
}
function renderComponents() {
  const components = [
    ['master', 'HMN Master API', '控制面 API、审计、节点注册与 console 聚合。'],
    ['worker', 'HMN Worker', '节点侧轮询、任务执行、heartbeat facts。'],
    ['approval-gateway', 'Approval Gateway', 'Telegram 审批卡片与回调分发。'],
    ['bridge', 'Worker Bridge', '主控到 worker 的队列 / webhook / fallback 通道。']
  ];
  return `<div class="space-y-6">
    ${pageHeader('组件', '对 HMN 关键组件执行 plan / restart / status 类动作。默认先 plan，run 仍由后端风险策略控制。', 'widgets')}
    <div class="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">${components.map(([id,name,desc]) => `<section class="component-card card flex h-full min-h-[320px] flex-col p-5 lg:min-h-[300px]"><div class="flex items-start justify-between gap-3"><div class="min-w-0 flex-1"><h3 class="truncate font-semibold text-white">${esc(name)}</h3><p class="mt-2 line-clamp-2 text-sm text-muted">${esc(desc)}</p></div><span class="shrink-0 rounded-full border border-line/80 bg-white/5 px-2.5 py-1 font-mono text-[10px] text-muted">${esc(id)}</span></div><div class="mt-4 grid flex-1 content-start gap-3"><label class="field">节点<select data-component-node="${esc(id)}">${nodeOptions()}</select></label><label class="field">动作<input data-component-action="${esc(id)}" value="status" /></label></div><div class="mt-auto grid shrink-0 grid-cols-2 gap-2 pt-4"><button class="btn-secondary" data-component-plan="${esc(id)}">Plan</button><button class="btn-primary" data-component-run="${esc(id)}">Run</button></div></section>`).join('')}</div>${jsonBox('component-result')}
  </div>`;
}
function docList(title, docs) {
  const items = (docs || []).filter((d) => JSON.stringify(d).toLowerCase().includes(state.query.toLowerCase()));
  return `<section class="card p-6"><div class="mb-5 flex items-center justify-between"><div><h3 class="text-lg font-semibold text-white">${esc(title)}</h3><p class="mt-1 text-sm text-muted">用途摘要 + 分类元信息并列展示，更接近知识库浏览体验。</p></div><span class="status-chip chip-running">${items.length}</span></div><div class="doc-grid grid gap-4 md:grid-cols-2">${items.map((d) => docCard(d, title)).join('') || empty('没有匹配文档')}</div></section>`;
}
function docGroupList(title, docs, emptyText = '没有匹配分组') {
  const groups = groupDocsByScope(docs, title);
  return `<section class="card p-6"><div class="mb-5 flex items-center justify-between gap-3"><div><h3 class="text-lg font-semibold text-white">${esc(title)}</h3><p class="mt-1 text-sm text-muted">先按机器 / 服务分组，再进入具体文档。</p></div><span class="status-chip chip-running">${groups.length} 组</span></div><div class="doc-grid grid gap-4 md:grid-cols-2">${groups.map((group) => docGroupCard(group)).join('') || empty(emptyText)}</div></section>`;
}
function renderDocGroup(scope, key) {
  const group = findDocGroup(scope, key);
  const label = scope === 'service' ? '服务文档' : '机器文档';
  if (!group) {
    return `<div class="space-y-6">${pageHeader('文档中心', '未找到对应分组，可能已被搜索条件过滤。', 'description', `<a class="btn-secondary" href="#docs">返回文档中心</a>`)}${empty('没有找到对应分组')}</div>`;
  }
  return `<div class="space-y-6">${pageHeader(group.title, `${label} · ${group.count} 篇文档`, 'folder_managed', `<div class="flex flex-wrap gap-2"><a class="btn-secondary" href="#docs">返回分组</a><a class="btn-secondary" href="/hmn-web/docs/" target="_blank">文件索引</a></div>`)}<section class="card p-6"><div class="mb-5 flex items-center justify-between gap-3"><div><h3 class="text-lg font-semibold text-white">${esc(group.title)}</h3><p class="mt-1 text-sm text-muted">${esc(group.description)}</p></div><span class="status-chip chip-success">${esc(group.count)} 篇</span></div><div class="doc-grid grid gap-4 md:grid-cols-2">${group.docs.map((d) => docCard(d, label)).join('')}</div></section></div>`;
}
function renderDocs() {
  const selected = docsPageState();
  if (selected) return renderDocGroup(selected.scope, selected.key);
  const query = state.query.trim();
  const searchHref = `/hmn-web/docs${query ? `?q=${encodeURIComponent(query)}` : ''}`;
  return `<div class="space-y-8">
    <section class="mx-auto flex max-w-3xl flex-col items-center px-4 pb-2 pt-2 text-center">
      <p class="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-primary"><span class="material-symbols-outlined text-[18px]">description</span> HMN Console</p>
      <h2 class="mb-6 text-3xl font-bold text-white">文档中心</h2>
      <div class="search-shell w-full max-w-2xl overflow-hidden rounded-[28px] border border-line/80 bg-white/70 px-5 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.10)] backdrop-blur-xl">
        <input id="docs-search-inline" value="${esc(state.query)}" placeholder="模糊搜索文档、服务器、服务…" class="search-input w-full border-0 bg-transparent px-0 py-1 text-center text-[17px] text-white placeholder:text-muted focus:ring-0" />
      </div>
      <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
        <a class="btn-secondary min-w-[112px] justify-center rounded-full px-6" id="docs-search-button" href="${esc(searchHref)}" target="_blank">搜索</a>
        <a class="btn-secondary min-w-[112px] justify-center rounded-full px-6" href="/hmn-web/docs" target="_blank">文件索引</a>
      </div>
    </section>
    <div class="grid gap-6 xl:grid-cols-2">${docGroupList('机器文档', state.docs.server_docs, '没有匹配机器文档分组')}${docGroupList('服务文档', state.docs.service_docs, '没有匹配服务文档分组')}</div>
  </div>`;
}
function renderHeadscale() {
  return `<div class="space-y-6">
    ${pageHeader('Headscale 配置', '把 Headscale 变更纳入 HMN plan / approval 流程。当前入口复用网络 ACL plan，避免直接热改。', 'vpn_lock')}
    <div class="grid gap-6 xl:grid-cols-[360px_1fr]"><aside class="card p-6"><h3 class="font-semibold text-white">检查项</h3><ul class="mt-4 space-y-3 text-sm text-muted"><li>• policy / ACL diff</li><li>• routes / DNS 变更</li><li>• 节点权限影响面</li><li>• 审批后再 apply</li></ul></aside><section class="card p-6"><form id="headscale-plan-form" class="grid gap-4"><label class="field">Headscale Policy 草案<textarea id="headscale-proposed" rows="10" placeholder="粘贴 policy 或 routes 变更草案"></textarea></label><button class="btn-primary" type="submit">生成 Headscale Plan</button></form>${jsonBox('headscale-plan-result')}</section></div>
  </div>`;
}
function renderSkills() {
  const rows = [
    ['managed-network-control-plane', 'HMN 控制面演进、Web 接口、节点事实与审批策略。'],
    ['linux-server-bootstrap', '新服务器接管、安全基线、非 22 SSH 偏好。'],
    ['github-pr-workflow', '分支、commit、PR、CI、merge 流程。'],
    ['subagent-driven-development', '多子 Agent 实现与双阶段审查。']
  ];
  return `<div class="space-y-6">${pageHeader('Hermes 技能', '当前 HMN 相关技能与使用约束概览。', 'psychology')}<div class="grid gap-4 md:grid-cols-2">${rows.map(([name,desc]) => `<section class="card p-5"><h3 class="font-mono text-sm font-bold text-primary">${esc(name)}</h3><p class="mt-2 text-sm text-muted">${esc(desc)}</p></section>`).join('')}</div></div>`;
}
function renderConversations() {
  return `<div class="space-y-6">${pageHeader('Hermes 对话', '对话上下文、任务审计和 HMN 操作留痕入口。', 'forum')}<section class="card p-6"><div class="grid gap-4 md:grid-cols-3">${metric('Recent Tasks', (state.summary.tasks || []).length, 'assignment')}${metric('Approvals', (state.summary.approvals || []).length, 'verified_user')}${metric('Audit Path', '/srv/files', 'folder')}</div><p class="mt-5 text-sm text-muted">后续可接入 session_search / audit log 聚合；当前先显示 console 已暴露的任务和审批摘要。</p></section></div>`;
}
function renderPlatform() {
  const v = state.version || {};
  return `<div class="space-y-6">${pageHeader('平台配置', 'HMN API、Worker 协议、Gateway 与 Web 部署信息。', 'tune')}<div class="grid gap-4 md:grid-cols-3">${metric('Package', v.package_version || '-', 'deployed_code')}${metric('API', v.api_version || '-', 'api')}${metric('Worker Protocol', v.worker_protocol_version || '-', 'memory')}</div><section class="card p-6"><h3 class="font-semibold text-white">1.1 默认策略</h3><div class="mt-4 grid gap-3 md:grid-cols-3"><div class="card-soft p-4"><b class="text-white">Auto Confirm</b><p class="mt-2 text-sm text-muted">Join 默认注册即 managed，可用 HERMES_AUTO_CONFIRM=0 关闭。</p></div><div class="card-soft p-4"><b class="text-white">Worker Install</b><p class="mt-2 text-sm text-muted">join.sh 默认安装 worker + systemd timer，可用 HERMES_AUTO_INSTALL_WORKER=0 关闭。</p></div><div class="card-soft p-4"><b class="text-white">Execution</b><p class="mt-2 text-sm text-muted">默认 HMN_ENABLE_EXEC=1，权限 bundle 为 observe/task。</p></div></div></section></div>`;
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
  else if (state.page === 'backup') c.innerHTML = renderBackup();
  else if (state.page === 'network') c.innerHTML = renderNetwork();
  else if (state.page === 'components') c.innerHTML = renderComponents();
  else if (state.page === 'headscale') c.innerHTML = renderHeadscale();
  else if (state.page === 'docs') c.innerHTML = renderDocs();
  else if (state.page === 'themes') c.innerHTML = renderThemes();
  else if (state.page === 'permissions') c.innerHTML = renderPermissions();
  else if (state.page === 'skills') c.innerHTML = renderSkills();
  else if (state.page === 'conversations') c.innerHTML = renderConversations();
  else if (state.page === 'platform') c.innerHTML = renderPlatform();
  bindPageEvents();
}

function bindPageEvents() {
  const form = $('#task-form');
  if (form) form.addEventListener('submit', submitTask);
  ['#join-master', '#join-token', '#join-node-name', '#join-auto-confirm', '#join-auto-worker', '#join-exec'].forEach((s) => { const el = $(s); if (el) el.addEventListener('input', updateJoinCommand); });
  const genJoin = $('#generate-join-token');
  if (genJoin) genJoin.addEventListener('click', generateJoinToken);
  const joinPolicyForm = $('#join-policy-form');
  if (joinPolicyForm) joinPolicyForm.addEventListener('submit', saveJoinPolicy);
  const copy = $('#copy-join');
  if (copy) copy.addEventListener('click', async () => { await navigator.clipboard.writeText($('#join-command').textContent); showToast('接入命令已复制'); });
  const docsInlineSearch = $('#docs-search-inline');
  if (docsInlineSearch) docsInlineSearch.addEventListener('input', (e) => {
    state.query = e.target.value;
    const topSearch = $('#search-input');
    if (topSearch && topSearch.value !== state.query) topSearch.value = state.query;
    const searchBtn = $('#docs-search-button');
    if (searchBtn) searchBtn.href = `/hmn-web/docs${state.query.trim() ? `?q=${encodeURIComponent(state.query.trim())}` : ''}`;
    render();
  });
  updateJoinCommand();
  bindThemeEvents();
  const backupForm = $('#backup-plan-form'); if (backupForm) backupForm.addEventListener('submit', submitBackupPlan);
  const restoreForm = $('#restore-run-form'); if (restoreForm) restoreForm.addEventListener('submit', submitRestoreRun);
  const aclForm = $('#acl-plan-form'); if (aclForm) aclForm.addEventListener('submit', submitAclPlan);
  const headscaleForm = $('#headscale-plan-form'); if (headscaleForm) headscaleForm.addEventListener('submit', submitHeadscalePlan);
}

async function writeJsonResult(id, promise) {
  const el = $(`#${id}`);
  if (el) el.textContent = '请求中…';
  try {
    const data = await promise;
    if (el) el.textContent = JSON.stringify(data, null, 2);
    showToast('Plan 已生成');
    await refresh({ silent: true });
  } catch (err) {
    if (el) el.textContent = `ERROR: ${err.message}`;
    showToast(`操作失败：${err.message}`, 'danger');
  }
}
async function submitBackupPlan(e) {
  e.preventDefault();
  await writeJsonResult('backup-plan-result', api('/console/backups/plan', { method: 'POST', body: JSON.stringify({ node_id: $('#backup-node').value, target: $('#backup-target').value.trim(), created_by: 'hmn-web' }) }));
}
async function submitRestoreRun(e) {
  e.preventDefault();
  const backup_id = $('#restore-backup-id').value.trim();
  if (!backup_id) return showToast('请填写 backup_id', 'warning');
  await writeJsonResult('restore-run-result', api('/console/restore/run', { method: 'POST', body: JSON.stringify({ node_id: $('#restore-node').value, backup_id, created_by: 'hmn-web' }) }));
}
async function submitAclPlan(e) {
  e.preventDefault();
  await writeJsonResult('acl-plan-result', api('/console/network/acl/plan', { method: 'POST', body: JSON.stringify({ proposed_acl: $('#acl-proposed').value, created_by: 'hmn-web' }) }));
}
async function submitHeadscalePlan(e) {
  e.preventDefault();
  await writeJsonResult('headscale-plan-result', api('/console/network/acl/plan', { method: 'POST', body: JSON.stringify({ proposed_acl: $('#headscale-proposed').value, created_by: 'hmn-web' }) }));
}

async function runComponent(componentId, mode) {
  const node_id = $(`[data-component-node="${componentId}"]`)?.value || '';
  const action = $(`[data-component-action="${componentId}"]`)?.value || 'status';
  await writeJsonResult('component-result', api(`/console/components/${encodeURIComponent(componentId)}/${mode}`, { method: 'POST', body: JSON.stringify({ node_id, action, config: {}, created_by: 'hmn-web' }) }));
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
  const token = $('#join-token')?.value.trim() || '请先生成令牌';
  const nodeName = $('#join-node-name')?.value.trim();
  const env = [
    `HMN_MASTER_URL=${q(master)}`,
    `HERMES_JOIN_TOKEN=${q(token)}`,
    nodeName ? `HERMES_NODE_NAME=${q(nodeName)}` : '',
    `HERMES_AUTO_CONFIRM=${q($('#join-auto-confirm')?.value || '1')}`,
    `HERMES_AUTO_INSTALL_WORKER=${q($('#join-auto-worker')?.value || '1')}`,
    `HMN_ENABLE_EXEC=${q($('#join-exec')?.value || '1')}`,
  ].filter(Boolean).join(' ');
  out.textContent = `curl -fsSL ${q(`${master}/scripts/join.sh`)} | ${env} bash`;
}

async function generateJoinToken() {
  try {
    const token = await api('/console/join-token', { method: 'POST', body: JSON.stringify({ trust_level: 'B', labels: [], ttl_minutes: 30 }) });
    const input = $('#join-token');
    if (input) input.value = token.token;
    updateJoinCommand();
    showToast('接入令牌已生成');
  } catch (err) { showToast(`生成令牌失败：${err.message}`, 'danger'); }
}

async function saveJoinPolicy(e) {
  e.preventDefault();
  const boolVal = (id) => $(id)?.value === 'true';
  const payload = {
    auto_confirm: boolVal('#policy-auto-confirm'),
    auto_install_worker: boolVal('#policy-auto-worker'),
    enable_exec: $('#join-exec')?.value !== '0',
    pending_visible: boolVal('#policy-pending-visible'),
    permission_bundle: $('#policy-permission-bundle')?.value || 'observe_task',
  };
  try {
    const saved = await api('/console/join-policy', { method: 'PUT', body: JSON.stringify(payload) });
    state.joinPolicy = { ...state.joinPolicy, ...saved };
    showToast('默认策略已保存');
    render();
  } catch (err) { showToast(`保存策略失败：${err.message}`, 'danger'); }
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
  const componentPlan = e.target.closest('[data-component-plan]');
  const componentRun = e.target.closest('[data-component-run]');
  if (sw) { switchPage(sw.dataset.switch); closeSidebar(); }
  if (taskNode) { switchPage('tasks'); setTimeout(() => { const s = $('#task-node'); if (s) s.value = taskNode.dataset.taskNode; }, 0); }
  if (copy) { await navigator.clipboard.writeText(copy.dataset.copy); showToast('node_id 已复制'); }
  const serviceDetail = e.target.closest('[data-service-detail]');
  if (serviceDetail) openServiceSheet(serviceDetail.dataset.serviceDetail);
  const serviceSheetClose = e.target.closest('[data-service-sheet-close]');
  if (serviceSheetClose) closeServiceSheet();
  if (approve) decideApproval(approve.dataset.approve, 'approve');
  if (reject) decideApproval(reject.dataset.reject, 'reject');
  if (componentPlan) runComponent(componentPlan.dataset.componentPlan, 'plan');
  if (componentRun) runComponent(componentRun.dataset.componentRun, 'run');
});
$('#new-request').addEventListener('click', () => switchPage('tasks'));
$('#refresh-btn').addEventListener('click', () => refresh());
$('#mode-toggle').addEventListener('click', () => applyMode(state.mode === 'dark' ? 'light' : 'dark'));
$('#lang-select').addEventListener('change', (e) => { state.lang = e.target.value; localStorage.setItem('hmn-lang', state.lang); render(); switchPage(state.page); });
$('#mobile-menu').addEventListener('click', () => document.body.classList.toggle('sidebar-open'));
$('#mobile-scrim').addEventListener('click', closeSidebar);
$('#search-input').addEventListener('input', (e) => {
  state.query = e.target.value;
  const inlineSearch = $('#docs-search-inline');
  if (inlineSearch && inlineSearch.value !== state.query) inlineSearch.value = state.query;
  const searchBtn = $('#docs-search-button');
  if (searchBtn) searchBtn.href = `/hmn-web/docs${state.query.trim() ? `?q=${encodeURIComponent(state.query.trim())}` : ''}`;
  render();
});
window.addEventListener('hashchange', () => switchPage(location.hash.slice(1) || 'overview', { preserveHash: true }));
applyMode(state.mode);
applyTheme(state.theme);
updateSearchPlaceholder();

async function boot() {
  try {
    const ok = await ensureSession();
    if (!ok) return;
    switchPage(location.hash.slice(1) || 'overview');
    await refresh({ silent: true });
    setInterval(() => refresh({ silent: true }), 30000);
  } catch (err) {
    $('#api-status').textContent = 'API offline';
    showToast(`无法连接 HMN API：${err.message}`, 'danger');
  }
}

boot();
