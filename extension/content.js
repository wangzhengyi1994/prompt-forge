/**
 * Content script - 从小红书页面提取笔记数据
 */

function extractNoteData() {
  let data = null;

  // 方法1: 从 __INITIAL_STATE__ 提取
  try {
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      const text = script.textContent || '';
      const match = text.match(/window\.__INITIAL_STATE__\s*=\s*({.+})/s);
      if (match) {
        const cleaned = match[1].replace(/\bundefined\b/g, 'null');
        const state = JSON.parse(cleaned);
        const noteMap = state?.note?.noteDetailMap || state?.note?.noteData?.noteDetailMap || {};
        const firstKey = Object.keys(noteMap)[0];
        if (firstKey) {
          const note = noteMap[firstKey]?.note || noteMap[firstKey];
          if (note) {
            const tags = (note.tagList || []).map(t => t.name || t).filter(Boolean);
            const hashTags = ((note.desc || '').match(/#([^#\s]+)#/g) || []).map(t => t.replace(/#/g, ''));
            data = {
              title: note.title || '',
              content: note.desc || '',
              tags: [...new Set([...tags, ...hashTags])],
              images: (note.imageList || []).map(img =>
                typeof img === 'string' ? img : (img.urlDefault || img.url || img.infoList?.[0]?.url || '')
              ).filter(Boolean),
              source: '小红书',
              sourceUrl: location.href,
            };
          }
        }
        break;
      }
    }
  } catch (e) {
    console.warn('[PromptForge] __INITIAL_STATE__ parse failed:', e);
  }

  // 方法2: 从 DOM 提取
  if (!data) {
    const title = document.querySelector('#detail-title')?.textContent?.trim()
      || document.querySelector('.title')?.textContent?.trim()
      || document.querySelector('meta[property="og:title"]')?.content
      || '';

    const content = document.querySelector('#detail-desc .note-text')?.textContent?.trim()
      || document.querySelector('.desc')?.textContent?.trim()
      || document.querySelector('meta[property="og:description"]')?.content
      || '';

    const imgElements = document.querySelectorAll('.slide-item img, .note-image img, .carousel img');
    const images = [...imgElements].map(img => img.src).filter(Boolean);

    const tagElements = document.querySelectorAll('.tag, a[href*="/search_result/"]');
    const tags = [...tagElements].map(el => el.textContent?.replace('#', '').trim()).filter(Boolean);

    if (title || content) {
      data = { title, content, tags, images, source: '小红书', sourceUrl: location.href };
    }
  }

  return data;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'extract') {
    const data = extractNoteData();
    sendResponse(data || { error: '无法从当前页面提取笔记内容' });
  }
  return true; // async response
});
