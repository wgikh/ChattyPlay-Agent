# ChattyPlay-Agent 部署指南（GitHub Pages + 独立后端）

本项目是一个 **Vite + React 前端** + **Hono 后端（`api/index.ts`）** 的全栈应用。

推荐部署方式（本指南采用的方案）：

| 部分 | 平台 | 说明 |
| --- | --- | --- |
| 前端 | **GitHub Pages** | 纯静态，由 `.github/workflows/deploy-pages.yml` 自动构建并发布 |
| 后端 | **Vercel**（推荐）或 Cloudflare Workers | 仓库已带 `vercel.json`，导入即用 |

> GitHub Pages 只能托管静态文件，**不能运行后端**，所以 `api/` 必须单独部署。
> 前端通过 `VITE_API_BASE_URL` 指向后端地址（见下文）。

---

## 0. 把代码推到 GitHub

```bash
git init
git add .
git commit -m "chore: prepare GitHub Pages + Vercel deployment"
git branch -M main
gh repo create <你的用户名>/ChattyPlay-Agent --public --source=. --remote=origin --push
# 或者手动：git remote add origin https://github.com/<你>/ChattyPlay-Agent.git && git push -u origin main
```

---

## 1. 部署后端到 Vercel（推荐）

1. 打开 <https://vercel.com/new>，导入本仓库。
2. 框架会被识别为 **Vite**，保持默认即可（`vercel.json` 已配置好路由与 CORS）。
   - 若只想跑后端，可在导入时把 **Root Directory** 设为仓库根目录并保留默认构建；Vercel 会自动把 `api/index.ts` 变成 Serverless Function。
3. 在 **Settings → Environment Variables** 添加后端所需变量（至少填 `JWT_SECRET`、`UPSTASH_REDIS_REST_URL`、`UPSTASH_REDIS_REST_TOKEN`、`BCOMIC_API_BASE_URL`、`VIDEO_PARSE_API_BASE_URL`），然后 **Redeploy**。
4. 部署完成后，后端地址形如 `https://<project>.vercel.app`，接口前缀为 `/api`。
5. 自检：

   ```bash
   curl https://<project>.vercel.app/api/health
   # => {"status":"ok"}
   ```

### 后端环境变量一览

| 变量 | 用途 | 是否必需 |
| --- | --- | --- |
| `JWT_SECRET` | 登录令牌签名 | 生产环境建议必填 |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | 用户/会话存储 | 登录注册功能必需 |
| `BCOMIC_API_BASE_URL` | 漫画数据源（默认 `https://apis.netstart.cn/bcomic`） | 漫画功能必需 |
| `VIDEO_PARSE_API_BASE_URL` | 视频解析源 | 视频解析功能必需 |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth 登录（后端） | 用到 GitHub 登录时必填 |
| `GOOFISH_BACKEND_URL` / `CRON_SECRET` | 闲鱼助手定时健康检查 | 可选 |

---

## 2. 让前端指向后端

GitHub Pages 上的前端必须通过 HTTPS 访问后端（否则浏览器会因混合内容拦截 HTTP 请求）。

在仓库 **Settings → Secrets and variables → Actions → Variables** 新增：

| 变量名 | 值 |
| --- | --- |
| `VITE_API_BASE_URL` | `https://<project>.vercel.app`（**不要**带 `/api`，也可带，代码两种都兼容） |

其余可选的 `VITE_*` 变量见 [`.env.example`](./.env.example)。这些变量会在构建时写入 `.env.production.local`。

---

## 3. 开启 GitHub Pages

1. 仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
2. 推送到 `main`（或手动触发）后，`Deploy to GitHub Pages` 工作流会自动：
   - 计算子路径 `base`（`/<仓库名>/`）；
   - 注入上面的 Variables/Secrets；
   - `npm install` + `npm run build`；
   - 生成 `404.html`（SPA 深链接回退）与 `.nojekyll`；
   - 发布到 Pages。
3. 访问 `https://<用户名>.github.io/<仓库名>/`。

> 如果仓库名本身是 `<用户名>.github.io`，base 会自动变成 `/`，无需改动。

---

## 4. 备选：部署到 Cloudflare Workers

`api/index.ts` 只依赖 `hono` 与 `crypto-js`，可直接跑在 Workers 上：

```bash
npx wrangler deploy
```

（`package.json` 已含 `worker:deploy` 脚本；如需自定义入口请参考 `wrangler` 配置。）

---

## 常见问题

- **页面能开但接口 404 / CORS 报错**：检查 `VITE_API_BASE_URL` 是否配置正确并重新运行 Pages 工作流。
- **登录/注册失败**：多为缺少 `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` / `JWT_SECRET`。
- **深链接刷新 404**：确认构建产物里有 `404.html`（工作流会自动生成）。
- **HTTP 后端被拦截**：GitHub Pages 是 HTTPS，后端必须也是 HTTPS。