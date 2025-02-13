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

// 启动服务器
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';  // 允许从任何IP访问

app.listen(PORT, HOST, () => {
    console.log(`服务器已启动！`);
    console.log(`你的朋友可以通过以下地址访问：`);
    console.log(`http://localhost:${PORT}`);
});
