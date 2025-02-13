// Express服务器配置
const express = require('express');
const path = require('path');
const app = express();

// 配置静态文件服务，明确指定 MIME 类型
app.use('/public', express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, path, stat) => {
        if (path.endsWith('.css')) {
            res.set('Content-Type', 'text/css');
        }
        if (path.endsWith('.js')) {
            res.set('Content-Type', 'application/javascript');
        }
    }
}));

// 路由配置
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
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

// 启动服务器
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';  // 允许从任何IP访问

app.listen(PORT, HOST, () => {
    console.log(`服务器已启动！`);
    console.log(`你的朋友可以通过以下地址访问：`);
    console.log(`http://localhost:${PORT}`);
});
