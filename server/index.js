import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const PORT = 3721

// 火山引擎即梦AI配置
const VOLC_AK = process.env.VOLC_ACCESS_KEY || ''
const VOLC_SK = process.env.VOLC_SECRET_KEY || ''
const VOLC_HOST = 'visual.volcengineapi.com'
const VOLC_REGION = 'cn-north-1'
const VOLC_SERVICE = 'cv'

// 火山引擎 HMAC-SHA256 签名
function hmacSha256(key, data) {
  return crypto.createHmac('sha256', key).update(data).digest()
}
function sha256Hex(data) {
  return crypto.createHash('sha256').update(data).digest('hex')
}

function volcSign(method, queryString, headers, body, date) {
  const dateStamp = date.toISOString().replace(/[-:]/g, '').slice(0, 8)
  const amzDate = date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const credentialScope = `${dateStamp}/${VOLC_REGION}/${VOLC_SERVICE}/request`

  const signedHeaders = 'content-type;host;x-content-sha256;x-date'
  const payloadHash = sha256Hex(body)

  const canonicalRequest = [
    method,
    '/',
    queryString,
    `content-type:application/json\nhost:${VOLC_HOST}\nx-content-sha256:${payloadHash}\nx-date:${amzDate}\n`,
    signedHeaders,
    payloadHash,
  ].join('\n')

  const stringToSign = [
    'HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n')

  let signingKey = hmacSha256(VOLC_SK, dateStamp)
  signingKey = hmacSha256(signingKey, VOLC_REGION)
  signingKey = hmacSha256(signingKey, VOLC_SERVICE)
  signingKey = hmacSha256(signingKey, 'request')

  const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex')

  return {
    authorization: `HMAC-SHA256 Credential=${VOLC_AK}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    amzDate,
    payloadHash,
  }
}

async function volcRequest(action, body) {
  const bodyStr = JSON.stringify(body)
  const queryString = `Action=${action}&Version=2022-08-31`
  const date = new Date()
  const { authorization, amzDate, payloadHash } = volcSign('POST', queryString, {}, bodyStr, date)

  console.log('volcRequest:', action, 'body:', bodyStr.slice(0, 100))
  const res = await fetch(`https://${VOLC_HOST}/?${queryString}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Host': VOLC_HOST,
      'X-Date': amzDate,
      'X-Content-Sha256': payloadHash,
      'Authorization': authorization,
    },
    body: bodyStr,
  })
  const data = await res.json()
  console.log('volcResponse:', JSON.stringify(data).slice(0, 200))
  return data
}

// 即梦AI 提交生图任务
async function jimengSubmit(prompt, opts = {}) {
  const body = {
    req_key: 'jimeng_t2i_v40',
    prompt,
    force_single: true,
    width: opts.width || 1024,
    height: opts.height || 1024,
  }
  if (opts.seed !== undefined) body.seed = opts.seed
  if (opts.scale !== undefined) body.scale = opts.scale
  return volcRequest('CVSync2AsyncSubmitTask', body)
}

// 即梦AI 查询任务结果
async function jimengQuery(taskId) {
  return volcRequest('CVSync2AsyncGetResult', {
    req_key: 'jimeng_t2i_v40',
    task_id: taskId,
    req_json: JSON.stringify({ return_url: true }),
  })
}
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
          'https://api.cloudflare.com/client/v4/accounts/123a93e0eb008d56cf542e2605401162/ai/run/@cf/qwen/qwen3-30b-a3b-fp8',
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
                  content: `你是一个3D图标设计顾问。用户输入功能名称或概念，你分析并输出JSON。

## 分析步骤

1. 场景还原：这个概念在现实中是什么场景？
   - "无人机飞手" → 一个人站在户外草地上，双手拿着遥控器，抬头看天上的无人机
   - "云存储" → 抽象概念，没有具象场景，用隐喻物体表达（云朵+文件夹）
   - "外卖骑手" → 一个人骑着电动车，后座有外卖箱

2. 判断类型：
   - 具象场景（有真实物理空间）→ 从场景中提取关键物体
   - 抽象概念（没有物理对应）→ 用常见隐喻物体表达

3. 提取元素：
   - 涉及人物时：描述人物的动作和姿态（自然、有动感），不要臆测穿着
     正确："双手操控遥控器的人" / "骑车送餐的人"
     错误："穿飞行服的飞手"（飞手不穿飞行服）/ "戴墨镜的人"（没提到墨镜）
   - 不涉及人物时：用具体物体，带明确修饰词
     正确："四旋翼航拍无人机" / "打开的文件夹"
     错误："无人机"（太泛）/ "文件"（太泛）
   - 人物姿态要自然有动感，不要僵硬站立

4. 空间布局：元素之间符合现实逻辑的位置关系，每个元素独立完整，不要物理融合

## 输出格式
严格JSON，不要思考过程：
{
  "scene_type": "具象" 或 "抽象",
  "scene_desc": "一句话描述还原的真实场景",
  "elements": ["元素1", "元素2"],
  "layout": "元素间的空间位置关系",
  "subject": "图标主体场景描述"
}`
                },
                { role: 'user', content: prompt }
              ],
            }),
          }
        )

        const aiData = await aiRes.json()
        // Support both Workers AI formats
        const rawResponse = aiData?.result?.response || aiData?.result?.choices?.[0]?.message?.content
        let text = (typeof rawResponse === 'string') ? rawResponse : JSON.stringify(rawResponse || '')
        // Strip thinking tags
        text = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
        console.log('AI text (first 200):', text.slice(0, 200))

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
            scene_type: parsed.scene_type || '',
            scene_desc: parsed.scene_desc || '',
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

  // 翻译提示词为英文
  if (req.method === 'POST' && req.url === '/api/translate') {
    let body = ''
    req.on('data', c => body += c)
    req.on('end', async () => {
      try {
        const { text } = JSON.parse(body)
        if (!text) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: '请提供文本' })); return }
        const aiRes = await fetch(
          'https://api.cloudflare.com/client/v4/accounts/123a93e0eb008d56cf542e2605401162/ai/run/@cf/qwen/qwen3-30b-a3b-fp8',
          {
            method: 'POST',
            headers: { 'Authorization': 'Bearer bWggTDaHE-qlLszuwZJc-RD40bxRYAuO4pPj-gzz', 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [
                { role: 'system', content: '你是一个专业翻译，将用户输入的中文3D图标描述提示词翻译为英文。保持所有技术术语和风格描述的准确性。只输出翻译结果，不要输出其他内容，不要输出思考过程。' },
                { role: 'user', content: text }
              ],
            }),
          }
        )
        const aiData = await aiRes.json()
        let translated = String(aiData?.result?.response || aiData?.result?.choices?.[0]?.message?.content || '')
        translated = translated.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ translated }))
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: '翻译失败: ' + e.message }))
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

  // 生图历史 - 获取
  if (req.method === 'GET' && req.url === '/api/gen-history') {
    const h = readJSON('gen-history.json', [])
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(h))
    return
  }

  // 生图历史 - 保存
  if (req.method === 'POST' && req.url === '/api/gen-history') {
    let body = ''
    req.on('data', c => body += c)
    req.on('end', () => {
      try {
        const entry = JSON.parse(body)
        const h = readJSON('gen-history.json', [])
        h.unshift(entry)
        if (h.length > 100) h.length = 100
        writeJSON('gen-history.json', h)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true }))
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: e.message }))
      }
    })
    return
  }

  // 生图历史 - 清空
  if (req.method === 'DELETE' && req.url === '/api/gen-history') {
    writeJSON('gen-history.json', [])
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  // 即梦AI - 提交生图任务
  if (req.method === 'POST' && req.url === '/api/generate') {
    let body = ''
    req.on('data', c => body += c)
    req.on('end', async () => {
      try {
        const { prompt, width, height, seed } = JSON.parse(body)
        if (!prompt) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: '请提供提示词' })); return }
        const result = await jimengSubmit(prompt, { width: width || 1024, height: height || 1024, seed })
        if (result.code === 10000 && result.data?.task_id) {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ task_id: result.data.task_id }))
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: result.message || '提交失败', code: result.code }))
        }
      } catch (e) {
        console.error('Generate error:', e)
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: '生图请求失败: ' + e.message }))
      }
    })
    return
  }

  // 即梦AI - 查询生图结果
  if (req.method === 'POST' && req.url === '/api/generate/result') {
    let body = ''
    req.on('data', c => body += c)
    req.on('end', async () => {
      try {
        const { task_id } = JSON.parse(body)
        if (!task_id) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: '请提供task_id' })); return }
        const result = await jimengQuery(task_id)
        if (result.code === 10000) {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({
            status: result.data?.status || 'unknown',
            images: result.data?.image_urls || [],
          }))
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: result.message || '查询失败', code: result.code }))
        }
      } catch (e) {
        console.error('Generate result error:', e)
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: '查询失败: ' + e.message }))
      }
    })
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
})

server.listen(PORT, () => console.log(`XHS Collector (browser mode) running on http://localhost:${PORT}`))
