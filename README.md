# Shopify 非嵌入式应用 (Non-Embedded App)

单文件 Express 服务端实现，包含手动 OAuth 授权流程、Webhook 验签与监听。

- **Dev 店铺**: `local-1000163.myshopify.com`
- **Shopify CLI**: 3.85.0+
- **Node**: v22.16.0

---

## 快速启动

### 本地开发（推荐）

```bash
pnpm run dev
```

CLI 会自动：
1. 启动 Cloudflare Quick Tunnel（生成临时 `xxx.trycloudflare.com` URL）
2. 执行 `node index.js`
3. 注入环境变量
4. 配置反向代理

按 `p` 键在浏览器中打开 Preview URL 进行授权。

### 生产环境调试

```bash
pnpm start
```

使用固定的生产域名 `https://crm.fridayparts.com`，适合调试已部署的服务。

---

## 多环境配置

本项目支持两种开发模式，分别对应不同的配置文件和使用场景。

### 命令对比

| 命令 | 配置文件 | 用途 | URL 行为 |
|------|----------|------|----------|
| `pnpm run dev` | `shopify.app.dev.toml` | **本地开发** | CLI 自动生成临时 Tunnel URL，并启动当前服务器监听 |
| `pnpm start` | `shopify.app.toml` | **生产环境调试** | 使用固定生产域名 `https://crm.fridayparts.com` |

### 配置文件说明

#### `shopify.app.dev.toml` - 本地开发配置

```toml
application_url = "https://example.trycloudflare.com"  # 占位符，会被 CLI 自动更新
[build]
  automatically_update_urls_on_dev = true  # 启用自动 URL 更新
```

**特点**：
- CLI 每次启动都生成新的 Tunnel URL
- 自动更新 Partners Dashboard 中的应用配置
- 无需手动管理 URL

#### `shopify.app.toml` - 生产环境配置

```toml
application_url = "https://crm.fridayparts.com"  # 固定生产域名
[build]
  automatically_update_urls_on_dev = false  # 不自动更新 URL
```

**特点**：
- 使用固定的生产域名
- 不会自动更新 Partners Dashboard 配置
- 适合连接到已部署的生产服务进行调试

### 使用场景

**场景 1：本地开发新功能**
```bash
pnpm run dev
# 等价于: shopify app dev --config dev
```
CLI 会自动生成临时 Tunnel URL（如 `https://random-xyz.trycloudflare.com`），并启动本地 `index.js` 服务。

**场景 2：调试生产环境**
```bash
pnpm start
# 等价于: shopify app dev
```
CLI 使用生产域名 `https://crm.fridayparts.com`，适合测试已部署的服务或排查生产环境问题。

### 配置文件命名规则

Shopify CLI 支持通过 `--config` 参数指定配置文件：

```
shopify.app.toml          # 默认配置（npm start）
shopify.app.dev.toml      # dev 配置（npm run dev）
shopify.app.staging.toml  # 可自定义其他环境
```

> **参考**: [Manage App Config Files](https://shopify.dev/docs/apps/build/cli-for-apps/manage-app-config-files)

---

## Shopify CLI `shopify app dev` 工作机制

### 执行流程

```
shopify app dev
    ↓
读取 shopify.web.toml 配置
    ↓
启动 Cloudflare Quick Tunnel
    ├─ 生成随机 xxx.trycloudflare.com URL
    └─ 自动更新 Partners Dashboard URL（如果 automatically_update_urls_on_dev = true）
    ↓
注入环境变量到子进程
    ├─ HOST = Tunnel URL
    ├─ PORT = 动态分配的端口
    ├─ SHOPIFY_API_KEY = Client ID
    ├─ SHOPIFY_API_SECRET = Client Secret
    └─ SCOPES = 访问权限
    ↓
执行 commands.dev（node index.js）
    ↓
配置反向代理：Tunnel URL → localhost:{PORT}
```

> **参考**: [App Dev Command](https://shopify.dev/docs/api/shopify-cli/app/app-dev)

---

## 配置文件

### 配置方式对比

| 配置方式 | 文件 | 是否有效 | 说明 |
|----------|------|----------|------|
| `[build]` 配置 | `shopify.app.toml` | ❌ **无效** | CLI 3.85+ 不识别此配置 |
| `shopify.web.toml` | 项目根目录 | ✅ **有效** | 官方推荐方式 |

> **重要**: 必须使用 `shopify.web.toml` 配置 web 进程，`shopify.app.toml` 中的 `[build]` 部分配置（如 `dev_script`、`port`）不会被 CLI 识别。

### `shopify.web.toml` 配置示例

```toml
roles = ["frontend"]

[commands]
dev = "node index.js"
build = ""
```

> **参考**: [App Structure](https://shopify.dev/docs/apps/build/cli-for-apps/app-structure)

---

## Web 角色配置

| 角色 | 用途 | 路由限制 | 端口 |
|------|------|----------|------|
| `frontend` | 单进程应用（UI + API） | **所有路径** | 动态分配 |
| `backend` | 分离的后端进程 | 仅 `/extensions` | 动态分配 |
| `background` | 后台任务（无 HTTP） | 无 | 无 |

### 角色选择指南

- **单进程应用**（如本项目）: 使用 `roles = ["frontend"]`
- **前后端分离应用**: 前端用 `frontend`，后端用 `backend`
- **后台任务**: 使用 `background`

> **注意**: 使用 `roles = ["backend"]` 时，CLI 代理只允许 `/extensions` 路径，根路径 `/` 会返回 "Invalid path" 错误。([GitHub Issue #6364](https://github.com/Shopify/cli/issues/6364))

---

## 环境变量注入

CLI 在执行 `commands.dev` 时自动注入以下环境变量：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `HOST` | Tunnel URL | `https://xxx.trycloudflare.com` |
| `PORT` / `FRONTEND_PORT` | **动态分配的端口** | `45678` |
| `SHOPIFY_API_KEY` | Client ID | `7fe4e163...` |
| `SHOPIFY_API_SECRET` | Client Secret | `shpss_...` |
| `SCOPES` | 访问权限 | `read_products,write_orders` |
| `BACKEND_PORT` | 后端端口（双进程时） | `34567` |

### 应用代码中的正确用法

```javascript
// ✅ 正确：使用 CLI 注入的动态端口
const PORT = process.env.PORT || process.env.FRONTEND_PORT || 3333;

// ✅ 正确：优先使用 CLI 注入的 HOST
const HOST = process.env.HOST || process.env.SHOPIFY_APP_URL || `http://localhost:${PORT}`;

// ✅ 正确：使用 CLI 注入的凭证
const API_KEY = process.env.SHOPIFY_API_KEY;
const API_SECRET = process.env.SHOPIFY_API_SECRET;
```

> **参考**: [App Structure - Environment Variables](https://shopify.dev/docs/apps/build/cli-for-apps/app-structure)

---

## 关键注意事项

### ⚠️ 必须监听动态端口

CLI 为 `frontend` 角色分配**动态端口**（如 `45678`），应用必须监听 `process.env.PORT`：

```javascript
// ❌ 错误：硬编码端口
const PORT = 3333;

// ✅ 正确：使用环境变量
const PORT = process.env.PORT || 3333;
```

### ⚠️ 不要在 `.env` 中硬编码 URL

`.env` 中的变量会**覆盖** CLI 注入的值：

```bash
# ❌ 错误：.env 中硬编码会覆盖 CLI 注入
SHOPIFY_APP_URL=https://old-tunnel.trycloudflare.com

# ✅ 正确：从 .env 中移除，让 CLI 动态注入
# （不设置 SHOPIFY_APP_URL）
```

### ⚠️ 使用正确的环境变量名

CLI 注入的是 `HOST`，不是 `SHOPIFY_APP_URL`：

```javascript
// ❌ 错误：CLI 不注入 SHOPIFY_APP_URL
const HOST = process.env.SHOPIFY_APP_URL;

// ✅ 正确：优先读取 HOST
const HOST = process.env.HOST || process.env.SHOPIFY_APP_URL || `http://localhost:${PORT}`;
```

---

## Webhook 配置

### 服务器端要求

1. **必须返回 HTTP 200 状态码**
2. **快速响应**（建议 5 秒内）
3. **异步处理**（收到请求立即返回 200，异步处理业务逻辑）

### 重要限制

Webhook URL 不能是：
- Localhost 地址
- 以 "internal" 结尾的 URL
- 虚假域名（如 `www.example.com`）
- Shopify 自己的域名

---

## 安装 Cloudflare（如果 CLI 内置版本有问题）

```bash
rm /home/linnzh/.nvm/versions/node/v22.16.0/lib/node_modules/@shopify/cli/bin/cloudflared
wget -O /home/linnzh/.nvm/versions/node/v22.16.0/lib/node_modules/@shopify/cli/bin/cloudflared \
  https://github.com/cloudflare/cloudflared/releases/download/2024.8.2/cloudflared-linux-amd64
chmod u+x /home/linnzh/.nvm/versions/node/v22.16.0/lib/node_modules/@shopify/cli/bin/cloudflared
```

---

## 官方文档

- [App Dev Command](https://shopify.dev/docs/api/shopify-cli/app/app-dev) - CLI 命令参考
- [App Structure](https://shopify.dev/docs/apps/build/cli-for-apps/app-structure) - 应用结构和环境变量
- [App Configuration](https://shopify.dev/docs/apps/build/cli-for-apps/app-configuration) - 配置文件详解
- [Networking Options](https://shopify.dev/docs/apps/build/cli-for-apps/networking-options) - 网络选项（Tunnel、Localhost）
