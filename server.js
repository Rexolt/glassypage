const express = require('express');
const fs = require('fs');
const path = require('path');
const { execFileSync, execSync } = require('child_process');
const os = require('os');
const RSSParser = require('rss-parser');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;
const CONFIG_PATH = path.join(__dirname, 'config.json');
const CONFIG_EXAMPLE_PATH = path.join(__dirname, 'config.example.json');
const SCRATCHPAD_PATH = path.join(__dirname, 'scratchpad.txt');
const PLUGINS_DIR = path.join(__dirname, 'plugins');
const rssParser = new RSSParser();

// Ensure plugins directory exists
if (!fs.existsSync(PLUGINS_DIR)) fs.mkdirSync(PLUGINS_DIR, { recursive: true });

// Bootstrap a personal config.json from the shipped example on first run.
// config.json is git-ignored (user/runtime data); config.example.json is the
// tracked default that ships with the repo.
if (!fs.existsSync(CONFIG_PATH) && fs.existsSync(CONFIG_EXAMPLE_PATH)) {
  try {
    fs.copyFileSync(CONFIG_EXAMPLE_PATH, CONFIG_PATH);
    console.log('  ⚙️  Seeded config.json from config.example.json');
  } catch (err) {
    console.error('Failed to seed config.json:', err.message);
  }
}

// In-memory clipboard for AirDrop
let clipboardData = { text: '', timestamp: 0, id: 0 };
let clipboardCounter = 0;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.text({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/plugins', express.static(PLUGINS_DIR));

// ============================================
// HELPERS
// ============================================
function readConfig() {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
  return JSON.parse(raw);
}

function writeConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

// SECURITY: Safe exec using execFile — no shell interpretation, args passed as array
function safeExecFile(file, args = [], timeout = 5000) {
  try {
    return execFileSync(file, args, {
      timeout,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
  } catch {
    return null;
  }
}

// Exec helper — runs through a shell, callers MUST validate/whitelist input.
// Falls back to /bin/sh when bash is missing (e.g. minimal Debian / Alpine).
const SHELL = fs.existsSync('/bin/bash') ? '/bin/bash' : '/bin/sh';
function safeExecCmd(cmd, timeout = 5000) {
  try {
    return execSync(cmd, {
      timeout,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: SHELL
    }).trim();
  } catch {
    return null;
  }
}

// ============================================
// DISTRO DETECTION (cross-distro support)
// Arch · Debian/Ubuntu · Fedora/RHEL · openSUSE · Alpine
// ============================================
let _distroCache = null;
function detectDistro() {
  if (_distroCache) return _distroCache;

  let id = '', idLike = '', pretty = '';
  try {
    const txt = fs.readFileSync('/etc/os-release', 'utf-8');
    const get = (key) => {
      const m = txt.match(new RegExp('^' + key + '=(.*)$', 'm'));
      return m ? m[1].replace(/^"|"$/g, '').trim() : '';
    };
    id = get('ID').toLowerCase();
    idLike = get('ID_LIKE').toLowerCase();
    pretty = get('PRETTY_NAME') || get('NAME');
  } catch { /* /etc/os-release missing (e.g. inside a slim container) */ }

  const hay = `${id} ${idLike}`;
  let manager = 'unknown';
  if (/\b(arch|manjaro|endeavouros|garuda|artix|cachyos)\b/.test(hay)) manager = 'pacman';
  else if (/\b(debian|ubuntu|raspbian|linuxmint|mint|pop|elementary|kali|devuan|deepin|zorin|mx)\b/.test(hay)) manager = 'apt';
  else if (/\b(fedora|rhel|centos|rocky|almalinux|nobara|ol)\b/.test(hay)) manager = 'dnf';
  else if (/\b(opensuse|suse|sles)\b/.test(hay)) manager = 'zypper';
  else if (/\b(alpine)\b/.test(hay)) manager = 'apk';

  // Fallback: probe for the package-manager binaries if os-release was inconclusive
  if (manager === 'unknown') {
    const has = (bin) => !!safeExecCmd(`command -v ${bin} >/dev/null 2>&1 && echo y`, 3000);
    if (has('checkupdates') || has('pacman')) manager = 'pacman';
    else if (has('apt')) manager = 'apt';
    else if (has('dnf') || has('yum')) manager = 'dnf';
    else if (has('zypper')) manager = 'zypper';
    else if (has('apk')) manager = 'apk';
  }

  _distroCache = {
    id: id || 'linux',
    name: pretty || 'Linux',
    packageManager: manager
  };
  return _distroCache;
}

// Returns the list of pending package updates for the given package manager.
// All commands read the LOCAL package cache only — no root and no network
// required (so it works unprivileged, inside containers, and on Debian).
function getPendingUpdates(manager) {
  switch (manager) {
    case 'pacman': {
      const out = safeExecCmd('checkupdates 2>/dev/null', 12000);
      return (out || '').split('\n').filter(Boolean).map(line => {
        const p = line.split(/\s+/);
        return { name: p[0], from: p[1], to: p[3] };
      });
    }
    case 'apt': {
      const out = safeExecCmd('apt list --upgradable 2>/dev/null', 12000);
      return (out || '').split('\n').filter(l => l.includes('[upgradable')).map(line => {
        // e.g.  vim/stable 2:8.2 amd64 [upgradable from: 2:8.1]
        const name = line.split('/')[0];
        const to = line.split(/\s+/)[1] || '';
        const from = (line.match(/upgradable from:\s*([^\]]+)\]/) || [])[1] || '';
        return { name, from: from.trim(), to };
      });
    }
    case 'dnf': {
      // `dnf check-update` exits 100 when updates exist → force exit 0 to keep output.
      const out = safeExecCmd('dnf -q check-update 2>/dev/null; true', 20000);
      return (out || '').split('\n').filter(l => /^\S+\.\S+\s+\S+\s+\S+/.test(l)).map(line => {
        const p = line.split(/\s+/);
        return { name: p[0], from: '', to: p[1] };
      });
    }
    case 'zypper': {
      const out = safeExecCmd('zypper -q list-updates 2>/dev/null; true', 20000);
      return (out || '').split('\n').filter(l => l.startsWith('v |')).map(line => {
        const c = line.split('|').map(s => s.trim());
        return { name: c[2] || '', from: c[3] || '', to: c[4] || '' };
      });
    }
    case 'apk': {
      const out = safeExecCmd("apk version -l '<' 2>/dev/null; true", 12000);
      return (out || '').split('\n').filter(l => l.includes('<') && !/Installed/.test(l)).map(line => {
        return { name: line.split(/\s+/)[0], from: '', to: '' };
      });
    }
    default:
      return [];
  }
}

// SECURITY: Validate URL — only http/https, no private IPs
function isValidExternalUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    if (!['http:', 'https:'].includes(u.protocol)) return false;
    // Block private/loopback IPs
    const hostname = u.hostname;
    if (['localhost', '127.0.0.1', '::1', '0.0.0.0'].includes(hostname)) return false;
    // Block private ranges
    const parts = hostname.split('.');
    if (parts.length === 4) {
      const a = parseInt(parts[0]);
      if (a === 10) return false;
      if (a === 127) return false;
      if (a === 169 && parseInt(parts[1]) === 254) return false;
      if (a === 172 && parseInt(parts[1]) >= 16 && parseInt(parts[1]) <= 31) return false;
      if (a === 192 && parseInt(parts[1]) === 168) return false;
    }
    return true;
  } catch {
    return false;
  }
}

// SECURITY: Validate config schema
function validateConfig(cfg) {
  if (!cfg || typeof cfg !== 'object') return false;
  // Check required string fields
  const stringFields = ['searchEngine', 'searchEngineName', 'backgroundUrl', 'weatherCity', 'userName', 'themeMode', 'activeTheme', 'packageManager'];
  for (const f of stringFields) {
    if (cfg[f] !== undefined && typeof cfg[f] !== 'string') return false;
  }
  // Check arrays
  if (cfg.categories && !Array.isArray(cfg.categories)) return false;
  if (cfg.todos && !Array.isArray(cfg.todos)) return false;
  if (cfg.rssFeeds && !Array.isArray(cfg.rssFeeds)) return false;
  if (cfg.events && !Array.isArray(cfg.events)) return false;
  if (cfg.widgetLayout && !Array.isArray(cfg.widgetLayout)) return false;
  if (cfg.customThemes && !Array.isArray(cfg.customThemes)) return false;
  if (cfg.plugins && !Array.isArray(cfg.plugins)) return false;
  // Check booleans
  if (cfg.terminalEnabled !== undefined && typeof cfg.terminalEnabled !== 'boolean') return false;
  // Size limit (prevent abuse)
  const json = JSON.stringify(cfg);
  if (json.length > 50000000) return false; // 50MB max
  return true;
}

// ============================================
// API: CONFIG
// ============================================
app.get('/api/config', (req, res) => {
  try {
    res.json(readConfig());
  } catch (err) {
    console.error('Failed to read config:', err.message);
    res.status(500).json({ error: 'Failed to read configuration' });
  }
});

app.post('/api/config', (req, res) => {
  try {
    if (!validateConfig(req.body)) {
      return res.status(400).json({ error: 'Invalid configuration format' });
    }
    writeConfig(req.body);
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to save config:', err.message);
    res.status(500).json({ error: 'Failed to save configuration' });
  }
});

// ============================================
// API: WEATHER
// ============================================
const weatherCache = new Map();
const WEATHER_CACHE_TTL = 10 * 60 * 1000;

app.get('/api/weather', async (req, res) => {
  const city = req.query.city || 'Budapest';
  const cached = weatherCache.get(city);
  if (cached && Date.now() - cached.timestamp < WEATHER_CACHE_TTL) {
    return res.json(cached.data);
  }
  try {
    const response = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
    if (!response.ok) throw new Error(`wttr.in responded with ${response.status}`);
    const data = await response.json();
    const current = data.current_condition?.[0] || {};
    const payload = {
      temp_C: current.temp_C || '—',
      temp_F: current.temp_F || '—',
      feelslike_C: current.FeelsLikeC || '—',
      humidity: current.humidity || '—',
      description: current.weatherDesc?.[0]?.value || 'N/A',
      weatherCode: current.weatherCode || '113',
      windspeedKmph: current.windspeedKmph || '—',
      city: city
    };
    weatherCache.set(city, { data: payload, timestamp: Date.now() });
    res.json(payload);
  } catch (err) {
    console.error('Weather fetch failed:', err.message);
    res.json({ temp_C: '—', description: 'Unavailable', weatherCode: '113', city });
  }
});

// ============================================
// API: SYSTEM STATUS
// ============================================
app.get('/api/system', (req, res) => {
  try {
    let cpuPercent = 0;
    try {
      const loadAvg = os.loadavg()[0];
      const cpuCount = os.cpus().length;
      cpuPercent = Math.min(100, Math.round((loadAvg / cpuCount) * 100));
    } catch { cpuPercent = 0; }

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ramPercent = Math.round((usedMem / totalMem) * 100);
    const ramUsedGB = (usedMem / 1073741824).toFixed(1);
    const ramTotalGB = (totalMem / 1073741824).toFixed(1);

    let diskPercent = 0, diskUsed = '—', diskTotal = '—';
    const dfOutput = safeExecCmd("df -h / | tail -1 | awk '{print $3, $4, $5}'");
    if (dfOutput) {
      const parts = dfOutput.split(/\s+/);
      diskUsed = parts[0] || '—';
      diskTotal = parts[1] || '—';
      diskPercent = parseInt(parts[2]) || 0;
    }

    let uptimeStr = '—';
    try {
      const uptimeSec = os.uptime();
      const days = Math.floor(uptimeSec / 86400);
      const hours = Math.floor((uptimeSec % 86400) / 3600);
      const mins = Math.floor((uptimeSec % 3600) / 60);
      if (days > 0) uptimeStr = `${days}d ${hours}h ${mins}m`;
      else if (hours > 0) uptimeStr = `${hours}h ${mins}m`;
      else uptimeStr = `${mins}m`;
    } catch {}

    const distro = detectDistro();
    res.json({
      cpu: { percent: cpuPercent, cores: os.cpus().length },
      ram: { percent: ramPercent, used: ramUsedGB, total: ramTotalGB },
      disk: { percent: diskPercent, used: diskUsed, total: diskTotal },
      uptime: uptimeStr,
      hostname: os.hostname(),
      os: { name: distro.name, id: distro.id, packageManager: distro.packageManager },
      kernel: os.release(),
      platform: process.platform,
      arch: process.arch
    });
  } catch (err) {
    res.json({ cpu: { percent: 0 }, ram: { percent: 0 }, disk: { percent: 0 }, uptime: '—' });
  }
});

// ============================================
// API: PACKAGE UPDATES (distro-aware: pacman / apt / dnf / zypper / apk)
// ============================================
const VALID_MANAGERS = ['pacman', 'apt', 'dnf', 'zypper', 'apk'];

app.get('/api/updates', (req, res) => {
  try {
    const distro = detectDistro();
    // Optional override from config (e.g. "packageManager": "apt") or query string
    let manager = distro.packageManager;
    try {
      const cfg = readConfig();
      if (VALID_MANAGERS.includes(cfg.packageManager)) manager = cfg.packageManager;
    } catch { /* config unreadable — fall back to detected manager */ }
    if (VALID_MANAGERS.includes(req.query.manager)) manager = req.query.manager;

    const pkgs = getPendingUpdates(manager);
    res.json({
      count: pkgs.length,
      packages: pkgs.slice(0, 20),
      manager,
      distro: distro.name,
      distroId: distro.id
    });
  } catch (err) {
    res.json({ count: 0, packages: [], error: err.message });
  }
});

// ============================================
// API: NETWORK / PING (SECURITY: strict target validation)
// ============================================
app.get('/api/network', (req, res) => {
  const target = req.query.target || '8.8.8.8';
  // SECURITY: Only allow valid hostnames and IPs
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,253}[a-zA-Z0-9]$/.test(target) && !/^\d{1,3}(\.\d{1,3}){3}$/.test(target)) {
    return res.status(400).json({ error: 'Invalid target' });
  }
  try {
    const output = safeExecCmd(`ping -c 1 -W 2 ${target}`, 5000);
    if (output) {
      const match = output.match(/time=([\d.]+)\s*ms/);
      res.json({ online: true, latency: match ? parseFloat(match[1]) : null, target });
    } else {
      res.json({ online: false, latency: null, target });
    }
  } catch {
    res.json({ online: false, latency: null, target });
  }
});

// ============================================
// API: MEDIA (MPRIS / playerctl)
// ============================================
app.get('/api/media', (req, res) => {
  try {
    const status = safeExecCmd('playerctl status 2>/dev/null');
    if (!status || status === 'No players found') {
      return res.json({ playing: false });
    }
    const title = safeExecCmd('playerctl metadata title 2>/dev/null') || '';
    const artist = safeExecCmd('playerctl metadata artist 2>/dev/null') || '';
    const album = safeExecCmd('playerctl metadata album 2>/dev/null') || '';
    const artUrl = safeExecCmd('playerctl metadata mpris:artUrl 2>/dev/null') || '';
    const player = safeExecCmd('playerctl metadata --format "{{playerName}}" 2>/dev/null') || '';
    res.json({ playing: status === 'Playing', paused: status === 'Paused', status: status.toLowerCase(), title, artist, album, artUrl, player });
  } catch {
    res.json({ playing: false });
  }
});

app.post('/api/media/control', (req, res) => {
  const { action } = req.body;
  const allowed = ['play-pause', 'next', 'previous', 'play', 'pause'];
  if (!allowed.includes(action)) return res.status(400).json({ error: 'Invalid action' });
  try { safeExecCmd(`playerctl ${action} 2>/dev/null`); res.json({ success: true }); } catch { res.json({ success: false }); }
});

// ============================================
// API: TERMINAL (SECURITY: whitelist approach)
// ============================================
// Only allow these commands (and their common paths)
const ALLOWED_COMMANDS = [
  'ls', 'cat', 'head', 'tail', 'wc', 'grep', 'find', 'which', 'whereis',
  'echo', 'printf', 'date', 'cal', 'uptime', 'whoami', 'hostname', 'uname',
  'free', 'df', 'du', 'lsblk', 'lscpu', 'lsusb', 'lspci', 'ip', 'ss',
  'ps', 'top', 'htop', 'btop', 'neofetch', 'fastfetch', 'screenfetch', 'lsb_release',
  // Package managers (read/query — installs still need root which is blocked)
  'pacman', 'paru', 'yay', 'checkupdates',
  'apt', 'apt-get', 'apt-cache', 'apt-mark', 'dpkg', 'dpkg-query', 'aptitude', 'nala',
  'dnf', 'yum', 'rpm', 'zypper', 'apk', 'flatpak', 'snap',
  'git', 'node', 'python', 'python3', 'pip', 'pip3', 'npm', 'npx', 'cargo', 'rustc', 'go',
  'pwd', 'env', 'printenv', 'id', 'groups', 'file', 'stat', 'md5sum', 'sha256sum',
  'sort', 'uniq', 'cut', 'tr', 'sed', 'awk', 'diff', 'comm',
  'ping', 'dig', 'nslookup', 'traceroute', 'curl', 'wget',
  'sensors', 'acpi', 'xdg-open', 'playerctl', 'pactl', 'amixer',
  'systemctl', 'journalctl', 'loginctl', 'timedatectl', 'docker', 'podman',
  'man', 'help', 'type', 'command'
];

// Commands that are always blocked even in pipes
const ALWAYS_BLOCKED = [
  'rm', 'rmdir', 'dd', 'mkfs', 'format', 'shutdown', 'reboot', 'poweroff',
  'halt', 'init', 'passwd', 'useradd', 'userdel', 'groupadd', 'groupdel',
  'chown', 'chmod', 'chroot', 'mount', 'umount', 'fdisk', 'parted',
  'sudo', 'su', 'doas', 'mv', 'cp', 'ln', 'mknod', 'mktemp',
  'iptables', 'nft', 'firewall-cmd', 'eval', 'exec',
  'bash', 'sh', 'zsh', 'fish', 'csh', 'dash'
];

app.post('/api/exec', (req, res) => {
  try {
    const config = readConfig();
    if (!config.terminalEnabled) {
      return res.status(403).json({ error: 'Terminal is disabled' });
    }

    const { command } = req.body;
    if (!command || typeof command !== 'string' || command.length > 500) {
      return res.status(400).json({ error: 'Invalid command' });
    }

    // SECURITY: Block dangerous patterns (subshells, backgrounding, redirection to absolute paths)
    if (/[`]|\$\(|\$\{|>\s*\/|<\(|\n/.test(command)) {
      return res.json({ output: '⛔ Blocked: dangerous shell pattern detected.', exitCode: 1 });
    }

    // SECURITY: Check all commands in pipe/chain (|, ||, &&, &, ;)
    const segments = command.split(/\s*(?:\|\|?|&&?|;)\s*/);
    for (const seg of segments) {
      const firstWord = seg.trim().split(/\s+/)[0]?.toLowerCase();
      if (!firstWord) continue;
      if (ALWAYS_BLOCKED.includes(firstWord)) {
        return res.json({ output: `⛔ Blocked: "${firstWord}" is not allowed.`, exitCode: 1 });
      }
      if (!ALLOWED_COMMANDS.includes(firstWord)) {
        return res.json({ output: `⛔ Unknown command: "${firstWord}". Only whitelisted commands are allowed.`, exitCode: 1 });
      }
    }

    const output = safeExecCmd(command, 5000);
    res.json({
      output: output !== null ? output : 'Command failed or timed out.',
      exitCode: output !== null ? 0 : 1
    });
  } catch (err) {
    res.json({ output: err.message, exitCode: 1 });
  }
});

// ============================================
// API: RSS FEED (SECURITY: URL validation + content snippets)
// ============================================
const rssCache = new Map();
const RSS_CACHE_TTL = 10 * 60 * 1000;

app.get('/api/rss', async (req, res) => {
  const feedUrl = req.query.url;
  if (!feedUrl) return res.status(400).json({ error: 'No URL provided' });

  // SECURITY: validate URL
  if (!isValidExternalUrl(feedUrl)) {
    return res.status(400).json({ error: 'Invalid or blocked URL' });
  }

  const cached = rssCache.get(feedUrl);
  if (cached && Date.now() - cached.timestamp < RSS_CACHE_TTL) {
    return res.json(cached.data);
  }

  try {
    const feed = await rssParser.parseURL(feedUrl);
    const data = {
      title: feed.title || '',
      items: (feed.items || []).slice(0, 20).map(item => ({
        title: item.title || '',
        link: item.link || '',
        date: item.pubDate || item.isoDate || '',
        source: feed.title || '',
        contentSnippet: (item.contentSnippet || item.content || '').replace(/<[^>]*>/g, '').slice(0, 200).trim(),
        image: item.enclosure?.url || ''
      }))
    };
    rssCache.set(feedUrl, { data, timestamp: Date.now() });
    res.json(data);
  } catch (err) {
    console.error('RSS fetch failed:', err.message);
    res.json({ title: '', items: [], error: err.message });
  }
});

// ============================================
// API: TODOS
// ============================================
app.get('/api/todos', (req, res) => {
  try { res.json({ todos: readConfig().todos || [] }); } catch { res.json({ todos: [] }); }
});

app.post('/api/todos', (req, res) => {
  try {
    const config = readConfig();
    config.todos = req.body.todos || [];
    writeConfig(config);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================
// API: SCRATCHPAD
// ============================================
app.get('/api/scratchpad', (req, res) => {
  try {
    const text = fs.existsSync(SCRATCHPAD_PATH)
      ? fs.readFileSync(SCRATCHPAD_PATH, 'utf-8')
      : '';
    res.json({ text });
  } catch { res.json({ text: '' }); }
});

app.post('/api/scratchpad', (req, res) => {
  try {
    const { text } = req.body;
    if (typeof text !== 'string') return res.status(400).json({ error: 'Invalid' });
    if (text.length > 50000000) return res.status(400).json({ error: 'Too large (max 50MB)' });
    fs.writeFileSync(SCRATCHPAD_PATH, text, 'utf-8');
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================
// API: EVENTS (Calendar)
// ============================================
app.get('/api/events', (req, res) => {
  try { res.json({ events: readConfig().events || [] }); } catch { res.json({ events: [] }); }
});

app.post('/api/events', (req, res) => {
  try {
    const config = readConfig();
    config.events = req.body.events || [];
    writeConfig(config);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================
// API: CLIPBOARD (AirDrop)
// ============================================
app.get('/api/clipboard', (req, res) => {
  const since = parseInt(req.query.since) || 0;
  if (clipboardData.id > since && clipboardData.text) {
    res.json({ hasNew: true, text: clipboardData.text, id: clipboardData.id, timestamp: clipboardData.timestamp });
  } else {
    res.json({ hasNew: false, id: clipboardData.id });
  }
});

app.post('/api/clipboard', (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') return res.status(400).json({ error: 'No text' });
  if (text.length > 50000000) return res.status(400).json({ error: 'Too large (max 50MB)' });
  clipboardCounter++;
  clipboardData = { text, timestamp: Date.now(), id: clipboardCounter };
  res.json({ success: true, id: clipboardCounter });
});

app.delete('/api/clipboard', (req, res) => {
  clipboardData = { text: '', timestamp: 0, id: clipboardCounter };
  res.json({ success: true });
});

// ============================================
// API: CURRENCY (stub — user provides API)
// ============================================
app.get('/api/currency', async (req, res) => {
  const { amount, from, to } = req.query;
  if (!amount || !from || !to) return res.status(400).json({ error: 'Missing params' });

  try {
    const config = readConfig();

    // Try manual rates first
    if (config.currencyRates && config.currencyRates[`${from}_${to}`]) {
      const rate = config.currencyRates[`${from}_${to}`];
      return res.json({ result: (parseFloat(amount) * rate).toFixed(2), rate, source: 'manual' });
    }

    // Try configured API
    if (config.currencyApiUrl) {
      const url = config.currencyApiUrl
        .replace('{amount}', amount)
        .replace('{from}', from)
        .replace('{to}', to);
      const resp = await fetch(url);
      const data = await resp.json();
      return res.json({ result: data, source: 'api' });
    }

    // Try free Frankfurter API as default fallback
    const resp = await fetch(`https://api.frankfurter.dev/v1/latest?amount=${encodeURIComponent(amount)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
    if (resp.ok) {
      const data = await resp.json();
      const result = data.rates?.[to.toUpperCase()];
      if (result !== undefined) {
        return res.json({ result: result.toFixed(2), rate: (result / parseFloat(amount)).toFixed(4), from, to, source: 'frankfurter' });
      }
    }

    res.json({ error: 'No currency API configured', configured: false });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// ============================================
// API: TRANSLATE (stub — user provides API)
// ============================================
app.get('/api/translate', async (req, res) => {
  const { from, to, text } = req.query;
  if (!from || !to || !text) return res.status(400).json({ error: 'Missing params' });

  try {
    const config = readConfig();
    if (config.translateApiUrl) {
      const url = config.translateApiUrl
        .replace('{from}', from)
        .replace('{to}', to)
        .replace('{text}', encodeURIComponent(text));
      const resp = await fetch(url);
      const data = await resp.json();
      return res.json({ result: data, source: 'api' });
    }
    res.json({ error: 'No translate API configured. Add one in Settings → General.', configured: false });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// ============================================
// API: PLUGINS
// ============================================
app.get('/api/plugins', (req, res) => {
  try {
    const pluginDirs = fs.readdirSync(PLUGINS_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
    const plugins = [];
    for (const dir of pluginDirs) {
      const manifestPath = path.join(PLUGINS_DIR, dir, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
          manifest.id = dir;
          manifest.hasCSS = fs.existsSync(path.join(PLUGINS_DIR, dir, 'widget.css'));
          manifest.hasJS = fs.existsSync(path.join(PLUGINS_DIR, dir, 'widget.js'));
          plugins.push(manifest);
        } catch {}
      }
    }
    res.json({ plugins });
  } catch (err) {
    res.json({ plugins: [], error: err.message });
  }
});

app.get('/api/plugins/:id/code', (req, res) => {
  const id = req.params.id.replace(/[^a-zA-Z0-9_-]/g, '');
  const jsPath = path.join(PLUGINS_DIR, id, 'widget.js');
  if (!fs.existsSync(jsPath)) return res.status(404).json({ error: 'Plugin not found' });
  res.type('application/javascript').send(fs.readFileSync(jsPath, 'utf-8'));
});

app.delete('/api/plugins/:id', (req, res) => {
  const id = req.params.id.replace(/[^a-zA-Z0-9_-]/g, '');
  const pluginDir = path.join(PLUGINS_DIR, id);
  if (!fs.existsSync(pluginDir)) return res.status(404).json({ error: 'Plugin not found' });
  try {
    fs.rmSync(pluginDir, { recursive: true, force: true });
    // Also remove from config
    const config = readConfig();
    if (config.plugins) {
      config.plugins = config.plugins.filter(p => p.id !== id);
      writeConfig(config);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/plugins/install', async (req, res) => {
  const { url, manifest, code, css } = req.body;
  
  // Install from direct upload (manifest + code)
  if (manifest && code) {
    try {
      const parsed = typeof manifest === 'string' ? JSON.parse(manifest) : manifest;
      const id = (parsed.id || 'custom-' + Date.now()).replace(/[^a-zA-Z0-9_-]/g, '-');
      const pluginDir = path.join(PLUGINS_DIR, id);
      if (!fs.existsSync(pluginDir)) fs.mkdirSync(pluginDir, { recursive: true });
      parsed.id = id;
      fs.writeFileSync(path.join(pluginDir, 'manifest.json'), JSON.stringify(parsed, null, 2), 'utf-8');
      fs.writeFileSync(path.join(pluginDir, 'widget.js'), code, 'utf-8');
      if (css) fs.writeFileSync(path.join(pluginDir, 'widget.css'), css, 'utf-8');
      
      // Add to config plugins list
      const config = readConfig();
      if (!config.plugins) config.plugins = [];
      if (!config.plugins.find(p => p.id === id)) {
        config.plugins.push({ id, enabled: true });
        writeConfig(config);
      }
      res.json({ success: true, plugin: parsed });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
    return;
  }
  
  // Install from URL (download manifest.json, widget.js, widget.css)
  if (url) {
    if (!isValidExternalUrl(url)) return res.status(400).json({ error: 'Invalid URL' });
    try {
      const baseUrl = url.endsWith('/') ? url : url + '/';
      const manifestResp = await fetch(baseUrl + 'manifest.json');
      if (!manifestResp.ok) throw new Error('Could not fetch manifest.json');
      const manifestData = await manifestResp.json();
      const id = (manifestData.id || 'custom-' + Date.now()).replace(/[^a-zA-Z0-9_-]/g, '-');
      const pluginDir = path.join(PLUGINS_DIR, id);
      if (!fs.existsSync(pluginDir)) fs.mkdirSync(pluginDir, { recursive: true });
      manifestData.id = id;
      fs.writeFileSync(path.join(pluginDir, 'manifest.json'), JSON.stringify(manifestData, null, 2), 'utf-8');
      
      const jsResp = await fetch(baseUrl + 'widget.js');
      if (jsResp.ok) fs.writeFileSync(path.join(pluginDir, 'widget.js'), await jsResp.text(), 'utf-8');
      
      const cssResp = await fetch(baseUrl + 'widget.css').catch(() => null);
      if (cssResp && cssResp.ok) fs.writeFileSync(path.join(pluginDir, 'widget.css'), await cssResp.text(), 'utf-8');
      
      const config = readConfig();
      if (!config.plugins) config.plugins = [];
      if (!config.plugins.find(p => p.id === id)) {
        config.plugins.push({ id, enabled: true });
        writeConfig(config);
      }
      res.json({ success: true, plugin: manifestData });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
    return;
  }
  
  res.status(400).json({ error: 'Provide url or manifest+code' });
});

// ============================================
// API: DOCKER
// ============================================
const DOCKER_NAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/;

function dockerAvailable() {
  return safeExecFile('docker', ['version', '--format', '{{.Server.Version}}'], 4000);
}

app.get('/api/docker', (req, res) => {
  try {
    const version = dockerAvailable();
    if (!version) {
      return res.json({ available: false, containers: [], images: 0 });
    }

    const psOut = safeExecFile('docker', [
      'ps', '-a', '--no-trunc',
      '--format', '{{.ID}}\t{{.Names}}\t{{.Image}}\t{{.State}}\t{{.Status}}\t{{.Ports}}'
    ], 8000);

    const containers = (psOut || '').split('\n').filter(Boolean).map(line => {
      const [id, name, image, state, status, ports] = line.split('\t');
      return {
        id: (id || '').slice(0, 12),
        name: name || '',
        image: image || '',
        state: state || '',
        status: status || '',
        ports: ports || ''
      };
    });

    const imagesOut = safeExecFile('docker', ['images', '-q'], 8000);
    const images = imagesOut ? imagesOut.split('\n').filter(Boolean).length : 0;

    res.json({
      available: true,
      version,
      running: containers.filter(c => c.state === 'running').length,
      total: containers.length,
      containers,
      images
    });
  } catch (err) {
    res.json({ available: false, containers: [], images: 0, error: err.message });
  }
});

app.get('/api/docker/stats', (req, res) => {
  try {
    if (!dockerAvailable()) return res.json({ available: false, stats: [] });
    const out = safeExecFile('docker', [
      'stats', '--no-stream',
      '--format', '{{.ID}}\t{{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}'
    ], 15000);
    const stats = (out || '').split('\n').filter(Boolean).map(line => {
      const [id, name, cpu, mem, memPerc] = line.split('\t');
      return { id: (id || '').slice(0, 12), name, cpu, mem, memPerc };
    });
    res.json({ available: true, stats });
  } catch (err) {
    res.json({ available: false, stats: [], error: err.message });
  }
});

app.post('/api/docker/control', (req, res) => {
  const { action, container } = req.body || {};
  const allowed = ['start', 'stop', 'restart', 'pause', 'unpause'];
  if (!allowed.includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }
  if (!container || typeof container !== 'string' || !DOCKER_NAME_RE.test(container)) {
    return res.status(400).json({ error: 'Invalid container name/ID' });
  }
  try {
    const out = safeExecFile('docker', [action, container], 30000);
    if (out === null) return res.status(500).json({ error: `docker ${action} failed` });
    res.json({ success: true, output: out });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/docker/logs/:id', (req, res) => {
  const id = req.params.id;
  if (!DOCKER_NAME_RE.test(id)) return res.status(400).json({ error: 'Invalid container ID' });
  try {
    // ID is strictly validated by DOCKER_NAME_RE above — safe to interpolate
    const out = safeExecCmd(`docker logs --tail 100 ${id} 2>&1`, 10000);
    res.json({ logs: out !== null ? out : '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// API: HEALTH (for Docker HEALTHCHECK / monitoring)
// ============================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: Math.round(process.uptime()), version: '2.0.0' });
});

// ============================================
// MOBILE DETECTION
// ============================================
app.get('/mobile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'mobile.html'));
});

// Fallback — serve index.html
app.get('*', (req, res) => {
  // Check if mobile user-agent
  const ua = req.headers['user-agent'] || '';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  if (isMobile && !req.path.startsWith('/api/') && req.path === '/') {
    return res.sendFile(path.join(__dirname, 'public', 'mobile.html'));
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server — bind to 0.0.0.0 for LAN access
app.listen(PORT, '0.0.0.0', () => {
  const interfaces = os.networkInterfaces();
  let lanIp = 'localhost';
  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        lanIp = iface.address;
        break;
      }
    }
  }
  console.log(`\n  🚀 Startpage v3 running at:`);
  console.log(`     Local:   http://localhost:${PORT}`);
  console.log(`     Network: http://${lanIp}:${PORT}\n`);
});
