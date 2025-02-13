// Express服务器配置
const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const app = express();

// 启用 JSON 解析
app.use(express.json());

// 记录所有请求的中间件
app.use((req, res, next) => {
    const start = Date.now();
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} 开始处理`);
    
    // 在响应结束时记录
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} 处理完成 - 耗时: ${duration}ms`);
    });
    
    next();
});

// 设置基本的安全头
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' https://api.siliconflow.com");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// 配置静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 主页路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 代理 API 请求
app.post('/api/generate-names', async (req, res) => {
    console.log('\n=== 开始处理名字生成请求 ===');
    console.log('请求体:', JSON.stringify(req.body, null, 2));
    
    try {
        // 验证请求格式
        if (!req.body.messages || !Array.isArray(req.body.messages)) {
            throw new Error('无效的请求格式：缺少 messages 数组');
        }

        // 检查 API 密钥
        const apiKey = process.env.SILICONFLOW_API_KEY;
        if (!apiKey) {
            console.error('未找到 API 密钥');
            throw new Error('服务器配置错误：未找到 API 密钥');
        }

        // 构建请求体
        const requestBody = {
            model: "Pro/deepseek-ai/DeepSeek-R1",
            messages: req.body.messages,
            temperature: 0.7,
            max_tokens: 2000,
            stream: false
        };
        
        console.log('\n发送到 API 的请求体:', JSON.stringify(requestBody, null, 2));

        // 设置超时控制
        const controller = new AbortController();
        const timeout = setTimeout(() => {
            controller.abort();
            console.log('请求超时，正在中止...');
        }, 120000);

        console.log('\n开始调用 SiliconFlow API...');
        const response = await fetch('https://api.siliconflow.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });

        clearTimeout(timeout);

        console.log('\nAPI 响应状态:', response.status);
        console.log('API 响应头:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API 错误响应:', errorText);
            throw new Error(`API responded with status: ${response.status}\nResponse: ${errorText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.error('意外的响应类型:', contentType);
            throw new Error('API 返回了意外的响应类型');
        }

        const data = await response.json();
        console.log('\nAPI 响应数据:', JSON.stringify(data, null, 2));

        res.json(data);
        
    } catch (error) {
        console.error('\n处理请求时出错:', error);
        
        // 返回用户友好的错误信息
        res.status(500).json({
            error: '生成名字时出错，请稍后重试',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';

// 启动服务器
const server = app.listen(PORT, HOST, () => {
    console.log(`服务器运行在 http://${HOST}:${PORT}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('收到 SIGTERM 信号，准备关闭服务器...');
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
});
