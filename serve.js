const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const selfsigned = require('selfsigned');

const PORT = 8080;
const ROOT = path.join(process.env.USERPROFILE || '~', 'Desktop', 'HandSphere');
const CERT_DIR = path.join(ROOT, '.cert');

// 生成或读取自签证书
function getCert() {
    const keyFile = path.join(CERT_DIR, 'key.pem');
    const certFile = path.join(CERT_DIR, 'cert.pem');
    
    if (fs.existsSync(keyFile) && fs.existsSync(certFile)) {
        return { key: fs.readFileSync(keyFile), cert: fs.readFileSync(certFile) };
    }
    
    console.log('🔐 生成自签证书...');
    if (!fs.existsSync(CERT_DIR)) fs.mkdirSync(CERT_DIR, { recursive: true });
    
    const attrs = [{ name: 'commonName', value: '192.168.137.1' }];
    const pems = selfsigned.generate(attrs, { days: 365, keySize: 2048 });
    
    fs.writeFileSync(keyFile, pems.private);
    fs.writeFileSync(certFile, pems.cert);
    console.log('✅ 证书已生成');
    return { key: Buffer.from(pems.private), cert: Buffer.from(pems.cert) };
}

// MIME
const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.json': 'application/json',
    '.wasm': 'application/wasm',
};

function serve(req, res) {
    let url = req.url.split('?')[0];
    if (url === '/') url = '/index.html';
    const filePath = path.join(ROOT, url);
    
    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403); return res.end('Forbidden');
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404); return res.end('Not Found');
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
    });
}

// 启动 HTTPS（手机可连）
try {
    const cert = getCert();
    https.createServer(cert, serve).listen(PORT, '0.0.0.0', () => {
        console.log('');
        console.log('╔══════════════════════════════════════╗');
        console.log('║   🌐 手势交互实验室 — 手机端访问     ║');
        console.log('╚══════════════════════════════════════╝');
        console.log('');
        console.log('  📱 手机打开：');
        console.log(`  https://192.168.137.1:${PORT}`);
        console.log('');
        console.log('  💡 首次访问提示"不安全"或"您的连接不是私密连接"');
        console.log('     ➜ Android: 点「继续前往」');
        console.log('     ➜ iPhone:  点「显示详细信息」→「访问此网站」');
        console.log('');
        console.log('  💡 电脑依然可访问 http://localhost:8080');
        console.log('────────────────────────────────────────');
        console.log('');
    });
} catch (e) {
    console.error('❌ HTTPS 启动失败:', e.message);
    console.log('→ 退回 HTTP 模式（手机无法使用摄像头）');
    http.createServer(serve).listen(PORT, '0.0.0.0');
    console.log(`   http://192.168.137.1:${PORT}`);
}
