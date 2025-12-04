### Shopify 本地订阅 Webhook

- Dev 店铺链接：local-1000163.myshopify.com

**Shopify 不允许 webhook 直接发送到 localhost**。不过有几种解决方案:

**主要方法:**

1. **使用隧道工具 (如 ngrok)**
    - 这是最常用的方法。使用 ngrok 或类似工具创建一个公网 URL,将其映射到你的本地开发服务器,然后在 Shopify 后台的 webhook 设置中使用这个公网 URL。
2. **使用 Shopify CLI**
    - 如果你正在开发 Shopify 应用或主题,Shopify CLI 提供了开发环境支持,可以帮助你在本地预览和测试,包括处理 webhook。
3. **使用开发商店 (Dev Store)**
    - 在合作伙伴控制台创建开发商店进行测试,配合隧道工具使用。

**重要限制:** 根据 Shopify 的规定,webhook URL 不能是:

- Localhost 地址
- 以 "internal" 结尾的 URL
- 虚假域名 (如 <www.example.com>)
- Shopify 自己的域名

**测试 webhook:** 配置好 webhook 后,你可以在 Shopify 后台的 设置 > 通知 > Webhooks 页面,点击相应 webhook 旁边的 "..." > " 发送测试 ",来验证你的 webhook 是否正常工作。

#### 确保 Webhook 正常工作的最佳实践

**服务器端要求:**

1. **必须返回 HTTP 200 状态码**
    - 这是最关键的要求
    
2. **快速响应**
    - 建议在 5 秒内返回响应
    
3. **异步处理**
    - 收到 webhook 后立即返回 200，然后异步处理数据
#### 安装 Cloudflare

```bash
rm /home/linnzh/.nvm/versions/node/v22.16.0/lib/node_modules/@shopify/cli/bin/cloudflared
wget -O /home/linnzh/.nvm/versions/node/v22.16.0/lib/node_modules/@shopify/cli/bin/cloudflared https://github.com/cloudflare/cloudflared/releases/download/2024.8.2/cloudflared-linux-amd64
chmod u+x /home/linnzh/.nvm/versions/node/v22.16.0/lib/node_modules/@shopify/cli/bin/cloudflared
```

#### 本地启动

```bash file=bash1
# 启动后端服务：localhost:3333
node index.js
```

```bash file=bash2
# 使用 Cloudflare Tunnel 转发、建立临时公网域名
# 启动后配置公网域名至 .env 中 SHOPIFY_APP_URL 变量
# 以及 shopify.app.toml 中的 application_url、redirect_urls
cloudflared tunnel --url http://localhost:3333
```

```bashh file=bash3
# 先同步 Shopify 配置
shopify app deploy

# 启动本地 Shopify 应用
# 可通过 p/g 键打开 dev 店铺链接进行授权，以及发起 admin GraphQL 请求
shopify app dev
```
