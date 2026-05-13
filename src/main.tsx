import React from 'react';
import ReactDOM from 'react-dom/client';
import { Activity, AlertTriangle, CheckCircle2, Clock3, Cpu, Database, HardDrive, Network, PlayCircle, ShieldCheck, TerminalSquare, Wifi, WifiOff } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import clsx from 'clsx';
import { approvals, nodes, tasks } from './mock';
import type { HmnNode } from './types';
import './styles.css';

const traffic = [
  { time: '18:00', in: 4, out: 2 },
  { time: '19:00', in: 7, out: 3 },
  { time: '20:00', in: 5, out: 5 },
  { time: '21:00', in: 12, out: 6 },
  { time: '22:00', in: 9, out: 4 },
  { time: '23:00', in: 18, out: 8 },
];

function MetricCard({ title, value, hint, icon }: { title: string; value: string; hint: string; icon: React.ReactNode }) {
  return <section className="metric-card">
    <div className="metric-icon">{icon}</div>
    <div>
      <p>{title}</p>
      <strong>{value}</strong>
      <span>{hint}</span>
    </div>
  </section>;
}

function Progress({ value, tone = 'blue' }: { value: number; tone?: 'blue' | 'green' | 'amber' }) {
  return <div className="progress"><i className={tone} style={{ width: `${Math.max(2, value)}%` }} /></div>;
}

function StatusPill({ node }: { node: HmnNode }) {
  const online = node.liveness === 'online';
  return <span className={clsx('pill', online ? 'online' : node.status === 'pending' ? 'pending' : 'offline')}>
    {online ? <Wifi size={13} /> : <WifiOff size={13} />}
    {node.status === 'pending' ? '待确认' : online ? '在线' : '离线'}
  </span>;
}

function NodeCard({ node }: { node: HmnNode }) {
  return <article className={clsx('node-card', node.liveness)}>
    <header>
      <div>
        <h3>{node.name}</h3>
        <code>{node.id}</code>
      </div>
      <StatusPill node={node} />
    </header>
    <div className="node-meta">
      <span>{node.ip}</span>
      <span>{node.os}</span>
      <span>trust {node.trust}</span>
      <span>{node.execEnabled ? 'exec:on' : 'exec:off'}</span>
    </div>
    <div className="node-grid">
      <label>CPU <b>{node.cpu}%</b><Progress value={node.cpu} /></label>
      <label>内存 <b>{node.memory}%</b><Progress value={node.memory} tone="green" /></label>
      <label>磁盘 <b>{node.disk}%</b><Progress value={node.disk} tone={node.disk > 70 ? 'amber' : 'blue'} /></label>
      <label>负载 <b>{node.load}</b><Progress value={node.load * 40} /></label>
    </div>
    <footer>
      <span>心跳：{node.lastHeartbeat}</span>
      <span>运行：{node.uptime}</span>
    </footer>
  </article>;
}

function App() {
  const online = nodes.filter(n => n.liveness === 'online').length;
  const managed = nodes.filter(n => n.status === 'managed').length;
  const pending = nodes.filter(n => n.status === 'pending').length;

  return <main>
    <aside>
      <div className="brand"><span>H</span><div><b>HMN Web</b><small>Managed Network Console</small></div></div>
      <nav>
        <a className="active"><Activity size={18} />总览</a>
        <a><Database size={18} />节点</a>
        <a><TerminalSquare size={18} />任务</a>
        <a><ShieldCheck size={18} />审批</a>
        <a><Network size={18} />网络</a>
      </nav>
    </aside>

    <section className="content">
      <header className="topbar">
        <div>
          <p>借鉴 Komari 的探针视图，但面向 HMN 托管、审批、任务和资产闭环。</p>
          <h1>节点状态总览</h1>
        </div>
        <button><PlayCircle size={18} />接入新节点</button>
      </header>

      <div className="metrics">
        <MetricCard title="在线节点" value={`${online}/${nodes.length}`} hint="最近 5 分钟心跳" icon={<Wifi />} />
        <MetricCard title="托管节点" value={`${managed}`} hint={`${pending} 个待清理/确认`} icon={<CheckCircle2 />} />
        <MetricCard title="待审批" value={`${approvals.length}`} hint="高风险动作需确认" icon={<AlertTriangle />} />
        <MetricCard title="运行任务" value={`${tasks.filter(t => t.status === 'running').length}`} hint="worker pull 队列" icon={<Clock3 />} />
      </div>

      <div className="layout">
        <section className="panel wide">
          <header><h2>节点探针</h2><span>CPU / 内存 / 磁盘 / 心跳</span></header>
          <div className="nodes">{nodes.map(node => <NodeCard key={node.id} node={node} />)}</div>
        </section>

        <section className="panel">
          <header><h2>网络流量</h2><span>聚合视图</span></header>
          <div className="chart">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={traffic}>
                <defs><linearGradient id="in" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4}/><stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/></linearGradient></defs>
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={12}/><YAxis stroke="#94a3b8" fontSize={12}/><Tooltip />
                <Area type="monotone" dataKey="in" stroke="#7c3aed" fill="url(#in)" />
                <Area type="monotone" dataKey="out" stroke="#38bdf8" fillOpacity={0.08} fill="#38bdf8" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel">
          <header><h2>最近任务</h2><span>审批/执行状态</span></header>
          <div className="tasks">{tasks.map(task => <div className="task" key={task.id}><Cpu size={16}/><div><b>{task.command}</b><span>{task.node} · {task.createdAt}</span></div><em className={task.risk}>{task.status}</em></div>)}</div>
        </section>

        <section className="panel">
          <header><h2>容量风险</h2><span>来自 worker facts</span></header>
          <div className="risk-list">{nodes.filter(n => n.status === 'managed').map(n => <div key={n.id}><HardDrive size={16}/><span>{n.name}</span><Progress value={n.disk} tone={n.disk > 70 ? 'amber' : 'blue'} /><b>{n.disk}%</b></div>)}</div>
        </section>
      </div>
    </section>
  </main>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
