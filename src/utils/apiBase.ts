/**
 * 统一的后端 API 地址解析。
 *
 * 背景：前端所有接口都以 `/api/xxx` 的形式发起请求，依赖同源反向代理
 * （开发环境是 vite proxy，生产环境是 nginx / .htaccess / Vercel rewrites）。
 *
 * 但部署到 GitHub Pages 这类纯静态托管时没有反向代理，必须把请求指向
 * 独立部署的后端（例如 Vercel / Cloudflare Workers）。
 *
 * 通过 VITE_API_BASE_URL 配置，三种写法都支持：
 *   1) 留空（默认）                -> 同源，保持 `/api/xxx` 不变
 *   2) https://xxx.vercel.app      -> https://xxx.vercel.app/api/xxx
 *   3) https://xxx.vercel.app/api  -> https://xxx.vercel.app/api/xxx
 */

const RAW_BASE = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')

/** 归一化后的 API 前缀；为空表示走同源 */
export const API_BASE = RAW_BASE
  ? (RAW_BASE.endsWith('/api') ? RAW_BASE : `${RAW_BASE}/api`)
  : ''

/**
 * 把代码里的 `/api/xxx` 解析成实际请求地址。
 * API_BASE 为空时原样返回，保持原有的同源行为。
 */
export function apiUrl(path: string): string {
  if (!API_BASE) return path
  const p = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE}${p.replace(/^\/api/, '')}`
}