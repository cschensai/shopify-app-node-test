<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Shopify 非嵌入式应用 (Non-Embedded App) - 单文件 Express 服务端实现，包含手动 OAuth 授权流程、Webhook 验签与监听。

- Shopify CLI Version: 3.88.0
- Node Version: v22.16.0

## Commands

```bash
# 启动本地服务器 (端口 3333)
node index.js

# 使用 Cloudflare Tunnel 建立临时公网域名
cloudflared tunnel --url http://localhost:3333

# 部署应用配置到 Shopify
shopify app deploy

# 启动 Shopify 开发模式 (自动注入环境变量)
shopify app dev
```

## Architecture

### 核心文件

- `index.js` - 单文件服务端，包含 OAuth、Webhook 处理、前端 UI
- `shopify.app.toml` - Shopify CLI 配置 (application_url, scopes, webhooks)
- `.env` - 环境变量 (API_KEY, API_SECRET, SHOPIFY_APP_URL)

### OAuth 流程

1. `/auth` - 发起授权，生成授权 URL
2. `/auth/callback` - 回调处理，交换 Offline Access Token

### Webhook 处理

- 端点: `/api/webhooks`
- HMAC 签名验证 (使用 `X-Shopify-Hmac-Sha256` 头部)
- 使用 `timingSafeEqual` 防止时序攻击
- 收到请求立即返回 200，异步处理业务逻辑

### 关键配置

- 端口: 3333
- 非嵌入式应用: `isEmbeddedApp: false`
- API 版本: October24
- 使用 Offline Token (永不过期)

## Development Workflow

1. 启动 `cloudflared tunnel` 获取临时公网 URL
2. 更新 `.env` 中的 `SHOPIFY_APP_URL` 和 `shopify.app.toml` 中的 `application_url`
3. 运行 `shopify app deploy` 同步配置
4. 运行 `node index.js` 启动服务
5. 使用 `shopify app dev` 进行开发调试 (可通过 p/g 键打开 dev 店铺)
