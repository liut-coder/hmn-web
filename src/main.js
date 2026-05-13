const nodes = [
  { id: 'node_d9c21dc1c2c1', name: 'BeroNas', status: 'managed', live: 'online', trust: 'B', role: 'storage', ip: '100.64.0.1', os: 'Linux / NAS', uptime: '18d 4h', cpu: 22, memory: 61, disk: 74, load: 0.42, hb: '刚刚', exec: true },
  { id: 'node_54876e61b3a9', name: 'brarm', status: 'managed', live: 'online', trust: 'B', role: 'edge-worker', ip: '198.55.109.60', os: 'Debian / ARM', uptime: '2h 11m', cpu: 9, memory: 38, disk: 21, load: 0.18, hb: '1 分钟前', exec: true },
  { id: 'node_d643656b6329', name: 'worker-d2', status: 'managed', live: 'online', trust: 'B', role: 'standby', ip: '23.165.105.105', os: 'Ubuntu', uptime: '5d 7h', cpu: 14, memory: 47, disk: 33, load: 0.3, hb: '刚刚', exec: true },
  { id: 'node_10304cac77a2', name: 'brarm-old', status: 'pending', live: 'unknown', trust: 'B', role: 'duplicate', ip: '-', os: 'unknown', uptime: '-', cpu: 0, memory: 0, disk: 0, load: 0, hb: '无', exec: false },
];

function progress(value, tone = '') {
  return `<div class="progress"><i class="${tone}" style="width:${Math.max(2, value)}%"></i></div>`;
}

function nodeCard(node) {
  const online = node.live === 'online';
  const pill = node.status === 'pending' ? '待确认' : online ? '在线' : '离线';
  const pillClass = node.status === 'pending' ? 'pending' : online ? 'online' : 'offline';
  return `<article class="node-card ${node.live}">
    <header><div><h3>${node.name}</h3><code>${node.id}</code></div><span class="pill ${pillClass}">${pill}</span></header>
    <div class="node-meta"><span>${node.ip}</span><span>${node.os}</span><span>trust ${node.trust}</span><span>${node.exec ? 'exec:on' : 'exec:off'}</span></div>
    <div class="node-grid">
      <label>CPU <b>${node.cpu}%</b>${progress(node.cpu)}</label>
      <label>内存 <b>${node.memory}%</b>${progress(node.memory, 'green')}</label>
      <label>磁盘 <b>${node.disk}%</b>${progress(node.disk, node.disk > 70 ? 'amber' : '')}</label>
      <label>负载 <b>${node.load}</b>${progress(node.load * 40)}</label>
    </div>
    <footer><span>心跳：${node.hb}</span><span>运行：${node.uptime}</span></footer>
  </article>`;
}

document.querySelector('#nodes').innerHTML = nodes.map(nodeCard).join('');
