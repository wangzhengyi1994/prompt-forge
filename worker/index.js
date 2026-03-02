/**
 * Cloudflare Worker - 小红书笔记采集代理
 * POST /api/collect { url: "https://www.xiaohongshu.com/explore/xxx" }
 * Returns { title, content, tags, images, source: '小红书' }
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

/**
 * Parse __INITIAL_STATE__ from HTML
 */
function parseInitialState(html) {
  const match = html.match(/window\.__INITIAL_STATE__\s*=\s*({.+?})\s*<\/script>/s);
  if (!match) return null;

  try {
    // 小红书的 __INITIAL_STATE__ 中可能包含 undefined, 需要替换
    const cleaned = match[1].replace(/\bundefined\b/g, 'null');
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

/**
 * Extract note data from __INITIAL_STATE__
 */
function extractFromState(state) {
  try {
    const noteMap = state?.note?.noteDetailMap || state?.note?.noteData?.noteDetailMap || {};
    const firstKey = Object.keys(noteMap)[0];
    if (!firstKey) return null;

    const noteDetail = noteMap[firstKey]?.note || noteMap[firstKey];
    if (!noteDetail) return null;

    const title = noteDetail.title || '';
    const content = noteDetail.desc || '';
    const tags = (noteDetail.tagList || []).map(t => t.name || t).filter(Boolean);
    const images = (noteDetail.imageList || []).map(img => {
      if (typeof img === 'string') return img;
      return img.urlDefault || img.url || img.infoList?.[0]?.url || '';
    }).filter(Boolean);

    // Also extract tags from desc (#xxx#)
    const hashTags = (content.match(/#([^#\s]+)#/g) || []).map(t => t.replace(/#/g, ''));
    const allTags = [...new Set([...tags, ...hashTags])];

    return { title, content, tags: allTags, images, source: '小红书' };
  } catch {
    return null;
  }
}

/**
 * Fallback: extract from meta tags
 */
function extractFromMeta(html) {
  const getMetaContent = (property) => {
    const re = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']*)["']`, 'i');
    const alt = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${property}["']`, 'i');
    return (html.match(re)?.[1] || html.match(alt)?.[1] || '').trim();
  };

  const title = getMetaContent('og:title') || getMetaContent('title') || '';
  const content = getMetaContent('og:description') || getMetaContent('description') || '';
  const ogImage = getMetaContent('og:image');
  const images = ogImage ? [ogImage] : [];

  // Extract hashtags from content
  const tags = (content.match(/#([^#\s]+)/g) || []).map(t => t.replace('#', ''));

  if (!title && !content) return null;
  return { title, content, tags, images, source: '小红书' };
}

/**
 * Normalize xiaohongshu URL
 */
function isValidXhsUrl(url) {
  try {
    const u = new URL(url);
    return (
      u.hostname.includes('xiaohongshu.com') ||
      u.hostname.includes('xhslink.com')
    );
  } catch {
    return false;
  }
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (url.pathname === '/api/collect' && request.method === 'POST') {
      let body;
      try {
        body = await request.json();
      } catch {
        return jsonResponse({ error: '无效的请求体' }, 400);
      }

      const targetUrl = body.url?.trim();
      if (!targetUrl) {
        return jsonResponse({ error: '请提供 url 参数' }, 400);
      }

      if (!isValidXhsUrl(targetUrl)) {
        return jsonResponse({ error: '仅支持小红书链接' }, 400);
      }

      try {
        const resp = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          },
          redirect: 'follow',
        });

        if (!resp.ok) {
          return jsonResponse({ error: `请求失败: HTTP ${resp.status}` }, 502);
        }

        const html = await resp.text();

        // Try __INITIAL_STATE__ first
        const state = parseInitialState(html);
        let result = state ? extractFromState(state) : null;

        // Fallback to meta tags
        if (!result) {
          result = extractFromMeta(html);
        }

        if (!result) {
          return jsonResponse({ error: '无法解析页面内容, 可能需要登录或页面结构已变更' }, 422);
        }

        return jsonResponse(result);
      } catch (err) {
        return jsonResponse({ error: `采集失败: ${err.message}` }, 500);
      }
    }

    // Health check
    if (url.pathname === '/' || url.pathname === '/health') {
      return jsonResponse({ status: 'ok', service: 'xhs-collector' });
    }

    return jsonResponse({ error: 'Not Found' }, 404);
  },
};
