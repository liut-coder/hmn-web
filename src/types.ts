export type NodeStatus = 'managed' | 'pending' | 'revoked';
export type Liveness = 'online' | 'stale' | 'offline' | 'unknown';

export interface HmnNode {
  id: string;
  name: string;
  status: NodeStatus;
  liveness: Liveness;
  trust: 'A' | 'B' | 'C';
  role: string;
  region: string;
  ip: string;
  os: string;
  uptime: string;
  cpu: number;
  memory: number;
  disk: number;
  networkIn: number;
  networkOut: number;
  load: number;
  lastHeartbeat: string;
  execEnabled: boolean;
}

export interface TaskItem {
  id: string;
  node: string;
  command: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'approval_required';
  createdAt: string;
}

export interface ApprovalItem {
  id: string;
  title: string;
  risk: 'high' | 'critical';
  subject: string;
  createdAt: string;
}
