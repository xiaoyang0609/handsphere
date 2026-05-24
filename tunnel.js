const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');

const ROOT = path.join(os.homedir(), 'Desktop', 'HandSphere');
const URL_FILE = path.join(ROOT, 'tunnel-url.txt');

function log(msg) { console.log(msg); }

// 1. Kill old processes
try {
    execSync('taskkill /f /fi "WINDOWTITLE eq *HandSphere*python*" 2>nul', { stdio: 'ignore' });
} catch (e) {}

// 2. Start HTTP server
const httpServer = spawn('python', ['-m', 'http.server', '8080'], {
    cwd: ROOT,
    stdio: 'ignore',
    detached: true,
});
httpServer.unref();
log('✅ 本地 HTTP 服务已启动 (端口 8080)');

// 3. Start SSH tunnel and capture URL
log('⏳ 正在建立公网隧道...');

const ssh = spawn('ssh', [
    '-o', 'StrictHostKeyChecking=no',
    '-o', 'ServerAliveInterval=30',
    '-R', '80:localhost:8080',
    'nokey@localhost.run'
], { stdio: ['ignore', 'pipe', 'pipe'] });

let tunnelUrl = '';

ssh.stdout.on('data', (data) => {
    const text = data.toString();
    process.stdout.write(text);
    
    // Extract URL: something like "abc123.lhr.life tunneled with tls termination, https://abc123.lhr.life"
    const match = text.match(/https:\/\/[a-z0-9-]+\.lhr\.life/);
    if (match) {
        tunnelUrl = match[0];
        fs.writeFileSync(URL_FILE, tunnelUrl);
        showBanner(tunnelUrl);
    }
});

ssh.stderr.on('data', (data) => {
    process.stderr.write(data.toString());
});

ssh.on('exit', (code) => {
    log(`\n❌ SSH 隧道已断开 (exit code: ${code})`);
});

// Show result
function showBanner(url) {
    const cleanUrl = url.trim();
    log('');
    log('╔══════════════════════════════════════════╗');
    log('║    🌐 公网隧道已就绪！                    ║');
    log('║                                          ║');
    log(`║    📡 ${cleanUrl}`);
    log('║                                          ║');
    log('║    💡 把上面这个链接发给你的朋友            ║');
    log('║    手机电脑都能直接打开使用！              ║');
    log('╚══════════════════════════════════════════╝');
    log('');
    log('   🔒 本地: http://localhost:8080');
    log('');
    log('   ⏎ 按回车键关闭所有服务...');
    
    process.stdin.once('data', () => {
        ssh.kill();
        httpServer.kill();
        try { execSync('taskkill /f /fi "WINDOWTITLE eq *HandSphere*" 2>nul', { stdio: 'ignore' }); } catch(e) {}
        log('服务已关闭。');
        process.exit(0);
    });
}

// Also show a default message if URL capture takes time
setTimeout(() => {
    if (!tunnelUrl) {
        log('');
        log('⏳ 隧道正在连接中，请稍候...');
        log('   如果长时间无响应，按 Ctrl+C 重试。');
        log('');
    }
}, 5000);
