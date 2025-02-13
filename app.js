// Express服务器配置
const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const app = express();

// 启用 JSON 解析
app.use(express.json());

// 请求日志记录中间件
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// 配置静态文件服务
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: 86400000, // 24小时缓存
    setHeaders: (res, filePath) => {
        // 为 JavaScript 文件设置正确的 MIME 类型
        if (filePath.endsWith('.js')) {
            res.set('Content-Type', 'application/javascript; charset=UTF-8');
        }
        // 为 CSS 文件设置正确的 MIME 类型
        else if (filePath.endsWith('.css')) {
            res.set('Content-Type', 'text/css; charset=UTF-8');
        }
        // 设置缓存控制
        res.set('Cache-Control', 'public, max-age=86400');
    }
}));

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
    console.log('收到名字生成请求:', req.body);
    
    try {
        console.log('开始调用 SiliconFlow API...');
        const response = await fetch('https://api-prod.siliconflow.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer sk-zdonnlmvneeywanlpjyvdiwvvwrcsrwovktugsojsipwtvpr'
            },
            body: JSON.stringify({
                messages: req.body.messages,
                model: "Pro/deepseek-ai/DeepSeek-R1",
                temperature: 0.7,
                max_tokens: 2000,
                stream: false
            }),
            timeout: 30000 // 30秒超时
        });
        
        console.log('API 响应状态:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API 错误响应:', errorText);
            throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API 响应成功');
        res.json(data);
    } catch (error) {
        console.error('API 调用出错:', error);
        res.status(500).json({
            error: '服务器内部错误',
            message: '生成名字时出错，请稍后重试',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('应用错误:', err.stack);
    res.status(500).json({
        error: '服务器内部错误',
        message: process.env.NODE_ENV === 'development' ? err.message : '请稍后重试'
    });
});

// 获取服务器端口和主机
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';  // Railway 需要绑定到 0.0.0.0

// 启动服务器
const server = app.listen(PORT, HOST, () => {
    console.log(`服务器已启动，运行在 ${HOST}:${PORT}`);
    console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
    console.log('你可以通过以下地址访问:');
    console.log(`- 本地访问: http://localhost:${PORT}`);
    if (HOST === '0.0.0.0') {
        console.log(`- 外部访问: http://${HOST}:${PORT}`);
    }
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('收到 SIGTERM 信号: 正在关闭 HTTP 服务器');
    server.close(() => {
        console.log('HTTP 服务器已关闭');
        process.exit(0);
    });
});
