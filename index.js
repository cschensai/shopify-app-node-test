/**
 * server.js - Shopify 非嵌入式应用单文件服务端实现
 * 功能：端口 3333, 手动 OAuth 流程, 全量 Webhook 监听与验签, 结构化日志
 */

require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
// 引入 Shopify 官方库，用于处理核心鉴权逻辑
const { shopifyApi, ApiVersion, LogSeverity } = require('@shopify/shopify-api');
require('@shopify/shopify-api/adapters/node');

// =============================================================================
// 1. 配置与初始化
// =============================================================================

// CLI 为 frontend 角色分配动态端口，应用必须监听该端口而非硬编码值
const PORT = process.env.PORT || process.env.FRONTEND_PORT || 3333;

// 从环境变量获取配置。在 CLI dev HOST 由 CLI 自动注入
const HOST = process.env.HOST || process.env.SHOPIFY_APP_URL || `http://localhost:${PORT}`;
const API_KEY = process.env.SHOPIFY_API_KEY;
const API_SECRET = process.env.SHOPIFY_API_SECRET;
// 获取我们在 TOML 中配置的 Extensive Scopes
const SCOPES = process.env.SCOPES? process.env.SCOPES.split(',') : ['read_products'];

if (!API_KEY ||!API_SECRET) {
  console.error('❌ 错误: 缺少 SHOPIFY_API_KEY 或 SHOPIFY_API_SECRET 环境变量。');
  console.error('   请确保通过 "shopify app dev" 启动，或手动配置.env 文件。');
  process.exit(1);
}

// 初始化 Shopify API 上下文
const shopify = shopifyApi({
  apiKey: API_KEY,
  apiSecretKey: API_SECRET,
  scopes: SCOPES,
  hostName: HOST.replace(/^https?:\/\//, ''),
  hostScheme: 'https',
  apiVersion: ApiVersion.October24, // 使用最新稳定版 API
  isEmbeddedApp: false, // CRITICAL: 显式声明为非嵌入式应用
  logger: {
    level: LogSeverity.Info, // 开启 Info 级别日志
  },
});

const app = express();

// =============================================================================
// 2. 中间件配置
// =============================================================================

// HMAC 验签需要获取原始的请求体 (Raw Body)
// 我们在这里配置 express.json，在解析 JSON 之前保留原始 Buffer
app.use(express.json({
  limit: '50mb', // 应对大数据量的 Webhook (如 heavy product updates)
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

app.use(cookieParser());

// 自定义日志中间件：记录所有进出的请求
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  console.log(`[${timestamp}] 📡 ${method} ${url}`);
  next();
});

// =============================================================================
// 3. OAuth 2.0 授权流程 (非嵌入式 Manual Flow)
// =============================================================================

/**
 * 路由: /auth
 * 作用: OAuth 流程的起点。商家点击安装应用后被重定向至此。
 */
app.get('/auth', async (req, res) => {
  const shop = req.query.shop;
  
  if (!shop) {
    return res.status(400).send('❌ 缺少 "shop" 参数。请通过 Shopify 后台安装应用。');
  }

  // 1. 验证 Shop 域名的合法性
  const cleanShop = shopify.utils.sanitizeShop(shop);
  if (!cleanShop) {
    return res.status(400).send('❌ 无效的 Shop 域名。');
  }

  console.log(`🔄 开始为店铺 ${cleanShop} 发起 OAuth 流程...`);

  // 2. 调用 beginAuth 生成授权 URL 并重定向
  // 非嵌入式应用通常使用 Offline Token (离线 Token)，因为它永不过期，适合后台任务
  try {
    await shopify.auth.begin({
      shop: cleanShop,
      callbackPath: '/auth/callback',
      isOnline: false, // 请求离线 Access Token
      rawRequest: req,
      rawResponse: res,
    });
  } catch (error) {
    console.error(`❌ OAuth 初始化失败: ${error.message}`);
    res.status(500).send('OAuth 初始化失败');
  }
});

/**
 * 路由: /auth/callback
 * 作用: Shopify 授权后的回调地址。在此处交换 Access Token。
 */
app.get('/auth/callback', async (req, res) => {
  try {
    // 1. 验证回调参数 (HMAC, Nonce 等) 并获取 Session
    const callbackResponse = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: res,
    });

    const { session } = callbackResponse;
    
    // 2. 此时已成功获取 Access Token
    console.log(`✅ OAuth 成功! 店铺: ${session.shop}`);
    console.log(`🔑 Access Token (Offline): ${session.accessToken}`);
    
    // 3. (重要) 在此处将 Session 存储到数据库 (Redis/MySQL)
    // 示例代码省略数据库操作，但在生产环境中这是必须的。
    // await db.storeSession(session);

    // 4. 重定向到应用的主页，使用 installed=1 标记已完成授权
    res.redirect(`/?shop=${session.shop}&installed=1`);

  } catch (error) {
    console.error(`❌ OAuth 回调处理失败: ${error.message}`);
    
    // 常见错误处理：Cookie 丢失或签名不匹配
    if (error.message.includes('CookieNotFound')) {
      res.status(403).send('Session Cookie 丢失，请重新发起授权。');
    } else {
      res.status(500).send('OAuth 回调验证失败');
    }
  }
});

// =============================================================================
// 4. Webhook 处理与 HMAC 验签
// =============================================================================

/**
 * 路由: /api/webhooks
 * 作用: 统一接收所有 Webhook 推送的端点
 */
app.post('/api/webhooks', async (req, res) => {
  try {
    // 获取 Shopify 传递的头部信息
    const hmacHeader = req.get('X-Shopify-Hmac-Sha256');
    const topic = req.get('X-Shopify-Topic');
    const shop = req.get('X-Shopify-Shop-Domain');
    const webhookId = req.get('X-Shopify-Webhook-Id');

    // 1. 基础校验
    if (!hmacHeader ||!req.rawBody) {
      console.warn('⚠️ 收到无签名或无 Body 的请求，拒绝访问。');
      return res.status(401).send('Unauthorized');
    }

    // 2. HMAC 签名验证 (核心安全逻辑)
    // 使用 API Secret 计算 Body 的 Hash，并与 Header 进行比对
    const generatedHash = crypto
     .createHmac('sha256', API_SECRET)
     .update(req.rawBody)
     .digest('base64');

    // 使用 timingSafeEqual 防止时序攻击
    const hashBuffer = Buffer.from(generatedHash, 'utf-8');
    const headerBuffer = Buffer.from(hmacHeader, 'utf-8');

    // 长度检查防止 Buffer 构造错误
    if (hashBuffer.length!== headerBuffer.length || !crypto.timingSafeEqual(hashBuffer, headerBuffer)) {
      console.error(`⛔ HMAC 验签失败! Topic: ${topic} | Shop: ${shop}`);
      return res.status(401).send('HMAC Validation Failed');
    }

    // 3. 验签通过，记录完整请求信息
    console.log(`🔔 收到 Webhook: ${topic} | Shop: ${shop} | ID: ${webhookId}`);
    console.log(`📋 Headers:`, JSON.stringify({
      'X-Shopify-Topic': topic,
      'X-Shopify-Shop-Domain': shop,
      'X-Shopify-Webhook-Id': webhookId,
      'X-Shopify-API-Version': req.get('X-Shopify-API-Version'),
      'X-Shopify-Hmac-Sha256': hmacHeader.substring(0, 20) + '...'
    }, null, 2));
    console.log(`📦 Payload:`, JSON.stringify(req.body, null, 2));
    
    // (可选) 在此处进行 Webhook幂等性检查 (基于 Webhook ID 防止重复处理)

    // 4. 立即返回 200 OK
    // Shopify 要求在 5 秒内响应，否则视为超时并重试。
    // 因此，复杂的业务逻辑建议放入异步队列。
    res.status(200).send('Webhook Received');

    // 5. 异步处理 Webhook Payload
    processWebhookPayload(topic, req.body, shop);

  } catch (error) {
    console.error(`💥 Webhook 处理异常: ${error.message}`);
    // 即使发生内部错误，有时也建议返回 200 以避免 Shopify 无限重试（取决于业务策略）
    res.status(500).send('Server Error');
  }
});

/**
 * 业务逻辑分发器
 */
function processWebhookPayload(topic, payload, shop) {
  // 模拟异步处理
  setImmediate(() => {
    switch (topic) {
      case 'products/update':
        console.log(`📦 [${shop}] 商品更新: ${payload.title} (ID: ${payload.id})`);
        break;
      case 'orders/create':
        console.log(`💰 [${shop}] 新订单创建: ${payload.name} (Total: ${payload.total_price})`);
        break;
      case 'app/uninstalled':
        console.log(`🗑️ [${shop}] 应用已卸载，清理数据库数据...`);
        break;
      default:
        console.log(`ℹ️ [${shop}] 未专门处理的 Topic: ${topic}`);
    }
  });
}

// =============================================================================
// 5. 前端 UI 入口
// =============================================================================

app.get('/', async (req, res) => {
  const shop = req.query.shop;
  const installed = req.query.installed;

  if (shop && !installed) {
    const cleanShop = shopify.utils.sanitizeShop(shop);

    if (!cleanShop) {
      return res.status(400).send('Invalid shop parameter');
    }

    const hmac = req.query.hmac;
    if (hmac) {
      const params = { ...req.query };
      delete params.hmac;
      const queryString = Object.keys(params)
        .map(key => `${key}=${params[key]}`)
        .sort()
        .join('&');
      const hash = crypto
        .createHmac('sha256', API_SECRET)
        .update(queryString)
        .digest('hex');

      if (hash !== hmac) {
        return res.status(401).send('HMAC validation failed');
      }
    }

    console.log(`🔍 检测到店铺访问: ${cleanShop}，重定向到授权流程...`);
    return res.redirect(`/auth?shop=${cleanShop}`);
  }

  res.send(`
    <html>
      <head>
        <title>Non-Embedded App</title>
        <style>
          body { font-family: sans-serif; padding: 50px; text-align: center; }
         .status { padding: 20px; background: #f4f6f8; border-radius: 8px; display: inline-block; }
         .success { padding: 20px; background: #d4edda; border-radius: 8px; display: inline-block; color: #155724; }
        </style>
      </head>
      <body>
        <h1>🚀 非嵌入式应用运行中</h1>
        ${shop && installed ? `
          <div class="success">
            <h2>✅ 授权成功！</h2>
            <p>当前连接店铺: <strong>${shop}</strong></p>
            <p>应用已成功安装并获取 Access Token</p>
          </div>
        ` : `
          <div class="status">
            <p>监听端口: <strong>${PORT}</strong></p>
            <p>Tunnel URL: <strong>${HOST}</strong></p>
          </div>
          <br/><br/>
          <p><a href="/auth?shop=YOUR_TEST_STORE.myshopify.com">👉 点击此处手动发起测试授权</a></p>
        `}
      </body>
    </html>
  `);
});

// =============================================================================
// 6. 启动服务器
// =============================================================================

app.listen(PORT, () => {
  console.log(`\n---------------------------------------------------------`);
  console.log(`⚡️ 服务器已启动，监听端口: ${PORT}`);
  console.log(`🌍 公网 Tunnel URL (HOST): ${HOST}`);
  console.log(`🔧 请确保 shopify.app.toml 中的 application_url 与此一致`);
  console.log(`---------------------------------------------------------\n`);
});
