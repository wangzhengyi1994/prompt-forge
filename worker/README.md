# 小红书采集 Worker

Cloudflare Worker 后端代理，用于采集小红书笔记内容。

## 部署步骤

1. 安装依赖：
```bash
cd worker
npm install
```

2. 登录 Cloudflare（首次）：
```bash
npx wrangler login
```

3. 本地开发：
```bash
npm run dev
```

4. 部署到 Cloudflare：
```bash
npm run deploy
```

5. 部署后，将 Worker URL 配置到前端环境变量：
```
VITE_COLLECT_API=https://xhs-collector.<your-subdomain>.workers.dev
```

## API

### POST /api/collect

请求体：
```json
{ "url": "https://www.xiaohongshu.com/explore/xxx" }
```

响应：
```json
{
  "title": "笔记标题",
  "content": "笔记正文",
  "tags": ["标签1", "标签2"],
  "images": ["https://..."],
  "source": "小红书"
}
```

支持的 URL 格式：
- `https://www.xiaohongshu.com/explore/xxx`
- `https://www.xiaohongshu.com/discovery/item/xxx`
- `http://xhslink.com/xxx`（短链会自动跟随重定向）

## 解析策略

1. 优先从 `window.__INITIAL_STATE__` 提取结构化数据
2. 如果拿不到则 fallback 到 `og:title` / `og:description` meta 标签
