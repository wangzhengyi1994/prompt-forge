import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const PORT = 3721
const DATA_DIR = path.join(import.meta.dirname || '.', 'data')
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

function readJSON(file, fallback = []) {
  try { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf-8')) } catch { return fallback }
}
function writeJSON(file, data) {
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2))
}
const CDP_URL = 'http://127.0.0.1:18800'

// Use CDP to open a page in the existing logged-in browser and extract note data
async function collectViaBuilder(url) {
  // Get available targets
  const targetsRes = await fetch(`${CDP_URL}/json/list`)
  const targets = await targetsRes.json()

  // Find an existing XHS tab or create new one
  let target = targets.find(t => t.url?.includes('xiaohongshu.com') && !t.url.includes('/404'))

  if (!target) {
    // Create a new tab (Chrome 145+ requires PUT)
    let newRes = await fetch(`${CDP_URL}/json/new?${encodeURIComponent('https://www.xiaohongshu.com/explore')}`, { method: 'PUT' })
    if (!newRes.ok) {
      // Fallback to GET for older Chrome
      newRes = await fetch(`${CDP_URL}/json/new?${encodeURIComponent('https://www.xiaohongshu.com/explore')}`)
    }
    target = await newRes.json()
    await sleep(3000)
  }

  // Connect via WebSocket
  const ws = await connectWs(target.webSocketDebuggerUrl)

  try {
    // Enable page events and navigate
    await cdpSend(ws, 'Page.enable', {})
    await cdpSend(ws, 'Page.navigate', { url })
    await sleep(4000)

    // Extract data via JS evaluation
    const result = await cdpSend(ws, 'Runtime.evaluate', {
      expression: `(function() {
        try {
          // Check if we got 404
          if (location.href.includes('/404')) return JSON.stringify({ error: '笔记不存在或链接已失效' });

          var scripts = document.querySelectorAll('script');
          for (var i = 0; i < scripts.length; i++) {
            var m = scripts[i].textContent.match(/window\\.__INITIAL_STATE__\\s*=\\s*({.+})/s);
            if (m) {
              var j = m[1].replace(/\\bundefined\\b/g, 'null');
              var state = JSON.parse(j);
              var noteMap = state && state.note && state.note.noteDetailMap;
              if (noteMap) {
                var key = Object.keys(noteMap)[0];
                if (key) {
                  var note = noteMap[key].note || noteMap[key];
                  return JSON.stringify({
                    title: note.title || '',
                    content: note.desc || '',
                    tags: (note.tagList || []).map(function(t) { return t.name || t; }).filter(Boolean),
                    images: (note.imageList || []).map(function(i) { return i.urlDefault || i.url || ''; }).filter(Boolean),
                    source: '小红书',
                    sourceUrl: location.href
                  });
                }
              }
            }
          }

          // Fallback: DOM extraction
          var title = '';
          var titleEl = document.querySelector('#detail-title') || document.querySelector('.title');
          if (titleEl) title = titleEl.textContent.trim();
          var descEl = document.querySelector('#detail-desc .note-text') || document.querySelector('.desc');
          var content = descEl ? descEl.textContent.trim() : '';
          var ogTitle = document.querySelector('meta[property="og:title"]');
          var ogDesc = document.querySelector('meta[property="og:description"]');
          if (!title && ogTitle) title = ogTitle.content;
          if (!content && ogDesc) content = ogDesc.content;

          if (title || content) {
            return JSON.stringify({ title: title, content: content, tags: [], images: [], source: '小红书', sourceUrl: location.href });
          }

          return JSON.stringify({ error: '无法从页面提取内容' });
        } catch(e) { return JSON.stringify({ error: e.message }); }
      })()`,
      returnByValue: true,
    })

    const data = JSON.parse(result.result?.value || '{"error":"eval failed"}')
    return data
  } finally {
    ws.close()
  }
}

// Simple WebSocket CDP client
function connectWs(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl)
    ws._id = 1
    ws._callbacks = {}
    ws.onopen = () => resolve(ws)
    ws.onerror = (e) => reject(e)
    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data)
      if (data.id && ws._callbacks[data.id]) {
        ws._callbacks[data.id](data.result)
        delete ws._callbacks[data.id]
      }
    }
  })
}

function cdpSend(ws, method, params = {}) {
  return new Promise((resolve) => {
    const id = ws._id++
    ws._callbacks[id] = resolve
    ws.send(JSON.stringify({ id, method, params }))
  })
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// Parse plain text
function parseText(text) {
  const lines = text.trim().split('\n').filter(Boolean)
  const title = lines[0] || ''
  const content = lines.slice(1).join('\n').trim() || lines[0] || ''
  const tags = []
  const tagMatches = text.match(/#([^#\s]+)/g)
  if (tagMatches) tags.push(...tagMatches.map(t => t.replace('#', '')))
  return { title, content, tags, images: [], source: '小红书' }
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  if (req.method === 'POST' && req.url === '/api/collect') {
    let body = ''
    req.on('data', c => body += c)
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body)
        let result

        if (payload.url && (payload.url.includes('xiaohongshu.com') || payload.url.includes('xhslink.com'))) {
          // Use browser automation
          result = await collectViaBuilder(payload.url)
        } else if (payload.text) {
          result = parseText(payload.text)
        } else if (payload.data) {
          result = { ...payload.data, source: '小红书' }
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: '请提供 url, text, 或 data' }))
          return
        }

        // Rewrite image URLs to go through proxy
        if (result.images?.length) {
          result.images = result.images.map(url => `/api/img?url=${encodeURIComponent(url)}`)
        }

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(result))
      } catch (e) {
        console.error('Collect error:', e)
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: '采集失败: ' + e.message }))
      }
    })
    return
  }

  // AI concept analysis
  if (req.method === 'POST' && req.url === '/api/analyze') {
    let body = ''
    req.on('data', c => body += c)
    req.on('end', async () => {
      try {
        const { title, desc, count = 3 } = JSON.parse(body)
        if (!title) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: '请提供标题' })); return }

        const prompt = desc
          ? `概念: "${title}"\n描述: "${desc}"\n要求拆解为${count}个元素`
          : `概念: "${title}"\n要求拆解为${count}个元素`

        const aiRes = await fetch(
          'https://api.cloudflare.com/client/v4/accounts/123a93e0eb008d56cf542e2605401162/ai/run/@cf/meta/llama-3.1-8b-instruct',
          {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer bWggTDaHE-qlLszuwZJc-RD40bxRYAuO4pPj-gzz',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [
                {
                  role: 'system',
                  content: `你是一个专业的3D图标设计顾问。用户会输入一个功能名称或概念，你需要：
1. 理解这个概念的核心含义
2. 将其拆解为用户指定数量的具体的、可以被3D建模的视觉元素
3. 每个元素要具体到可以做成图标的物体（如"飞机"而不是"飞行"）
4. 描述元素之间符合现实逻辑的空间关系（如"旁边悬浮着"、"放置在…上方"），绝对不能把不相关的元素硬融合成一个物体
5. 给出设计思路说明

核心原则：元素组合必须符合现实逻辑和物理常识。每个元素保持独立完整的外形，通过空间位置关系（旁边、上方、环绕等）来表达概念关联，而不是物理融合。
错误示例：把时钟嵌入无人机机身里 → 变成"带表盘的无人机"
正确示例：无人机悬浮在空中，旁边有一个独立的时钟

严格按以下JSON格式输出，不要输出其他内容：
{
  "elements": ["元素1", "元素2", "元素3"],
  "layout": "用一句话描述元素之间的空间布局关系",
  "reasoning": "简要说明为什么这样拆解",
  "subject": "一句话描述图标主体场景"
}`
                },
                { role: 'user', content: prompt }
              ],
            }),
          }
        )

        const aiData = await aiRes.json()
        const text = aiData.result?.response || ''

        // Parse JSON from response
        let parsed
        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/)
          parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null
        } catch { parsed = null }

        if (parsed?.elements) {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({
            elements: parsed.elements,
            reasoning: parsed.reasoning || '',
            subject: parsed.subject || title,
          }))
        } else {
          // Fallback: return title as subject
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({
            elements: [title],
            reasoning: 'AI分析未返回有效结果，使用原始标题',
            subject: title,
          }))
        }
      } catch (e) {
        console.error('Analyze error:', e)
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: '分析失败: ' + e.message }))
      }
    })
    return
  }

  // Image proxy to bypass hotlink protection
  if (req.method === 'GET' && req.url.startsWith('/api/img?')) {
    const imgUrl = new URL(req.url, 'http://localhost').searchParams.get('url')
    if (!imgUrl) { res.writeHead(400); res.end('missing url'); return }
    try {
      const imgRes = await fetch(imgUrl, {
        headers: {
          'Referer': 'https://www.xiaohongshu.com/',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      })
      res.writeHead(200, {
        'Content-Type': imgRes.headers.get('content-type') || 'image/webp',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      })
      const buf = Buffer.from(await imgRes.arrayBuffer())
      res.end(buf)
    } catch (e) {
      res.writeHead(500); res.end('proxy failed')
    }
    return
  }

  // 历史记录 - 获取
  if (req.method === 'GET' && req.url === '/api/history') {
    const history = readJSON('history.json', [])
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(history))
    return
  }

  // 历史记录 - 保存
  if (req.method === 'POST' && req.url === '/api/history') {
    let body = ''
    req.on('data', c => body += c)
    req.on('end', () => {
      try {
        const entry = JSON.parse(body)
        const history = readJSON('history.json', [])
        history.unshift({ ...entry, id: Date.now() })
        if (history.length > 200) history.length = 200
        writeJSON('history.json', history)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true }))
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: e.message }))
      }
    })
    return
  }

  // 历史记录 - 清空
  if (req.method === 'DELETE' && req.url === '/api/history') {
    writeJSON('history.json', [])
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
})

server.listen(PORT, () => console.log(`XHS Collector (browser mode) running on http://localhost:${PORT}`))
