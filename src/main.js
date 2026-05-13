const mockSummary = {
  metrics: {
    online_nodes: 3,
    total_nodes: 4,
    managed_nodes: 3,
    pending_nodes: 1,
    pending_approvals: 1,
    running_tasks: 1,
  },
  nodes: [
    { id: 'node_d9c21dc1c2c1', name: 'BeroNas', status: 'managed', live: 'online', trust: 'B', role: 'storage', ip: '100.64.0.1', os: 'Linux / NAS', uptime: '18d 4h', cpu: 22, memory: 61, disk: 74, load: 0.42, hb: '刚刚', exec: true },
    { id: 'node_54876e61b3a9', name: 'brarm', status: 'managed', live: 'online', trust: 'B', role: 'edge-worker', ip: '198.55.109.60', os: 'Debian / ARM', uptime: '2h 11m', cpu: 9, memory: 38, disk: 21, load: 0.18, hb: '1 分钟前', exec: true },
    { id: 'node_d643656b6329', name: 'worker-d2', status: 'managed', live: 'online', trust: 'B', role: 'standby', ip: '23.165.105.105', os: 'Ubuntu', uptime: '5d 7h', cpu: 14, memory: 47, disk: 33, load: 0.3, hb: '刚刚', exec: true },
    { id: 'node_10304cac77a2', name: 'brarm-old', status: 'pending', live: 'unknown', trust: 'B', role: 'duplicate', ip: '-', os: 'unknown', uptime: '-', cpu: 0, memory: 0, disk: 0, load: 0, hb: '无', exec: false },
  ],
  tasks: [
    { id: 'task_hb', node_name: 'brarm', command: 'heartbeat + facts', status: 'succeeded', risk: 'low', created_at: '2 分钟前' },
    { id: 'task_docs', node_name: 'BeroNas', command: 'docs sync dry-run', status: 'running', risk: 'medium', created_at: '5 分钟前' },
    { id: 'task_upgrade', node_name: 'worker-d2', command: 'system upgrade', status: 'pending', risk: 'high', created_at: '12 分钟前' },
  ],
  approvals: [{ id: 'appr_upgrade', action: 'task.run', status: 'pending', risk: 'high' }],
};

const defaultApiBase = `${window.location.protocol}//${window.location.hostname}:8765`;
const API_BASE = localStorage.getItem('hmnApiBase') || window.HMN_API_BASE || defaultApiBase;

function progress(value, tone = '') {
  return `<div class="progress"><i class="${tone}" style="width:${Math.max(2, Number(value) || 0)}%"></i></div>`;
}

function nodeCard(node) {
  const online = node.live === 'online';
  const pill = node.status === 'pending' ? '待确认' : online ? '在线' : node.live === 'stale' ? '延迟' : '离线';
  const pillClass = node.status === 'pending' ? 'pending' : online ? 'online' : 'offline';
  return `<article class="node-card ${node.live}">
    <header><div><h3>${node.name}</h3><code>${node.id}</code></div><span class="pill ${pillClass}">${pill}</span></header>
    <div class="node-meta"><span>${node.ip}</span><span>${node.os}</span><span>trust ${node.trust}</span><span>${node.exec ? 'exec:on' : 'exec:off'}</span></div>
    <div class="node-grid">
      <label>CPU <b>${node.cpu}%</b>${progress(node.cpu)}</label>
      <label>内存 <b>${node.memory}%</b>${progress(node.memory, 'green')}</label>
      <label>磁盘 <b>${node.disk}%</b>${progress(node.disk, node.disk > 70 ? 'amber' : '')}</label>
      <label>负载 <b>${node.load}</b>${progress(Number(node.load) * 40)}</label>
    </div>
    <footer><span>心跳：${node.hb}</span><span>运行：${node.uptime}</span></footer>
  </article>`;
}

function statusText(status) {
  return ({ succeeded: '成功', running: '运行中', pending: '待执行', failed: '失败' })[status] || status;
}

function renderMetrics(metrics) {
  const managedHint = metrics.pending_nodes ? `${metrics.pending_nodes} 个待确认/清理` : '全部已纳管';
  document.querySelector('#metrics').innerHTML = `
    <section class="metric-card"><div class="metric-icon">↗</div><div><p>在线节点</p><strong>${metrics.online_nodes}/${metrics.total_nodes}</strong><span>最近 5 分钟心跳</span></div></section>
    <section class="metric-card"><div class="metric-icon">✓</div><div><p>托管节点</p><strong>${metrics.managed_nodes}</strong><span>${managedHint}</span></div></section>
    <section class="metric-card"><div class="metric-icon">!</div><div><p>待审批</p><strong>${metrics.pending_approvals}</strong><span>高风险动作需确认</span></div></section>
    <section class="metric-card"><div class="metric-icon">▶</div><div><p>运行任务</p><strong>${metrics.running_tasks}</strong><span>worker pull 队列</span></div></section>`;
}

function renderTasks(tasks) {
  document.querySelector('#tasks').innerHTML = tasks.length
    ? tasks.map((task) => `<div class="task"><div><b>${task.command}</b><span>${task.node_name || task.node_id} · ${task.created_at || ''}</span></div><em class="${task.risk === 'high' ? 'high' : ''}">${statusText(task.status)}</em></div>`).join('')
    : '<p class="empty">暂无任务</p>';
}

function renderCapacity(nodes) {
  const rows = nodes
    .filter((node) => node.status === 'managed')
    .slice(0, 5)
    .map((node) => `<div><span>${node.name}</span>${progress(node.disk, node.disk > 70 ? 'amber' : '')}<b>${node.disk}%</b></div>`)
    .join('');
  document.querySelector('#risk-list').innerHTML = rows || '<p class="empty">暂无容量数据</p>';
}

function renderSource(summary, source) {
  const el = document.querySelector('#api-status');
  el.textContent = source === 'api' ? `核心 API：${API_BASE}` : '核心 API 未连接，使用 mock 数据';
  el.className = source === 'api' ? 'api-status ok' : 'api-status warn';
}

function render(summary, source) {
  renderMetrics(summary.metrics);
  document.querySelector('#nodes').innerHTML = summary.nodes.map(nodeCard).join('');
  renderTasks(summary.tasks || []);
  renderCapacity(summary.nodes || []);
  renderSource(summary, source);
}

async function loadSummary() {
  try {
    const response = await fetch(`${API_BASE}/api/v1/console/summary`, { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    render(await response.json(), 'api');
  } catch (error) {
    console.warn('HMN core API unavailable, using mock data:', error);
    render(mockSummary, 'mock');
  }
}

loadSummary();
