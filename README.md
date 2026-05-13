# HMN Web

借鉴 Komari 的轻量探针体验，为 Hermes Managed Network 提供独立 Web 控制台。

## MVP

- 节点总览：在线、离线、pending、managed。
- 探针卡片：CPU、内存、磁盘、网络、负载、运行时间。
- 任务/审批入口：展示最近任务和风险状态。
- API 适配层：优先读取 HMN 控制面，开发环境使用 mock 数据。

## 开发

```bash
pnpm install
pnpm dev
```

## 构建

```bash
pnpm build
```
