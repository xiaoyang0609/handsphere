// ============================================================
// 零依赖 HTTP 服务器 + 内网穿透指引
// 纯 Node.js 内置模块，无需 npm install
// ============================================================
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 8080;
// 服务 Desktop 目录下的 HandSphere 文件夹
const ROOT = path.join(__dirname);

// MIME 类型
const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js':   'application/javascript',
    '.css':  'text/css',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.gif':  'image/gif',
    '.svg':  'image/svg+xml',
    '.ico':  'image/x-icon',
    '.json': 'application/json',
    '.wasm': 'application/wasm',
    '.tflite': 'application/octet-stream',
    '.task': 'application/octet-stream',
    '.data': 'application/octet-stream',
};

function serve(req, res) {
    let url = req.url.split('?')[0];
    if (url === '/') url = '/index.html';
    const filePath = path.join(ROOT, url);

    // 防止目录穿越
    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403);
        return res.end('Forbidden');
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            // 如果文件不存在，返回 404
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            return res.end(`<h2>404 - 文件未找到</h2><p>${url}</p>`);
        }
        const ext = path.extname(filePath).toLowerCase();
        const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream' };
        // 允许手机摄像头（https 和 localhost 不需要 CORS，但不同IP需要）
        headers['Access-Control-Allow-Origin'] = '*';
        res.writeHead(200, headers);
        res.end(data);
    });
}

// 获取本机局域网 IP
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

// 启动服务器
const server = http.createServer(serve);
server.listen(PORT, '0.0.0.0', () => {
    const localIP = getLocalIP();

    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║     🚀 手势实验室 — 手机访问指南         ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log('');
    console.log('  ✅ 服务器已启动！');
    console.log('');
    console.log('  📱 方式一：局域网（同一WiFi）');
    console.log(`     http://${localIP}:${PORT}/ball.html`);
    console.log(`     http://${localIP}:${PORT}/board.html`);
    console.log('');
    console.log('  📡 方式二：内网穿透（手机用流量/远程）');
    console.log('     在新终端执行：');
    console.log('     ssh -R 80:localhost:' + PORT + ' nokey@localhost.run');
    console.log('     会得到一个 xxx.lhr.life 的公网地址');
    console.log('');
    console.log('  💻 电脑本地访问：');
    console.log(`     http://localhost:${PORT}`);
    console.log('');
    console.log('  ⏎ 按 Ctrl+C 停止服务器');
    console.log('────────────────────────────────────────────');
    console.log('');
});