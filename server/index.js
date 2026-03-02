import http from 'node:http'

const PORT = 3721
const CDP_URL = 'http://127.0.0.1:18800'

// Use CDP to open a page in the existing logged-in browser and extract note data
async function collectViaBuilder(url) {
  // Get available targets
  const targetsRes = await fetch(`${CDP_URL}/json/list`)
  const targets = await targetsRes.json()

  // Find an existing XHS tab or create new one
  let target = targets.find(t => t.url?.includes('xiaohongshu.com/explore') && !t.url.includes('/404'))

  if (!target) {
    // Create a new tab
    const newRes = await fetch(`${CDP_URL}/json/new?${encodeURIComponent('https://www.xiaohongshu.com/explore')}`)
    target = await newRes.json()
    await sleep(2000)
  }

  // Connect via WebSocket
  const ws = await connectWs(target.webSocketDebuggerUrl)

  try {
    // Navigate to the note URL
    await cdpSend(ws, 'Page.navigate', { url })
    await sleep(3000)

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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
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

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
})

server.listen(PORT, () => console.log(`XHS Collector (browser mode) running on http://localhost:${PORT}`))
