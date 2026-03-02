import http from 'node:http'

const PORT = 3721

// Parse XHS note data from raw HTML (provided by extension or copy-paste)
function parseXhsHtml(html) {
  let result = { title: '', content: '', tags: [], images: [], source: '小红书' }

  // Try __INITIAL_STATE__
  const stateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.+?})\s*<\/script>/s)
  if (stateMatch) {
    try {
      const jsonStr = stateMatch[1].replace(/\bundefined\b/g, 'null')
      const state = JSON.parse(jsonStr)
      const noteMap = state?.note?.noteDetailMap
      if (noteMap) {
        const firstNote = Object.values(noteMap)[0]?.note
        if (firstNote) {
          result.title = firstNote.title || ''
          result.content = firstNote.desc || ''
          result.tags = (firstNote.tagList || []).map(t => t.name).filter(Boolean)
          result.images = (firstNote.imageList || []).map(img => img.urlDefault || img.url).filter(Boolean)
          return result
        }
      }
    } catch (e) {
      console.error('Parse __INITIAL_STATE__ failed:', e.message)
    }
  }

  // Fallback: meta tags
  const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/)
  const ogDesc = html.match(/<meta[^>]*(?:property="og:description"|name="description")[^>]*content="([^"]*)"/)
  const ogImage = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"/)

  result.title = ogTitle?.[1] || ''
  result.content = ogDesc?.[1] || ''
  if (ogImage?.[1]) result.images = [ogImage[1]]

  const hashTags = result.content.match(/#([^#\s]+)/g)
  if (hashTags) result.tags = hashTags.map(t => t.replace('#', ''))

  return result
}

// Parse plain text (user copy-pasted note content)
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
        if (payload.html) {
          // Extension sends raw HTML
          result = parseXhsHtml(payload.html)
        } else if (payload.text) {
          // User pastes plain text
          result = parseText(payload.text)
        } else if (payload.data) {
          // Extension sends pre-parsed data
          result = { ...payload.data, source: '小红书' }
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: '请提供 html, text, 或 data 字段' }))
          return
        }

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(result))
      } catch (e) {
        console.error('Collect error:', e)
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: '解析失败: ' + e.message }))
      }
    })
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
})

server.listen(PORT, () => console.log(`XHS Collector running on http://localhost:${PORT}`))
